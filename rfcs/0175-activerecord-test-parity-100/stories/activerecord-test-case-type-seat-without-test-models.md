---
title: "activerecord: type the ActiveRecord::TestCase seat without pulling test models into the DX type programs"
status: draft
updated: 2026-10-13
rfc: "0175-activerecord-test-parity-100"
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

From trails PR 8844. `ActiveRecord::TestCase` is ported at `packages/activerecord/src/cases/test-case.ts`
(`vendor/rails/v8.0.2/activerecord/test/cases/test_case.rb:21-33,86-88`), but nothing outside that file may
name its type:

- `packages/activerecord/src/namespaces.ts` does not declare `TestCase` on the `ActiveRecord` namespace
  type. A type import of `cases/test-case.ts` there pulled the file, and through
  `test-helpers/fixtures-registry.ts` the canonical test models, into the Leaf Tests and Virtualized DX type
  programs (`Cannot find module '@blazetrails/activesupport/test-case'`, and TS errors in
  `test-helpers/models/reply.ts`).
- So `testCaseClassFor` in `packages/activerecord/src/test-fixtures.ts` reads the seat through
  `ActiveRecord as unknown as { TestCase: TestCaseClass }`, and `FixturesResult.self` hand-writes
  `createFixtures(...fixtureSetNames: string[]): Promise<FixtureSet[]>`, which will drift from
  `TestCase#createFixtures`.

`cases/test-case.ts` imports `FIXTURES_ROOT` from `test-helpers/fixtures-registry.ts`, which is what drags
the models in; Rails takes it from `support/config.rb` (`FIXTURES_ROOT`, required at `test_case.rb:11`).

## Acceptance criteria

- [ ] `cases/test-case.ts` reaches `FIXTURES_ROOT` without importing the fixture registry or any model.
- [ ] `ActiveRecord.TestCase` is typed on the namespace, the cast in `testCaseClassFor` is gone, and
      `FixturesResult.self` derives `createFixtures` from the class.
- [ ] `pnpm test:types` and `pnpm test:types:virtualized` pass.
