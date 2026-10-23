---
title: "parity:api:calls credits a Minitest assert in a Rails body as its CONTRIBUTING.md expect form"
status: draft
updated: 2026-10-23
rfc: "0206-minitest-port-and-assertions-to-expect"
cluster: assertion-tooling
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Owner ruling (Dean, 2026-10-23; RFC 0206 § "Assertions inside ported Rails
bodies"): a ported Rails body that calls a Minitest assert writes plain
`expect(value, msg)`, and the call gate credits that equivalence **once**, not
at each call site. Today `parity:api:calls` (`scripts/api-compare/lint-calls.ts`)
would report `assert_equal` missing from `assertDifference` once the
`assertEqual` helper is gone, because the TS body calls `expect` / `toEqual`.

Sites the mapping must credit: `packages/activesupport/src/testing/assertions.ts:310-551`,
`method-call-assertions.ts`, `error-reporter-assertions.ts`, `deprecation.ts`,
`packages/activemodel/src/lint.ts`, `packages/activerecord/src/testing/query-assertions.ts`,
`packages/actionpack/src/action-dispatch/testing/assertions/routing.ts`,
actionview's `dom-assertions.ts` / `selector-assertions.ts` /
`selector-assertions/html-selector.ts`, `packages/activerecord/src/encryption/test-helpers.ts`.

The Minitest→`expect` table is CONTRIBUTING.md § "Porting a Minitest
assertion", encoded for the test comparison as `RAILS_MAP` / `TRAILS_MAP` in
`scripts/test-compare/assertion-kinds.ts`.

## Acceptance criteria

- [ ] `parity:api:calls` credits a Ruby call to a Minitest assert
      (`assert`, `assert_equal`, `refute_equal`, `assert_nil`, `assert_match`,
      `assert_predicate`, `assert_respond_to`, `assert_kind_of`,
      `assert_operator`, … and `refute_*`) when the TS body has an
      `expect(...)` chain whose terminal matcher maps to the same kind, by
      reading `assertion-kinds.ts`'s maps — one shared source, no second table.
- [ ] `parity:api:calls:args` does not report the `expect` form as an
      argument-shape row for those calls.
- [ ] No `@missingRailsCall` receipt and no baseline row is added for this;
      any existing row it makes stale is deleted and the mark tightened.
- [ ] Unit tests in `scripts/api-compare/` cover a credited `assert_equal` →
      `toEqual`, a negated `refute_equal` → `.not.toEqual`, and a non-matching
      matcher that stays reported.
