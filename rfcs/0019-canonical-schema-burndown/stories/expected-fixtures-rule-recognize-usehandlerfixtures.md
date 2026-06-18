---
title: "expected-fixtures-rule-recognize-usehandlerfixtures"
status: ready
updated: 2026-06-18
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`eslint/expected-fixtures.mjs` (`blazetrails/expected-fixtures`) only recognizes
the `useFixtures({ … })` object form when harvesting declared fixture sets:
`harvestUseFixturesCall` bails unless `node.callee.name === "useFixtures"` and
the first arg is an `ObjectExpression` (eslint/expected-fixtures.mjs:126-146,
mirrored in `collectUseFixturesKeys` used by the deps baseline).

The canonical handler-test pattern is `useHandlerFixtures(["companies",
"developers", ...])` (array-of-names), which the rule does not understand — so
any canonical test using it that dereferences Rails fixtures must stay in
`eslint/expected-fixtures-exclude.json`. This blocks burning those exclude
entries (RFC 0019). Exposed by PR #3588 (`integration.test.ts`), which converted
to canonical `useHandlerFixtures([...])` + canonical models, passes
test:compare 33/33, but could not be dropped from the exclude list.

## Acceptance criteria

- [ ] `harvestUseFixturesCall` / `collectUseFixturesKeys` recognize
      `useHandlerFixtures(...)` in addition to `useFixtures(...)`.
- [ ] Both the object form (`{ owners: [...] }`) and the array-of-names form
      (`["owners", "pets"]` — `Literal` string elements of an `ArrayExpression`)
      contribute keys.
- [ ] Add rule-test coverage in `eslint/expected-fixtures.test.mjs` for the
      array form and the `useHandlerFixtures` callee.
- [ ] Drop `packages/activerecord/src/integration.test.ts` (and any other
      now-passing `useHandlerFixtures`-array files) from
      `eslint/expected-fixtures-exclude.json`; rule passes clean.

## Definition of done

`blazetrails/expected-fixtures` validates canonical `useHandlerFixtures([...])`
declarations, and `integration.test.ts` is removed from the exclude baseline
with the rule green.
