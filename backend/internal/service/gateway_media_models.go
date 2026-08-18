package service

import (
	"context"
	"sort"
	"strings"
)

const (
	MediaModelKindImage = "image"
	MediaModelKindVideo = "video"
)

// GetAvailableMediaModels returns client-facing models that can be submitted to
// the native image/video endpoints for the selected group. The public model ID
// matters here: OpenAI validates it before account-level mapping, while Grok
// can accept a mapped alias when the account mapping points at an Imagine model.
func (s *GatewayService) GetAvailableMediaModels(
	ctx context.Context,
	groupID *int64,
	platform string,
	kind string,
	candidates []string,
) ([]string, error) {
	kind = strings.ToLower(strings.TrimSpace(kind))
	if kind != MediaModelKindImage && kind != MediaModelKindVideo {
		return nil, nil
	}

	accounts, err := s.listMediaModelAvailabilityAccounts(ctx, groupID, platform)
	if err != nil {
		return nil, err
	}

	seen := make(map[string]struct{})
	add := func(model string) {
		model = strings.TrimSpace(model)
		if model == "" || strings.Contains(model, "*") {
			return
		}
		if _, exists := seen[model]; !exists {
			seen[model] = struct{}{}
		}
	}

	// An empty model_mapping means passthrough/default support for the account.
	// Seed the official media catalog in that case. Explicit mappings are handled
	// below so a text-only account does not advertise image/video models.
	for _, account := range accounts {
		mapping := account.GetModelMapping()
		if len(mapping) == 0 || !hasConfiguredModelMapping(&account) {
			for _, model := range defaultMediaModelIDs(account.Platform, kind) {
				add(model)
			}
			continue
		}
		for publicModel, upstreamModel := range mapping {
			if mediaMappingSupports(account.Platform, kind, publicModel, upstreamModel) {
				add(publicModel)
			}
		}
	}

	// Group model-list selections may include a newer model that is not yet in
	// the built-in catalog. Keep it only when at least one configured account can
	// support the submitted public ID.
	for _, candidate := range candidates {
		candidate = strings.TrimSpace(candidate)
		if candidate == "" || strings.Contains(candidate, "*") || !mediaModelIDMatches(kind, candidate) {
			continue
		}
		for _, account := range accounts {
			mapped := strings.TrimSpace(account.GetMappedModel(candidate))
			if mapped == "" {
				mapped = candidate
			}
			if mediaMappingSupports(account.Platform, kind, candidate, mapped) {
				add(candidate)
				break
			}
		}
	}

	if platform == PlatformComposite && s.compositeResolver != nil && groupID != nil {
		routes, routeErr := s.compositeResolver.ListRoutes(ctx, *groupID)
		if routeErr != nil {
			return nil, routeErr
		}
		for _, route := range routes {
			if !route.Enabled || !compositeMediaRouteMatchesKind(route, kind) {
				continue
			}
			upstreamModel := strings.TrimSpace(route.UpstreamModel)
			if upstreamModel == "" {
				upstreamModel = route.PublicModel
			}
			if compositeMediaRouteSupported(accounts, route.TargetPlatform, kind, upstreamModel) {
				add(route.PublicModel)
			}
		}
	}

	// Return stable, useful ordering: official defaults first, then custom IDs.
	defaults := defaultMediaModelIDs(platform, kind)
	models := make([]string, 0, len(seen))
	for _, model := range defaults {
		if _, ok := seen[model]; ok {
			models = append(models, model)
			delete(seen, model)
		}
	}
	customStart := len(models)
	for model := range seen {
		models = append(models, model)
	}
	sort.Strings(models[customStart:])
	return models, nil
}

func (s *GatewayService) listMediaModelAvailabilityAccounts(ctx context.Context, groupID *int64, platform string) ([]Account, error) {
	if s == nil || s.accountRepo == nil {
		return nil, nil
	}
	platforms := mediaModelPlatforms(platform)
	if len(platforms) == 0 {
		return []Account{}, nil
	}

	// Model discovery describes the configured account pool. It must not use
	// the request scheduler's transient filters, otherwise a temporary rate
	// limit or overload makes a model disappear from the workbench.
	return s.accountRepo.ListModelAvailabilityCandidates(ctx, groupID, platforms, true)
}

