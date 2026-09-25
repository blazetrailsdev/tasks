---
title: "Route every vendor path construction through vendor/sources.ts"
status: ready
updated: 2026-09-25
rfc: "0000-versioned-vendor-layout"
cluster: vendor
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: 300
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/sources.ts` is the registry — `resolvePath(pkg, "lib"|"test")` (`:487-500`),
`vendoredRoot(name)` (`:517-522`) and the three manifests — and most tooling
reaches the tree through it or through `pnpm vendor:fetch --print-*-paths`. Twelve
places do not, and rebuild the path from a literal instead:

- `scripts/rails-find/core.ts:37-49` (test-dir map, 13 entries), `:53-65`
  (lib-dir map, 13 entries), `:78` `GREP_SCOPE`; display string at `bin.ts:16`
- `scripts/api-compare/ar-closure.ts:124,128` — `path.join(rootDir, "vendor/rails", …)`
- `scripts/build-rails-error-manifest.ts:93` — `path.join(ROOT, "vendor/rails", PKG_GEM[pkg], "lib")`
- `scripts/fixtures-compare/compare.ts:20` — `YML_DIR`
- `scripts/fixtures-compare/extract-ruby-models.rb:10,11` and the
  `delete_prefix` at `:144` (Ruby side; it receives paths by env var today for
  the lib dirs, so the same channel serves these)
- `scripts/generate-fixture-parity-map.ts:34` — `CASES_DIR`
- `scripts/schema-compare/compare.ts:46` — `SCHEMA_DIR` (plus the user-facing
  message at `:874`)
- `scripts/test-deps/rails-test-deps.ts:23` — `CASES_DIR`

Each is a second spelling of a registry answer, and each one breaks the moment the
clone root gains a version segment — so this lands **first**, and is worth landing
on its own merits: a hardcoded duplicate of the registry is exactly the kind of
shape the repo converges rather than propagates.

Some of these want a path the registry does not expose today (`test/schema`,
`test/fixtures`, `test/models`, the `activerecord` gem dir itself), so the story
includes widening `vendor/sources.ts` to answer them rather than each caller
guessing.

## Acceptance criteria

- No `.ts`, `.mjs` or `.rb` file outside `vendor/` builds a vendored path from a
  `"vendor/<source>"` literal: `git grep -n 'vendor/rails"' -- scripts eslint packages`
  returns nothing, and the same for the other ten source names.
- `vendor/sources.ts` exposes whatever those callers need (a gem-subdir resolver
  and/or named well-known dirs such as the AR test schema, fixtures and models
  dirs), each with a test in `vendor/sources.test.ts`.
- `scripts/rails-find/core.ts`'s two maps and `GREP_SCOPE` derive from `SOURCES`;
  its 13 package keys keep their current spellings and `core.test.ts` passes with
  no test-name change.
- `extract-ruby-models.rb` receives its dirs the way `extract-ruby-api.rb` already
  receives `LIB_PATHS_JSON` — by env var from the registry — and its `:144`
  `delete_prefix` is derived from the same value, not rebuilt.
- `pnpm parity:api`, `parity:test`, `parity:fixtures`, `parity:schema`,
  `pnpm rails:find <query>` and `pnpm test:deps` all produce byte-identical output
  to main.
- No path depth changes in this story.
