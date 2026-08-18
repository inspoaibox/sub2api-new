package service

import (
	"context"
	"testing"

	"github.com/stretchr/testify/require"
)

type mediaModelsAccountRepoStub struct {
	AccountRepository
	accounts          []Account
	availabilityCalls int
	platforms         []string
}

func (s *mediaModelsAccountRepoStub) ListSchedulableByGroupID(context.Context, int64) ([]Account, error) {
	return append([]Account(nil), s.accounts...), nil
}

func (s *mediaModelsAccountRepoStub) ListModelAvailabilityCandidates(_ context.Context, _ *int64, platforms []string, _ bool) ([]Account, error) {
	s.availabilityCalls++
	s.platforms = append([]string(nil), platforms...)
	return append([]Account(nil), s.accounts...), nil
}

type mediaModelsRouteRepoStub struct {
	CompositeModelRouteRepository
	routes []CompositeModelRoute
}

func (s *mediaModelsRouteRepoStub) ListByGroup(context.Context, int64, bool) ([]CompositeModelRoute, error) {
	return append([]CompositeModelRoute(nil), s.routes...), nil
}

func TestGetAvailableMediaModelsUsesAccountMappings(t *testing.T) {
	groupID := int64(41)
	repo := &mediaModelsAccountRepoStub{accounts: []Account{
		{
			Platform: PlatformOpenAI,
			Credentials: map[string]any{
				"model_mapping": map[string]any{
					"gpt-image-2":   "gpt-image-2",
					"gpt-image-1.5": "gpt-image-1.5",
					"gpt-5.6":       "gpt-5.6",
				},
			},
		},
		{
			Platform: PlatformOpenAI,
			Credentials: map[string]any{
				"model_mapping": map[string]any{
					"gpt-image-1": "gpt-image-1",
				},
			},
		},
	}}
	svc := &GatewayService{
		accountRepo: repo,
	}

	models, err := svc.GetAvailableMediaModels(context.Background(), &groupID, PlatformOpenAI, MediaModelKindImage, nil)
	require.NoError(t, err)
	require.Equal(t, []string{"gpt-image-2", "gpt-image-1.5", "gpt-image-1"}, models)
	require.Equal(t, 1, repo.availabilityCalls)
	require.Equal(t, []string{PlatformOpenAI}, repo.platforms)
}

func TestGetAvailableMediaModelsUsesOfficialCatalogForEmptyGrokMapping(t *testing.T) {
	groupID := int64(42)
	svc := &GatewayService{
		accountRepo: &mediaModelsAccountRepoStub{accounts: []Account{{Platform: PlatformGrok}}},
	}

	images, err := svc.GetAvailableMediaModels(context.Background(), &groupID, PlatformGrok, MediaModelKindImage, nil)
	require.NoError(t, err)
	require.Equal(t, []string{"grok-imagine-image-quality", "grok-imagine-image"}, images)

	videos, err := svc.GetAvailableMediaModels(context.Background(), &groupID, PlatformGrok, MediaModelKindVideo, nil)
	require.NoError(t, err)
	require.Equal(t, []string{"grok-imagine-video", "grok-imagine-video-1.5-preview", "grok-imagine-video-1.5"}, videos)
}

func TestGetAvailableMediaModelsKeepsCustomOnlyMappingSorted(t *testing.T) {
	groupID := int64(44)
	svc := &GatewayService{
		accountRepo: &mediaModelsAccountRepoStub{accounts: []Account{{
			Platform: PlatformGrok,
			Credentials: map[string]any{
				"model_mapping": map[string]any{
					"z-image": "grok-imagine-image",
					"a-image": "grok-imagine-image-quality",
				},
			},
		}}},
	}

	models, err := svc.GetAvailableMediaModels(context.Background(), &groupID, PlatformGrok, MediaModelKindImage, nil)
	require.NoError(t, err)
	require.Equal(t, []string{"a-image", "z-image"}, models)
}

func TestGetAvailableMediaModelsIncludesCompositeImageRoutes(t *testing.T) {
	groupID := int64(43)
	resolver := NewCompositeRouteResolver(&mediaModelsRouteRepoStub{routes: []CompositeModelRoute{
		{
			PublicModel:    "brand-image",
			TargetPlatform: PlatformOpenAI,
			UpstreamModel:  "gpt-image-2",
			Endpoint:       CompositeRouteEndpointImages,
			Enabled:        true,
		},
		{
			PublicModel:    "brand-text",
			TargetPlatform: PlatformOpenAI,
			UpstreamModel:  "gpt-5.6",
			Endpoint:       CompositeRouteEndpointResponses,
			Enabled:        true,
		},
		{
			PublicModel:    "missing-grok-account",
			TargetPlatform: PlatformGrok,
			UpstreamModel:  "grok-imagine-image",
			Endpoint:       CompositeRouteEndpointImages,
			Enabled:        true,
		},
	}})
	svc := &GatewayService{
		accountRepo:       &mediaModelsAccountRepoStub{accounts: []Account{{Platform: PlatformOpenAI}}},
		compositeResolver: resolver,
	}

	models, err := svc.GetAvailableMediaModels(context.Background(), &groupID, PlatformComposite, MediaModelKindImage, nil)
	require.NoError(t, err)
	require.Contains(t, models, "brand-image")
	require.NotContains(t, models, "brand-text")
	require.NotContains(t, models, "missing-grok-account")
}
