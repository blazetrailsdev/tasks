---
title: "Converge the three ActiveModel::Attribute predicates in arel onto instanceof"
status: ready
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review of PR #4879
(arel-build-quoted-passes-model-attribute-unwrapped), round 4. Sibling of
`arel-dot-am-attribute-structural-check-looser-than-rails`, which covers the
`Dot` site only; this one covers the remaining three.

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
- `buildQuoted` and `quotedNode` are the two wrap-sites that #4879's comment at
  `attribute.ts` says must move in lockstep — but they already disagree: an
  object with `valueForDatabase` + `name` that is not a `ModelAttribute` wraps
  in `BindParam` via one and `Casted` via the other. Same AST shape question the
  comment warns about, live today.

### The stale justification

`casted.ts` justifies its structural check with "so buildQuoted doesn't require
a runtime import here". **That reason is verified stale**: `packages/arel`
already depends on `@blazetrails/activemodel` (`package.json`), which does not
depend on `arel` in either direction (no `@blazetrails/arel` import anywhere in
`packages/activemodel/src`, no dep in its `package.json`), and both
`attributes/attribute.ts:31` and `visitors/to-sql.ts:9` already import
`Attribute` from it at runtime. Nothing blocks the same import in `casted.ts`.

## Acceptance criteria

- [ ] One predicate for "is an ActiveModel::Attribute" across `buildQuoted`,
      `quotedNode` and to-sql's `isActiveModelAttribute` — an `instanceof`
      check against activemodel's `Attribute`, matching Rails' class dispatch.
- [ ] Drop the stale "doesn't require a runtime import" rationale in `casted.ts`
      and the "must move with it" caveat in `attribute.ts:143-147`, which exists
      only because the predicates differ.
- [ ] to-sql's `!(v instanceof Node)` exclusion must be preserved in behaviour:
      Arel's own `Casted`/`Quoted` expose `valueForDatabase` (casted.ts) and
      must keep falling to `quote()` in ValuesList, per rb:110's narrow `when`.
      An `instanceof ModelAttribute` check gets this for free (they are Arel
      Nodes, not ModelAttributes) — verify, don't assume.
- [ ] Check each behaviour change against Rails before keeping it: e.g. a
      duck-typed object in a values row currently binds and would then route to
      `quote()` — which is what rb:110 does (it is not in the `when` list).
- [ ] api:compare / test:compare delta non-negative.
