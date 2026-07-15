---
title: "Converge the three ActiveModel::Attribute predicates in arel onto instanceof"
status: claimed
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-07-15T02:21:13Z"
assignee: "arel-am-attribute-predicates-diverge-across-sites"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review of PR #4879
(arel-build-quoted-passes-model-attribute-unwrapped), round 4. Sibling of
`arel-dot-am-attribute-structural-check-looser-than-rails`, which covers the
`Dot` site only; this one covers the remaining three.

**Updated after PR #4874** (`Attribute#quotedNode` builds Casted for nil, like
build_quoted): `quotedNode` now delegates straight to `buildQuoted(value, this)`
and no longer carries its own `instanceof ModelAttribute` arm. That removes the
fourth site and the two-wrap-site divergence this story originally listed — one
of the two concrete divergences below is now fixed on main. Three predicates
remain.

Rails identifies an `ActiveModel::Attribute` by **class** everywhere —
`casted.rb:50` (`build_quoted`'s `when` arm), `to_sql.rb:110` (ValuesList),
`to_sql.rb:632` (Assignment), `to_sql.rb:756` (the visitor). trails has four
sites and **three different predicates**, so an object can be classified
differently depending on the call path:

| site                                          | predicate                                         |
| --------------------------------------------- | ------------------------------------------------- |
| `nodes/casted.ts` `buildQuoted`               | `"valueForDatabase" in o && "name" in o`          |
| `attributes/attribute.ts` `quotedNode`        | `o instanceof ModelAttribute`                     |
| `visitors/to-sql.ts` `isActiveModelAttribute` | `!(o instanceof Node) && "valueForDatabase" in o` |
| `visitors/dot.ts` `isActiveModelAttribute`    | `"valueBeforeTypeCast" in o` (filed separately)   |

Concrete divergences:

- `{ valueForDatabase: 1 }` → `Quoted` via `buildQuoted` (no `name`), but
  matches to-sql's helper, so via `visitNodeOrValue` it reaches `visit` and
  raises `UnsupportedVisitError`.
- (FIXED by #4874 — kept for history) `buildQuoted` and `quotedNode` were two
  wrap-sites with different predicates, so an object with `valueForDatabase` +
  `name` that was not a `ModelAttribute` wrapped in `BindParam` via one and
  `Casted` via the other. `quotedNode` now delegates to `buildQuoted`, so there
  is a single wrap-site and this divergence is gone.

### The stale justification

`casted.ts` justifies its structural check with "so buildQuoted doesn't require
a runtime import here". **That reason is verified stale**: `packages/arel`
already depends on `@blazetrails/activemodel` (`package.json`), which does not
depend on `arel` in either direction (no `@blazetrails/arel` import anywhere in
`packages/activemodel/src`, no dep in its `package.json`), and both
`attributes/attribute.ts:31` and `visitors/to-sql.ts:9` already import
`Attribute` from it at runtime. Nothing blocks the same import in `casted.ts`.

## Acceptance criteria

- [ ] One predicate for "is an ActiveModel::Attribute" across `buildQuoted` and
      to-sql's `isActiveModelAttribute` — an `instanceof` check against
      activemodel's `Attribute`, matching Rails' class dispatch. (`quotedNode`
      needs no change: #4874 made it delegate to `buildQuoted`.)
- [ ] Drop the stale "doesn't require a runtime import" rationale in `casted.ts`.
      Note `attributes/attribute.ts` no longer imports activemodel at all after
      #4874, so `casted.ts` importing it is the first re-introduction — confirm
      no cycle at that time rather than trusting this note.
- [ ] to-sql's `!(v instanceof Node)` exclusion must be preserved in behaviour:
      Arel's own `Casted`/`Quoted` expose `valueForDatabase` (casted.ts) and
      must keep falling to `quote()` in ValuesList, per rb:110's narrow `when`.
      An `instanceof ModelAttribute` check gets this for free (they are Arel
      Nodes, not ModelAttributes) — verify, don't assume.
- [ ] Check each behaviour change against Rails before keeping it: e.g. a
      duck-typed object in a values row currently binds and would then route to
      `quote()` — which is what rb:110 does (it is not in the `when` list).
- [ ] api:compare / test:compare delta non-negative.
