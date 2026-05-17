# RXWatcher Continuum Plugin Catalog

This repository is an installable Continuum plugin release catalog.

Continuum can read this URL as a remote plugin repository:

```text
https://raw.githubusercontent.com/RXWatcher/continuum-plugins/main/manifest.json
```

The catalog points to versioned GitHub release assets in this repository. Each
entry includes:

- the Continuum plugin manifest
- a Linux AMD64 binary URL
- an inline SHA-256 checksum
- a `checksums.txt` release asset for operators who want to verify downloads

## Included Plugins

- `continuum.annas-archive-downloader`
- `continuum.arrouter`
- `continuum.arrproxy`
- `continuum.audiobookbay-requests`
- `continuum.audiobooks`
- `continuum.bookwarehouse-audio`
- `continuum.bookwarehouse-ebook`
- `continuum.ebooks`
- `continuum.guest-pass`
- `continuum.local-audiobooks`
- `continuum.local-ebooks`
- `continuum.notifications`
- `continuum.oidc-login`
- `continuum.public-catalog`
- `continuum.requests`
- `continuum.stream-dashboard`
- `continuum.whmcs-login`

## Installing In Continuum

1. Open Continuum admin settings.
2. Go to Plugins.
3. Add a plugin repository with the manifest URL above.
4. Refresh the plugin catalog.
5. Install the plugin you need.

The current release assets are Linux AMD64 binaries. Other platforms can be
added by publishing more `plugin-<os>-<arch>-<name>` binaries and extending the
matching `binaries` entries in `manifest.json`.

## Source Mirror

The previous source mirror has been renamed to:

```text
https://github.com/RXWatcher/continuum-plugins-source
```
