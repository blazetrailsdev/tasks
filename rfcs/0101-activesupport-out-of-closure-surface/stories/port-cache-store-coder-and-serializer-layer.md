---
title: "port-cache-store-coder-and-serializer-layer"
status: done
updated: 2026-08-12
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6440
claim: "2026-08-12T22:16:47Z"
assignee: "port-cache-store-coder-and-serializer-layer"
blocked-by: null
closed-reason: null
---

## Context

Triaged in the `triage-partially-ported-out-of-closure-activesupport-residue`
PR. `ActiveSupport::Cache::Store`'s serializer/coder layer is unported, which
is what leaves these members missing on the api-compare denominator:

- `default_serializer` — cache.rb:764-773 (`Cache::SerializerWithFallback[:marshal_7_0]`
  / `:marshal_7_1`, keyed off `Cache.format_version`, which trails now ports at
  `packages/activesupport/src/cache.ts`).
- `serialize_entry` — cache.rb:806-813 (`@coder.dump_compressed` / `@coder.dump`).
- `deserialize_entry` — cache.rb:815-819 (`@coder.load`, `DeserializationError`
  rescued as a miss).
- `validate_options` — cache.rb:912-925 (raises ArgumentError for
  `:serializer` + `:coder`, `:compressor` + `:coder`, and `:compressor` with the
  default serializer under `format_version < 7.1`); called from
  `Store#initialize`, cache.rb:296.

trails' `Store` (packages/activesupport/src/cache/store.ts) stores live `Entry`
objects and has no `@coder`, so the subclass entry hooks
(`read_serialized_entry` / `write_serialized_entry` on FileStore null_store.rb:41-55,
file_store.rb:113-131) cannot be converged until this layer exists.
`packages/activesupport/src/cache/serializer-with-fallback.ts` and `coder.ts`
already exist and are the pieces to wire in.

## Acceptance criteria

- `defaultSerializer`, `serializeEntry`, `deserializeEntry` and `validateOptions`
  exist on `Store` with the Rails bodies and are called from the Rails call
  sites (`initialize`, the entry read/write paths).
- `Cache.formatVersion()` drives `defaultSerializer`'s branch, per cache.rb:764-773.
- `pnpm parity:api` delta non-negative; activesupport cache.rb missing count drops.
