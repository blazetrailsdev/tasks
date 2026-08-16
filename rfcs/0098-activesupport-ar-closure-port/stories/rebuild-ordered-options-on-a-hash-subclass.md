---
title: "Rebuild OrderedOptions on a Hash subclass instead of a Map wrapper"
status: done
updated: 2026-08-16
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 320
priority: null
pr: 6611
claim: "2026-08-16T20:53:32Z"
assignee: "converge-references-values-to-sql-literals"
blocked-by: null
closed-reason: null
---

## Context

PR #6608 added the four missing members to
`packages/activesupport/src/ordered-options.ts` (`_get`,
`isExtractableOptions`, `ownKey`, `has` as Rails' `key?`, `isOverridden`) but
did NOT touch the class's underlying shape, which is a trails invention
predating the story.

`activesupport/lib/active_support/ordered_options.rb:33` is
`class OrderedOptions < Hash`: every Hash method IS the API, and the class
overrides only `[]=`, `[]`, `dig`, `method_missing`, `respond_to_missing?`,
`extractable_options?` and `inspect` (:37-70). `InheritableOptions` (:89-146)
subclasses it and leans on Hash's default-block (`super() { |h, k| @parent._get(k) }`)
for parent fallthrough — which is precisely why `_get` exists at :34.

trails instead wraps a private `Map` and hand-writes Hash's surface. That is
what `pnpm parity:api:extra --package activesupport` reports as
**ordered-options.ts — 2 novel, 9 moved**: `has`, `toObject`, `count`, `delete`,
`dup`, `entries`, `get`, `keys`, `set`, `size`, `values` — the most-divergent
activesupport file in the report. Two `Proxy` constructors (one per class)
re-implement `method_missing`'s `=` / `!` / bare arms and the parent
fallthrough by hand, and `InheritableOptions` carries its own `_parent` field
where Rails carries a Hash default block.

The newly-ported members sit on top of that invention: `_get` reads the Map
rather than aliasing the original `[]`, and `ownKey` calls `super.has` rather
than aliasing the un-overridden `key?`. They are faithful in name and behaviour
but not in mechanism, so the extra-surface count does not move.

## Converged shape

Decide what a Ruby `Hash` subclass is in trails and rebuild both classes on it,
so that the invented Map wrapper and its 11 extra names disappear:

- `OrderedOptions` overrides only the members Rails overrides; everything else
  comes from the Hash analogue.
- `InheritableOptions`'s parent fallthrough is the Hash default block, with
  `_get` as the fast path Rails documents at ordered_options.rb:93.
- The two `Proxy` constructors collapse into one `method_missing` shim mirroring
  ordered_options.rb:49-62.

Note the likely relationship to `HashWithIndifferentAccess`
(`hash-with-indifferent-access.ts`), which the same report shows at **0 novel,
20 moved** — whatever answer that class already has for "a Ruby Hash subclass in
TS" is the first thing to look at, and the two should share it rather than
inventing a second shape.

## Acceptance criteria

- [ ] `pnpm parity:api:extra --package activesupport` reports strictly fewer
      novel + moved names for `ordered-options.ts` than the 2 + 9 it reports
      today; every remaining one is either a Rails member or carries a
      `@noRailsEquivalent` reason.
- [ ] `OrderedOptions` and `InheritableOptions` override only the members
      ordered_options.rb:37-70 and :90-145 override.
- [ ] `pnpm parity:api:calls` / `:args` green with no new rows; the existing
      ordered-options tests keep their Rails names and pass unchanged.
