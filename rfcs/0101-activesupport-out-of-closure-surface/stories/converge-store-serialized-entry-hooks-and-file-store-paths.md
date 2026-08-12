---
title: "converge-store-serialized-entry-hooks-and-file-store-paths"
status: done
updated: 2026-08-12
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6437
claim: "2026-08-12T20:36:47Z"
assignee: "converge-store-serialized-entry-hooks-and-file-store-paths"
blocked-by: null
closed-reason: null
---

## Context

Triaged in the `triage-partially-ported-out-of-closure-activesupport-residue`
PR. Rails splits every store's entry hooks in two: `read_entry`/`write_entry`
handle the Entry, and `read_serialized_entry`/`write_serialized_entry` handle
the payload bytes. trails' stores implement only the first half, so these stay
missing:

- NullStore — null_store.rb:41-55 (`read_entry` → `deserialize_entry(read_serialized_entry(key))`,
  `write_entry` → `write_serialized_entry(key, serialize_entry(entry))`).
- FileStore — file_store.rb:113-131, plus the private path helpers
  `cache_path` (file_store.rb:33), `file_path_key` (file_store.rb:189),
  `ensure_cache_path` (file_store.rb:204) and `search_dir` (file_store.rb:208),
  which trails currently spells with invented names (`keyToPath`, `realPath`,
  `clearDir`, `cleanupDir`, `deleteMatchedInDir` in
  packages/activesupport/src/cache/file-store.ts).
- MemoryStore — `cached_size` (memory_store.rb:198-200), which sizes the stored
  payload; trails stores live objects rather than payloads.

Depends on the Store coder layer (the sibling story for `default_serializer` /
`serialize_entry` / `deserialize_entry` / `validate_options`).

## Acceptance criteria

- Each store's entry hooks are split exactly as Rails splits them, with the
  Rails method names and bodies.
- FileStore's private path helpers carry the Rails names
  (`cachePath`, `filePathKey`, `ensureCachePath`, `searchDir`).
- `pnpm parity:api` delta non-negative.
