import { readFileSync } from "node:fs";
import path from "node:path";

// Continuum currently decodes repository indexes with Go's encoding/json into
// protobuf-generated structs. That is not the same as protojson. Keep the
// catalog index minimal and do not copy full source plugin manifests here.
//
// In particular, config schemas contain AdminFormControl enum names such as
// ADMIN_FORM_CONTROL_PASSWORD. Those are valid in source manifests, but they
// make the repository index fail to decode before Continuum can list any
// plugin apps. The installed plugin package still carries the full manifest.
const manifestPath = new URL("../manifest.json", import.meta.url);
const checksumsPath = new URL("../checksums.txt", import.meta.url);

const catalogDisplayNotes = new Map([
  [
    "continuum.annas-archive-downloader",
    {
      displayName: "For Ebooks: Anna's Archive Downloader",
      description:
        "Requires continuum.ebooks for request intake and status display; provides ebook download/request fulfillment.",
    },
  ],
  [
    "continuum.arrouter",
    {
      displayName: "For Requests: Arr Router",
      description:
        "Requires continuum.requests; routes approved movie/TV requests to one of multiple Radarr/Sonarr targets.",
    },
  ],
  [
    "continuum.arrproxy",
    {
      displayName: "For Requests: Arr Proxy",
      description:
        "Requires continuum.requests; forwards approved movie/TV requests to a single Arr Proxy target.",
    },
  ],
  [
    "continuum.audiobookbay-requests",
    {
      displayName: "For Audiobooks: AudiobookBay Requests",
      description:
        "Requires continuum.audiobooks for request intake and status display; provides audiobook request fulfillment.",
    },
  ],
  [
    "continuum.audiobooks",
    {
      displayName: "Portal: Audiobooks",
      description:
        "Audiobook portal. Pair with continuum.local-audiobooks or continuum.bookwarehouse-audio for browse/playback content.",
    },
  ],
  [
    "continuum.bookwarehouse-audio",
    {
      displayName: "For Audiobooks: BookWarehouse Audio",
      description: "Requires continuum.audiobooks; provides a BookWarehouse audiobook backend.",
    },
  ],
  [
    "continuum.bookwarehouse-ebook",
    {
      displayName: "For Ebooks: BookWarehouse Ebook",
      description:
        "Requires continuum.ebooks; provides a Calibre/BookWarehouse ebook backend and request provider.",
    },
  ],
  [
    "continuum.ebooks",
    {
      displayName: "Portal: Ebooks",
      description:
        "Ebook portal. Pair with continuum.local-ebooks or continuum.bookwarehouse-ebook for browse/read content.",
    },
  ],
  [
    "continuum.guest-pass",
    {
      displayName: "For Continuum media: Guest Pass",
      description: "Requires Continuum content/playback routes; creates temporary scoped public links.",
    },
  ],
  [
    "continuum.local-audiobooks",
    {
      displayName: "For Audiobooks: Local Library",
      description:
        "Requires continuum.audiobooks; provides local audiobook catalog, metadata, and streaming.",
    },
  ],
  [
    "continuum.local-ebooks",
    {
      displayName: "For Ebooks: Local Library",
      description: "Requires continuum.ebooks; provides local ebook catalog, metadata, and file access.",
    },
  ],
  [
    "continuum.notifications",
    {
      displayName: "Observer: Notifications",
      description:
        "Optional observer; useful with event-producing plugins such as requests, routers, ebooks, and audiobooks.",
    },
  ],
  [
    "continuum.oidc-login",
    {
      displayName: "Auth: OIDC Login",
      description: "Requires an external OIDC identity provider; adds a Continuum auth provider.",
    },
  ],
  [
    "continuum.public-catalog",
    {
      displayName: "For Ebooks/Audiobooks: Public Catalog",
      description:
        "Requires configured Ebooks and/or Audiobooks installations to expose public catalog browsing links.",
    },
  ],
  [
    "continuum.requests",
    {
      displayName: "Portal: Requests",
      description: "Movie/TV request portal. Pair with continuum.arrouter or continuum.arrproxy for fulfillment.",
    },
  ],
  [
    "continuum.stream-dashboard",
    {
      displayName: "For active streams: Dashboard",
      description: "Requires Continuum playback/session activity; displays active streams and history.",
    },
  ],
  [
    "continuum.whmcs-login",
    {
      displayName: "Auth: WHMCS Login",
      description: "Requires a WHMCS instance; adds a Continuum auth provider.",
    },
  ],
]);

