---
title: "Cache::Coder packs its header with pack(PACKED_TEMPLATE), so load passes byteslice to load_version"
status: claimed
updated: 2026-09-25
rfc: "0153-naming-residue-ratchet-and-burndown"
cluster: null
packages: ["activesupport", "ruby-compat"]
deps: []
deps-rfc: []
est-loc: 250
priority: 50
pr: null
claim: "2026-09-25T15:40:17Z"
assignee: "naming-activesupport-cache-coder-packed-header"
blocked-by: null
closed-reason: null
---

## Context

Split from `naming-residue-burndown-activesupport-structural` by the LOC ceiling. The last activesupport `burndown` naming row in `cache/coder.ts`:

- `load` `load_version`: Rails passes `dumped.byteslice(PACKED_VERSION_INDEX, version_length)` (`vendor/rails/activesupport/lib/active_support/cache/coder.rb:50-56`). trails passes `rawVersion` out of a `JSON.stringify([type, expiresAt, version])` header (`packages/activesupport/src/cache/coder.ts` `dumpCompressed` / `load`).

The row is the visible end of a wire-format divergence. Rails packs the header with `[type, expires_at, version_length].pack(PACKED_TEMPLATE)` (`"CEl<"`, `coder.rb:44,77-82`) and reads it back with `unpack1` at fixed offsets (`PACKED_TYPE_TEMPLATE`, `PACKED_EXPIRES_AT_TEMPLATE`, `PACKED_VERSION_LENGTH_TEMPLATE`, `PACKED_VERSION_INDEX`). The version and payload come after it as raw bytes. trails has none of those constants. `dump_version` / `load_version` (`coder.rb:141-155`) also have a Marshal arm that trails' identity `dumpVersion` / `loadVersion` drop, and `STRING_ENCODINGS` / `StringDeserializer` (`:69-94`) are collapsed to one `STRING_TYPE`.

`@blazetrails/ruby-compat`'s `pack` (`packages/ruby-compat/src/array.ts`) supports only `m` and `U`, so porting the header needs the `C`, `E` and `l<` directives in `pack`, plus an `unpack1` with the `@` offset directive (`vendor/ruby/pack.c`).

## Acceptance criteria

- [ ] `Coder#dump_compressed` / `#load` build and read the header with `pack(PACKED_TEMPLATE)` / `unpack1`, at Rails' constants, and `load` calls `loadVersion(byteslice(dumped, PACKED_VERSION_INDEX, versionLength))`.
- [ ] The ruby-compat `pack` / `unpack1` directives it needs are ported from `vendor/ruby/pack.c`, each with a test checked against `ruby`.
- [ ] `pnpm parity:api:calls:args:report` shows no `cache/coder.ts` naming row.
