---
title: "A token-renamed class (ERBTracker -> TSETracker) scores as novel extra surface"
status: draft
updated: 2026-09-09
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:extra --package actionview` scores the class `TSETracker`
(`packages/actionview/src/dependency-tracker/tse-tracker.ts`) as **novel extra
surface**, even though Rails defines its counterpart in the matched file and
`pnpm parity:api` reports the pair at **13/13, 0 missing**:

```text
  dependency-tracker/tse-tracker.ts — 1 novel, 0 moved
    TSETracker
```

The Ruby class is `ActionView::DependencyTracker::ERBTracker`
(`vendor/rails/actionview/lib/action_view/dependency_tracker/erb_tracker.rb:5`,
extracted into `rails-api.json` under that key). `TOKEN_RENAMES` in
`scripts/parity/conventions.ts:43` maps `ERB` -> `TSE`, which turns `ERBTracker`
into exactly `TSETracker` — so the name the extractor should be matching on is
the name that is there.

The sibling in the same file layout isolates the cause. `WildcardResolver`
(`dependency-tracker/wildcard-resolver.ts`, Ruby
`ActionView::DependencyTracker::WildcardResolver`) is nested one level under
`DependencyTracker` exactly as `ERBTracker` is, is reported at 6/6, and does
**not** appear in the extra list. The only difference between the two is that
one name goes through a token rename and the other does not, so nesting depth
and file mapping are ruled out: `TOKEN_RENAMES` is not being applied when the
extra-surface extractor matches a CLASS declaration against its Ruby
counterpart, though it is applied when matching members (all 13 of `TSETracker`'s
members credit).

Surfaced by trails#7633. actionview is not in `GATED_PACKAGES`, so this is not
red today — but it is a false `novel` on the ratchet's own metric, it inflates
the count any future actionview enrollment would have to burn down, and the same
bug will fire for every other `ERB` -> `TSE` class rename in the package
(`Template::Handlers::ERB` -> `handlers/tse.ts` is the next one).

## Converged shape

Apply `TOKEN_RENAMES` on the class-declaration matching path in the
extra-surface extractor, the same way it is already applied to member names, so
a Ruby class whose renamed spelling is present in the matched TS file is scored
`Allowed` rather than `novel`.

The fix is in the extractor, NOT a receipt: a `@noRailsEquivalent` on
`TSETracker` would be false — Rails does define this class — and would red as a
STALE tag once the extractor is corrected.

## Acceptance criteria

- `pnpm parity:api:extra --package actionview` no longer lists `TSETracker` as
  novel; `dependency-tracker/tse-tracker.ts` reports 0 novel, 0 moved.
- A regression test in `scripts/api-compare/` covers a token-renamed class name
  (Ruby `ERBTracker` / TS `TSETracker`) scoring `Allowed`.
- `pnpm parity:api:extra:gate` stays green for every gated package, and any
  gated package whose `novel` or `total` DROPS is tightened with
  `pnpm parity:api:extra:tighten` in the same PR — the marks are only-shrink,
  so a correction that lowers a measurement leaves a stale mark behind.
- `pnpm parity:api --package actionview` deltas stay non-negative.
