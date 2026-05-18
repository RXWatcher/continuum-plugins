# Catalog Maintenance

This repository is the installable Continuum plugin catalog for RXWatcher
plugins. Continuum reads:

```text
https://raw.githubusercontent.com/RXWatcher/continuum-plugins/main/manifest.json
```

## Compatibility Contract

Continuum's repository loader decodes `manifest.json` with Go's standard
`encoding/json` package into protobuf-generated structs. It does not use the
SDK's `protojson` manifest loader for repository indexes.

That means the catalog index must stay smaller than the full source plugin
manifests. Source plugin manifests may contain fields that are valid when loaded
from an installed plugin package but invalid in the repository index.

Known unsafe catalog fields:

- `manifest.global_config_schema`
- `manifest.user_config_schema`
- `manifest.capabilities[].config_schema`

These schema blocks include admin form enum values such as
`ADMIN_FORM_CONTROL_PASSWORD`. Those values are valid in source manifests, but
`encoding/json` cannot unmarshal them into protobuf enum fields, so Continuum
skips the entire repository as broken and shows no catalog apps.

Do not regenerate this catalog by blindly copying full `cmd/*/manifest.json`
files from plugin repositories.

## Expected Entry Shape

Each catalog entry should include enough data for list/install discovery:

```json
{
  "manifest": {
    "plugin_id": "continuum.example",
    "version": "1.0.0",
    "checksum": "<linux-amd64-binary-sha256>",
    "continuum_api_version": "v1",
    "capabilities": [
      {
        "type": "http_routes.v1",
        "id": "admin",
        "display_name": "Example Admin",
        "description": "Admin UI for the example plugin."
      }
    ]
  },
  "repo_url": "https://github.com/ContinuumApp/continuum-plugin-example",
  "checksums_url": "https://github.com/RXWatcher/continuum-plugins/releases/download/v1.0.0/checksums.txt",
  "binaries": {
    "linux/amd64": {
      "url": "https://github.com/RXWatcher/continuum-plugins/releases/download/v1.0.0/plugin-linux-amd64-example",
      "checksum": "<linux-amd64-binary-sha256>"
    }
  }
}
```

`http_routes`, `supported_platforms`, capability metadata, and inline checksums
are currently tolerated by Continuum when they decode cleanly. Keep them only
when they are useful for display or install behavior. The hard rule is that
config schema blocks do not belong in the catalog index.

## Release Checklist

1. Build every plugin binary for each published platform.
2. Generate `checksums.txt` from the exact release binaries.
3. Update `manifest.json` versions, release URLs, and checksums.
4. Ensure the catalog does not include config schema blocks.
5. Run the catalog validator:

```sh
node scripts/validate-catalog.mjs
```

6. If `/opt/continuum` is available locally, also verify the host decode path:

```sh
cat >/tmp/validate-continuum-catalog.go <<'GO'
package main

import (
	"encoding/json"
	"fmt"
	"os"

	pluginv1 "github.com/ContinuumApp/continuum-plugin-sdk/pkg/pluginproto/continuum/plugin/v1"
	publicmanifest "github.com/ContinuumApp/continuum-plugin-sdk/pkg/pluginsdk/manifest"
)

type PlatformBinary struct {
	URL      string `json:"url"`
	Checksum string `json:"checksum"`
}

type CatalogPackage struct {
	Manifest     *pluginv1.PluginManifest  `json:"manifest"`
	ChecksumsURL string                    `json:"checksums_url,omitempty"`
	Binaries     map[string]PlatformBinary `json:"binaries,omitempty"`
}

type RepositoryIndex struct {
	Plugins []CatalogPackage `json:"plugins"`
}

func main() {
	f, err := os.Open(os.Args[1])
	if err != nil {
		panic(err)
	}
	defer f.Close()

	var index RepositoryIndex
	if err := json.NewDecoder(f).Decode(&index); err != nil {
		panic(err)
	}
	for _, pkg := range index.Plugins {
		if err := publicmanifest.Validate(pkg.Manifest); err != nil {
			panic(fmt.Errorf("%s: %w", pkg.Manifest.GetPluginId(), err))
		}
	}
	fmt.Printf("decoded and validated %d plugins\n", len(index.Plugins))
}
GO

cd /opt/continuum
go run /tmp/validate-continuum-catalog.go /opt/continuum_plugins/rxwatcher-continuum-plugin-catalog/manifest.json
```

7. Push only this catalog repository unless explicitly asked to push another
   repository.
8. Read back the published raw manifest and validate it:

```sh
curl -fsSL https://raw.githubusercontent.com/RXWatcher/continuum-plugins/main/manifest.json \
  -o /tmp/rxwatcher-continuum-plugins-manifest.json

cd /opt/continuum
go run /tmp/validate-continuum-catalog.go /tmp/rxwatcher-continuum-plugins-manifest.json
```

## Troubleshooting

If Continuum cannot see any apps from this repository, check the Continuum logs
for:

```text
skipping broken plugin repository
```

The most likely cause is a repository-index decode error. Common examples:

- String protobuf enum values in catalog JSON.
- Full config schema blocks copied from plugin source manifests.
- Invalid JSON in `manifest.json`.

Fix the catalog first, then refresh the plugin repository in Continuum.
