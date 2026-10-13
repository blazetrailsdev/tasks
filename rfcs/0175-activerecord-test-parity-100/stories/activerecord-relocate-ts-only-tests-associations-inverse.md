---
title: "activerecord: move the one TS-only test in inverse-associations.test.ts to a .trails sibling"
status: in-progress
updated: 2026-10-13
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: trails#8857
claim: "2026-10-13T13:12:24Z"
assignee: "activerecord-relocate-ts-only-tests-associations-inverse"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/associations/inverse-associations.test.ts` holds one TS-only test, `has_one createBang stores a single record as target, not an array`, inside `describe("InversePolymorphicBelongsToTests")`. No test in `vendor/rails/v8.0.2/activerecord/test/cases/associations/inverse_associations_test.rb` has that name. It was moved in trails#8828 and backed out to keep that PR under its LOC ceiling.

## Acceptance criteria

- [ ] The test lives in `inverse-associations.trails.test.ts`, with its `any` casts removed (`human.association("autosaveFace") as HasOneAssociation`, result cast to `Face`) and the `humans` / `faces` / `interests` fixtures and model registrations it needs.
- [ ] `inverse-associations.test.ts` reports 0 extra in `pnpm parity:test`.

## Verification

```bash
pnpm parity:test --package activerecord --sort-extra --min-extra=1
```
