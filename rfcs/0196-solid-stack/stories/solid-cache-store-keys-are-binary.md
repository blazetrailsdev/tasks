---
title: "SolidCache Store keys are ASCII-8BIT bytes (normalize_key's .b)"
status: draft
updated: 2026-11-13
rfc: "0196-solid-stack"
cluster: solid-stack
packages: ["solid-cache", "activesupport"]
deps: ["port-solid-cache-entry-model-and-store"]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SolidCache::Store::Api#normalize_key` (`vendor/solid_cache/v1.0.7/lib/solid_cache/store/api.rb:139-141`) is `truncate_key super&.b`: a cache key is an ASCII-8BIT String, and `Entry.read_multi` / `lock_and_write` (`app/models/solid_cache/entry.rb:39-50,68-76`) compare the binary `key` column with it. Per CLAUDE.md § "A String has no encoding tag either", an ASCII-8BIT String is a `Uint8Array`. trails keeps the key a JS string (the `ActiveSupport::Cache::Store` base, `packages/activesupport/lib/cache/store.ts`, is string-keyed) and decodes the column in `packages/solid-cache/lib/entry.ts` (`readMulti`, `lockAndWrite`), receipted `CONVERGEABLE solid-cache-store-keys-are-binary`; `truncate_key` byte-slices through `TextEncoder`/`TextDecoder`.

## Acceptance criteria

- `normalizeKey` answers the `.b` bytes and `truncateKey` uses `byteslice` / `bytesize` on them, with the AS base store accepting a `Uint8Array` key where Rails passes one.
- The `decode` arms in `Entry.readMulti` / `lockAndWrite` and the `@missingRailsCall b` receipt are removed.
