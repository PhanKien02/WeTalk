package services

// Service defines a microservice with a single base URL shared across all its API versions (v1, v2, v3...)
type Service struct {
	Name               string   `json:"name"`                // e.g. "auth", "user"
	PathPrefix         string   `json:"path_prefix"`         // e.g. "auth", "users"
	URL                string   `json:"url"`                 // Shared Base URL for all versions
	RequireAuth        bool     `json:"require_auth"`        // Whether JWT authentication is required
	SupportedVersions  []string `json:"supported_versions"`  // e.g. ["v1", "v2", "v3"]
	DeprecatedVersions []string `json:"deprecated_versions"` // e.g. ["v1"]
}

// Services alias for backward compatibility
type Services = Service

// IsSupported checks if a version is supported by the service
func (s *Service) IsSupported(version string) bool {
	for _, v := range s.SupportedVersions {
		if v == version {
			return true
		}
	}
	return false
}

// IsDeprecated checks if a version is marked as deprecated
func (s *Service) IsDeprecated(version string) bool {
	for _, v := range s.DeprecatedVersions {
		if v == version {
			return true
		}
	}
	return false
}

// NewServiceRegistry returns the services list with base URLs shared across all API versions
func NewServiceRegistry(authURL, userURL string, requireAuthForUsers bool) []Service {
	versions := []string{"v1", "v2", "v3"}

	return []Service{
		{
			Name:               "auth",
			PathPrefix:         "auth",
			URL:                authURL,
			RequireAuth:        false,
			SupportedVersions:  versions,
			DeprecatedVersions: []string{},
		},
		{
			Name:               "user",
			PathPrefix:         "users",
			URL:                userURL,
			RequireAuth:        requireAuthForUsers,
			SupportedVersions:  versions,
			DeprecatedVersions: []string{},
		},
	}
}
