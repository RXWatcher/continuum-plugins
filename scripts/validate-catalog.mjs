import { readFileSync } from "node:fs";
import path from "node:path";

const manifestPath = new URL("../manifest.json", import.meta.url);
const checksumsPath = new URL("../checksums.txt", import.meta.url);

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