func mediaModelPlatforms(platform string) []string {
	switch platform {
	case PlatformOpenAI, PlatformGrok:
		return []string{platform}
	case "", PlatformComposite:
		// Composite groups contain concrete OpenAI/Grok accounts and expose
		// their media routes through one public group.
		return []string{PlatformOpenAI, PlatformGrok}
	default:
		return nil
	}
}

func compositeMediaRouteSupported(accounts []Account, platform, kind, model string) bool {
	platform = strings.TrimSpace(platform)
	model = strings.TrimSpace(model)
	if platform == "" || model == "" {
		return false
	}
	for i := range accounts {
		account := &accounts[i]
		if account.Platform != platform || !account.IsModelSupported(model) {
			continue
		}
		mapped := strings.TrimSpace(account.GetMappedModel(model))
		if mediaMappingSupports(account.Platform, kind, model, mapped) {
			return true
		}
	}
	return false
}

func hasConfiguredModelMapping(account *Account) bool {
	if account == nil || account.Credentials == nil {
		return false
	}
	switch mapping := account.Credentials["model_mapping"].(type) {
	case map[string]any:
		return len(mapping) > 0
	case map[string]string:
		return len(mapping) > 0
	default:
		return false
	}
}

func defaultMediaModelIDs(platform, kind string) []string {
	switch platform {
	case PlatformOpenAI:
		if kind == MediaModelKindImage {
			return []string{"gpt-image-2", "gpt-image-1.5", "gpt-image-1"}
		}
	case PlatformGrok:
		if kind == MediaModelKindImage {
			return []string{"grok-imagine-image-quality", "grok-imagine-image"}
		}
		if kind == MediaModelKindVideo {
			return []string{"grok-imagine-video", "grok-imagine-video-1.5-preview", "grok-imagine-video-1.5"}
		}
	case PlatformComposite:
		models := make([]string, 0)
		for _, concrete := range []string{PlatformOpenAI, PlatformGrok} {
			models = append(models, defaultMediaModelIDs(concrete, kind)...)
		}
		return models
	}
	return nil
}

func mediaMappingSupports(platform, kind, publicModel, upstreamModel string) bool {
	publicModel = strings.TrimSpace(publicModel)
	upstreamModel = strings.TrimSpace(upstreamModel)
	if publicModel == "" || upstreamModel == "" || !mediaModelIDMatches(kind, upstreamModel) {
		return false
	}
	if platform == PlatformOpenAI {
		// ParseOpenAIImagesRequest validates the public ID before mapping.
		return mediaModelIDMatches(kind, publicModel)
	}
	if platform == PlatformGrok {
		return true
	}
	return mediaModelIDMatches(kind, publicModel)
}

func mediaModelIDMatches(kind, model string) bool {
	model = strings.ToLower(strings.TrimSpace(model))
	for _, prefix := range []string{"xai/", "x-ai/", "grok/"} {
		model = strings.TrimPrefix(model, prefix)
	}
	switch kind {
	case MediaModelKindImage:
		return strings.HasPrefix(model, "gpt-image-") ||
			strings.HasPrefix(model, "grok-imagine-image") ||
			model == "grok-imagine" || model == "grok-imagine-edit"
	case MediaModelKindVideo:
		return strings.HasPrefix(model, "grok-imagine-video") || strings.HasPrefix(model, "grok-video")
	default:
		return false
	}
}

func compositeMediaRouteMatchesKind(route CompositeModelRoute, kind string) bool {
	endpoint := strings.ToLower(strings.TrimSpace(route.Endpoint))
	if endpoint != "" && endpoint != CompositeRouteEndpointAny {
		return kind == MediaModelKindImage && endpoint == CompositeRouteEndpointImages
	}
	return true
}
