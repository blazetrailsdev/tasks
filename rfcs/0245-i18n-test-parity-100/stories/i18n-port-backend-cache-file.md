---
title: "i18n: port I18n::Backend::CacheFile (its PERMANENT closure was mis-scoped)"
status: blocked
updated: 2026-11-17
rfc: "0245-i18n-test-parity-100"
cluster: backend-mixins
packages: [i18n]
deps:
  - i18n-load-file-mtime-at-preload-step
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: "needs i18n-load-file-mtime-at-preload-step: File.mtime has no sync source under async-only fs in Base#loadFile"
closed-reason: null
---

## Context

`port-i18n-backend-cache-file` (RFC 0193) was closed `PERMANENT`, citing
`I18n::Backend::Cache`'s async cache store. `CacheFile` uses neither.
`vendor/i18n/v1.14.8/lib/i18n/backend/cache_file.rb:17-25` overrides `load_file`: it compares
`File.mtime` and a SHA256 digest against a value stored with
`store_translations(:i18n, load_file: …)`, and skips the file if neither has
changed. `load_file` runs inside `load_translations`, which is the awaited
load step packages/i18n/CLAUDE.md § "A translation lookup is synchronous"
sanctions, so nothing async reaches `translate`.

- Test: `vendor/i18n/v1.14.8/test/backend/cache_file_test.rb` has 3 tests (`:19-60`) that count
  `store_translations` writes through a `CountWrites` module (`:5-16`).
- trails: `Base#loadFile` in `packages/i18n/lib/backend/base.ts`.
  `Flatten.escapeDefaultSeparator` is in `packages/i18n/lib/backend/flatten.ts`.
- Exclusion row: `backend/cache_file.rb` in `scripts/parity/unported-files/i18n.ts`.

### The mtime source (operator ruling, 2026-11-18, `i18n-load-file-mtime-at-preload-step`)

`preloadTranslationFiles` (`packages/i18n/lib/backend/base.ts`) also awaits
ruby-compat `File.mtimeAsync(filename)` (`packages/ruby-compat/lib/file.ts`)
and records it beside the preloaded contents; `CacheFile#loadFile` reads that
recorded value where `cache_file.rb:20` calls `File.mtime(filename).to_i`.
The SHA256 digest is taken synchronously over the preloaded contents. The
`File.mtime` call site carries the receipt. Existing trails tests that
register a `FileReader` over a path that does not exist (`mutable.yml` in
`base.file-loading.trails.test.ts`) must move to a real file or an fs
backend that answers `stat`.

## Acceptance criteria

- [ ] **Operator confirms RFC Open question 1** before work starts. If the
      closure stands, close this story `PERMANENT:` with the operator's reason.
- [ ] `packages/i18n/lib/backend/cache-file.ts` mirrors the Ruby file
      (`pathRoots` accessor, `loadFile`, `normalizedPath`).
- [ ] All 3 tests are ported under the Rails names, and the row is deleted.