const index = JSON.parse(readFileSync(manifestPath, "utf8"));
const checksumLines = readFileSync(checksumsPath, "utf8")
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

const checksums = new Map();
for (const line of checksumLines) {
  const match = line.match(/^([a-f0-9]{64})\s+\*?(.+)$/i);
  if (!match) {
    throw new Error(`Invalid checksum line: ${line}`);
  }
  checksums.set(path.basename(match[2]), match[1].toLowerCase());
}

if (!Array.isArray(index.plugins) || index.plugins.length === 0) {
  throw new Error("manifest.json must contain a non-empty plugins array");
}

const seen = new Set();
for (const pkg of index.plugins) {
  const manifest = pkg.manifest;
  if (!manifest?.plugin_id) {
    throw new Error("catalog package is missing manifest.plugin_id");
  }
  if (!manifest.version) {
    throw new Error(`${manifest.plugin_id} is missing manifest.version`);
  }
  if (!manifest.continuum_api_version) {
    throw new Error(`${manifest.plugin_id} is missing manifest.continuum_api_version`);
  }
  if (!Array.isArray(manifest.capabilities) || manifest.capabilities.length === 0) {
    throw new Error(`${manifest.plugin_id} must declare capabilities`);
  }
  const expectedDisplayNote = catalogDisplayNotes.get(manifest.plugin_id);
  const primaryCapability = manifest.capabilities[0];
  if (!expectedDisplayNote) {
    throw new Error(`${manifest.plugin_id} is missing from catalogDisplayNotes`);
  }
  if (primaryCapability.display_name !== expectedDisplayNote.displayName) {
    throw new Error(
      `${manifest.plugin_id} first capability display_name must be "${expectedDisplayNote.displayName}" for catalog dependency visibility`,
    );
  }
  if (primaryCapability.description !== expectedDisplayNote.description) {
    throw new Error(
      `${manifest.plugin_id} first capability description must preserve the catalog dependency note`,
    );
  }

  const key = `${manifest.plugin_id}@${manifest.version}`;
  if (seen.has(key)) {
    throw new Error(`duplicate catalog entry ${key}`);
  }
  seen.add(key);

  if (manifest.global_config_schema || manifest.user_config_schema) {
    throw new Error(`${key} includes config schemas; Continuum decodes catalog manifests with encoding/json`);
  }
  for (const capability of manifest.capabilities) {
    if (capability.config_schema) {
      throw new Error(`${key} capability ${capability.id ?? "(unknown)"} includes config_schema`);
    }
  }

  const binary = pkg.binaries?.["linux/amd64"];
  if (!binary?.url) {
    throw new Error(`${key} is missing linux/amd64 binary url`);
  }
  const filename = path.basename(new URL(binary.url).pathname);
  const expectedChecksum = checksums.get(filename);
  if (!expectedChecksum) {
    throw new Error(`${key} binary ${filename} is missing from checksums.txt`);
  }
  if (binary.checksum?.toLowerCase() !== expectedChecksum) {
    throw new Error(`${key} binary checksum does not match checksums.txt`);
  }
  if (manifest.checksum?.toLowerCase() !== expectedChecksum) {
    throw new Error(`${key} manifest checksum does not match checksums.txt`);
  }
}

console.log(`Validated ${index.plugins.length} catalog plugins`);
