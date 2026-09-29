---
title: "Enroll rack-cache in parity:api and parity:test"
status: draft
updated: 2026-09-28
rfc: "0168-rack-cache-gem-port"
cluster: null
packages: ["rack-cache"]
deps: ["rack-cache-package-skeleton"]
deps-rfc: []
est-loc: 220
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Story 3 of the RFC. Register rack-cache at every point `rack-test` is
registered today. `PACKAGES` is derived from `vendor/sources.ts`, so the source
entry already enrolls it there. The rest are explicit lists:

- `scripts/api-compare/config.ts:180` `MANIFEST_PACKAGES`: add `"rack-cache"`
  beside `"rack-test"` (`:193`).
- `scripts/test-compare/compare.ts:1535` `pkgDirs`: add
  `"rack-cache": "packages/rack-cache/src/"`.
- `scripts/test-compare/generate-stubs.ts:32`: the same entry. RFC 0133 missed
  this one and needed `add-rack-session-to-generate-stubs-pkg-dirs` to catch up.
- `scripts/test-compare/extract-ts-tests.ts:21`: the package list.
- `scripts/test-compare/compare.ts` `rubyToConventionTs` (`rack-test` arm at
  `:139`): rack-cache's tests are flat `test/<name>_test.rb`, so the target is
  `cache_control_test.rb` → `cache-control.test.ts`,
  `meta_store_test.rb` → `meta-store.test.ts`, and so on for all ten. Check
  whether the default arm already does this before adding a package arm. If it
  does, add only the `compare.test.ts` cases.

**The skipped files.** The RFC skips `vendor/rack-cache/v1.17.0/lib/rack/cache/app_engine.rb`
(JRuby on Google App Engine, `:5-13`), the five deprecated alias files
(`appengine.rb`, `cachecontrol.rb`, `entitystore.rb`, `metastore.rb`, each
2 lines, and `lib/rack-cache.rb`), and the `MemCached` / `GAEStore` classes
inside `meta_store.rb:362-439` and `entity_store.rb:245-331`. Record the files
and classes through the file- or member-level skip that `parity:api` already
offers (`SKIP_GROUPS` / `SCOPED_SKIP_GROUPS` in `scripts/parity/conventions.ts`,
or whatever that module's current mechanism is), with the RFC's reason. That
way the `rack-cache` row does not carry permanent missing surface. Do not invent
a new skip mechanism. If none fits a whole file, say so in the PR and file it.

**Shared-example test names.** `RackCacheMetaStoreImplementation`
(`test/meta_store_test.rb:5`) and `RackCacheEntityStoreImplementation`
(`test/entity_store_test.rb:6`) are modules `include`d into several describes.
The extractor reports each shared case once, with no describe path (for
example `stores a cache entry`, `meta_store_test.rb:127`). Confirm the TS side
can credit a case defined in a shared-behaviour function called from several
`describe`s. If it cannot, that is an extractor finding to file, not a reason
to flatten the tests.

**`@internal`.** The extractor reports 40 of 158 methods internal. Run
`blazetrails/rails-private-jsdoc --fix` in this PR (RFC Open question 3), so
the manifest addition does not leave the `rails-comparison` job red.

Day-one baseline: `parity:api` reports `rack-cache` against 158 public methods,
minus the skipped files and classes, with only what the skeleton ported.
`parity:test` reports `rack-cache: 10 files, 226 tests` with none credited.
The Ruby suite has no `version_test.rb`, so the skeleton's `version.test.ts`
reads as a trails-only extra, as `packages/rack-test/src/version.test.ts` does.
Both numbers are honest, not a regression. Record them in the PR body.

## Acceptance criteria

- [ ] All five registrations above land in one PR, with `compare.test.ts` cases
      for the ten file mappings.
- [ ] `pnpm parity:api` prints a `rack-cache` row, and `pnpm parity:test` prints
      `rack-cache: 10 files, 226 tests`.
- [ ] `app_engine.rb`, the five alias files and the `MemCached` / `GAEStore`
      classes read as skipped, with a reason, not missing.
- [ ] The rails-private-jsdoc autofix runs in the same PR.
- [ ] `pnpm parity:api` / `parity:test` deltas for every other package are
      non-negative, and `pnpm parity:api:extra --package rack-cache` runs with no
      mark or baseline widened.

## Definition of done

Adding `rack-cache` to `GATED_PACKAGES` is not part of this story. Neither is
widening any baseline to absorb the day-one numbers.
