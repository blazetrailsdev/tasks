---
title: "arel-dot-am-attribute-structural-check-looser-than-rails"
status: in-progress
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4880
claim: "2026-07-15T02:01:12Z"
assignee: "arel-dot-am-attribute-structural-check-looser-than-rails"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review of PR #4879
(arel-build-quoted-passes-model-attribute-unwrapped), round 2. Recording it so
it stops being re-derived; #4879 documents the same at `dot.ts`'s
`isActiveModelAttribute`.

`Visitors::Dot` reaches `visit_ActiveModel_Attribute` (`dot.rb:216`) by Ruby's
class dispatch, so it fires only for a real `ActiveModel::Attribute`. Trails'
`Dot` instead uses a structural check
(`packages/arel/src/visitors/dot.ts`, `isActiveModelAttribute`):

```ts
typeof o === "object" && o !== null && "valueBeforeTypeCast" in o;
```

This is **looser than Rails**: any object exposing `valueBeforeTypeCast`
matches. In Ruby a `{ value_before_type_cast: 42 }` is a Hash and routes to
`visit_Hash` (`dot.rb:220`), never to `visit_ActiveModel_Attribute`.

### Why Dot can't just take the `reg` line #4879 added to ToSql

PR #4879 registered the abstract `ActiveModel::Attribute` base in `ToSql`'s
dispatch table. That is NOT portable to `Dot`, and a naive `reg` there would be
dead code: `Dot` overrides `visit` and routes non-`Node` values structurally
_before_ reaching `super.visit` (the `instanceof Node` branch), so an attribute
never reaches the dispatch table to match. `Dot` needs a structural path
regardless — Rails' Dot dispatches raw Ruby values with no Node ctor to key on
(`visit_Hash` dot.rb:220, `visit_Array`, `visit_String`). The convergence is
therefore _tightening the predicate_, not switching mechanism.

### The blocker (why this wasn't done in #4879)

`dot.test.ts` (~:368, "visits a non-Node value object with valueBeforeTypeCast")
deliberately feeds a fake duck-typed `{ valueBeforeTypeCast: 42 }` and asserts
it renders a `valueBeforeTypeCast` edge. Tightening to
`instanceof ModelAttribute` makes that object fall to `isPlainObject` →
`visitHash`, so the test must change — and its stated regression (Dot must not
raise `UnsupportedVisitError` on an unknown class instance) is real and must
stay covered by the `visitHash` / `visitString` fallback instead. Per CLAUDE.md
the implementation is what moves, not the test name; check the Rails test first.

## Acceptance criteria

- [ ] `Dot#isActiveModelAttribute` matches Rails' class dispatch — an
      `instanceof` check against activemodel's `Attribute` (as
      `attributes/attribute.ts:31` and `to-sql.ts` already import it; no new
      dependency edge, `arel/package.json` already depends on `activemodel`).
- [ ] Ordering after the `instanceof Node` branch is preserved: trails'
      `BindParam` also exposes `valueBeforeTypeCast` via `NodeExpression`, and
      must keep routing to `visitArelNodesBindParam` (`dot.rb:212-214`).
- [ ] A non-attribute object exposing `valueBeforeTypeCast` no longer reaches
      `visitActiveModelAttribute`; it routes to `visitHash` / `visitString` and
      still does not raise `UnsupportedVisitError`.
- [ ] Drop the "Known deviation" note in `dot.ts` that points at this story.
- [ ] api:compare / test:compare delta non-negative.
