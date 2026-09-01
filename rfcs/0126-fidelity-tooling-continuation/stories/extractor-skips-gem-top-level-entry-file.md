---
title: "api-compare: the Ruby extractor never reads a gem's top-level entry file (arel.rb), so arel.ts scores as novel"
status: done
updated: 2026-09-01
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: 2
pr: 7341
claim: "2026-09-01T16:00:48Z"
assignee: "metaprogrammed-method-bodies-invisible-to-call-gates"
blocked-by: null
closed-reason: null
---

## Context

`vendor/sources.ts:69-72` gives the `arel` package
`libPath: "activerecord/lib/arel"` — a **directory**. Rails also ships a
top-level `activerecord/lib/arel.rb` defining `module Arel` itself, with the
public module functions `Arel.arel_node?` (`arel.rb:64`), `Arel.fetch_attribute`
(`arel.rb:68`), `Arel.sql`, and `Arel.star`. Because the libPath names only the
directory, the Ruby extractor never reads `arel.rb`, so it is absent from
`scripts/api-compare/output/rails-api.json` entirely.

Verified while working PR #7148: every `PackageEntry` in `SOURCES` maps one lib
**directory** per package, so a gem's top-level entry file is invisible by
construction. `activerecord/lib/active_record.rb`, `activemodel/lib/active_model.rb`
and the other framework entry files are in the same position.

The consequence is not just a missing count. `packages/arel/src/arel.ts` scores
as "[no Rails counterpart]", so its members land as **novel** extra surface
rather than matching the Ruby they actually port. Today that is masked by
`@internal` tags on `arelNode` / `fetchAttribute`, which drop them from the
measured surface — the tag is hiding an EXTRACTION gap, not a fidelity one.

This blocks `arel-enroll-unbacked-internal-receipt` (RFC 0124): that story
cannot delete those two unearned `@internal` tags, because deleting them
re-enters the members into scoring as novel and reds the RFC 0117 only-shrink
extra-surface gate (`pnpm parity:api:extra:gate`, arel novel 0/0). Enrollment in
`blazetrails/unbacked-internal-needs-receipt` is only-grow and must be green on
day one, so the extraction fix has to land first.

## Converged shape

Teach `PackageEntry` to carry the gem's top-level entry file alongside its lib
directory — e.g. an optional `libEntryFile` (`"activerecord/lib/arel.rb"`) —
and have `scripts/api-compare/extract-ruby-api.rb` read it as part of the
package. Then map it TS-side: `arel.rb` -> `packages/arel/src/arel.ts` via
`RUBY_FILE_TS_OVERRIDES` in `scripts/parity/conventions.ts` (the last-segment
default would otherwise collide with the `arel/` directory itself).

Expect movement in arel's measured numbers when it lands — file count goes
69 -> 70 and the extra-surface marks shift as `arel.ts` starts scoring — so
`pnpm parity:api:extra:tighten` may be needed. Marks are written DOWN only;
never raise one to absorb this.

## Acceptance criteria

- `vendor/sources.ts` can express a package's top-level entry file, and `arel`
  declares `activerecord/lib/arel.rb`.
- `rails-api.json` contains `arel.rb` with `arel_node?` and `fetch_attribute`.
- `packages/arel/src/arel.ts` scores against `arel.rb` rather than as
  "[no Rails counterpart]"; `arelNode` / `fetchAttribute` are no longer novel.
- `pnpm parity:api:extra:gate` green (tighten if the marks end up above the
  measurement; never a mark raise).
- Note in the body which other packages the same gap affects, or file a
  follow-up per package.
