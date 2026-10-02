---
title: "globalid: railtie_test.rb's 7 cases are credited from trailties (0/7 today)"
status: draft
updated: 2026-10-02
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
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

`pnpm parity:test --package globalid` reports `railtie_test.rb → trailtie.test.ts 0/7 ✗` and
**6/7 files**, 131/138. The seven cases of `vendor/globalid/*/test/cases/railtie_test.rb`
(`class RailtieTest`, `:10`) are already ported under Rails' names in
`packages/trailties/src/trailties/global-id.test.ts` (`describe("RailtieTest")`, `:39-96`), beside
the railtie port `packages/trailties/src/trailties/global-id.ts`. globalid cannot host the test:
trailties depends on globalid, not the reverse.

`parity:test` matches inside one package, so the file can only score against
`packages/globalid/src/trailtie.test.ts`. trails#8367 added the mechanism for exactly this case:
`CROSS_PACKAGE_TEST_FILES` in `scripts/test-compare/compare.ts`, keyed `<package>:<ruby test file>`,
with one row today (`activemodel:railtie_test.rb` → `trailties` / `trailties/active-model.test.ts`).

## Acceptance criteria

- [ ] `CROSS_PACKAGE_TEST_FILES` gains `"globalid:railtie_test.rb": { package: "trailties", tsFile: "trailties/global-id.test.ts" }`.
- [ ] Any test in `trailties/global-id.test.ts` that is not one of Rails' seven moves to `global-id.trails.test.ts` (it exists), so the row reports `extra` 0. No test is renamed.
- [ ] `pnpm parity:test --package globalid` reports **7/7 files** and the seven cases credited; `pnpm parity:test:assertions` stays green (fix any assertion mismatch the newly matched pairs surface by converging the test on Rails' assertions, never by raising a mark).

## Verification

```bash
pnpm parity:test --package globalid --missing && pnpm parity:test:assertions
```
