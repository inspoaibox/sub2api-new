package provider

import (
	"strings"
	"testing"
)

func TestNewStripeRequiresCompleteConfiguration(t *testing.T) {
	base := map[string]string{
		"secretKey":      "sk_test_123",
		"publishableKey": "pk_test_123",
		"webhookSecret":  "whsec_123",
		"currency":       "CNY",
	}

	for _, key := range []string{"secretKey", "publishableKey", "webhookSecret"} {
		config := cloneStringMap(base)
		delete(config, key)
		_, err := NewStripe("test", config)
		if err == nil || !strings.Contains(err.Error(), key) {
			t.Fatalf("missing %s: error = %v", key, err)
		}
	}
}

func TestNewStripeRejectsKeyModeMismatch(t *testing.T) {
	config := map[string]string{
		"secretKey":      "sk_test_123",
		"publishableKey": "pk_live_123",
		"webhookSecret":  "whsec_123",
	}

	_, err := NewStripe("test", config)
	if err == nil || !strings.Contains(err.Error(), "mode mismatch") {
		t.Fatalf("expected mode mismatch error, got %v", err)
	}
}
