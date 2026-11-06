---
title: "test-case-constant-table-rows"
status: claimed
updated: 2026-11-06
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-11-06T02:57:10Z"
assignee: "activejob-test-adapter-payload-bare-keys"
blocked-by: null
closed-reason: null
---

## Context

`ActionMailer::TestCase` (`packages/actionmailer/src/test-case.ts`) and
`ActiveJob::TestCase` (`packages/activejob/src/test-case.ts`) answer their
Ruby name through a hand-written `static toString()`, because
`pnpm parity:class-paths` writes no `constants*.generated.ts` row for them:
`placement()` in `scripts/api-compare/class-paths.ts:209-245` drops a file
outside every entry graph, and neither package's `index.ts` reaches
`test-case.ts`. actionview solves the same case with
`constants.excluded.generated.ts` (its tsconfig `exclude`s
`src/test-case.ts`). Without the `toString`, `rbModName(TestCase)` answers
`"TestCase"`, not `"ActionMailer::TestCase"` (Rails
`actionmailer/lib/action_mailer/test_case.rb:15`).

## Acceptance criteria

- `rbModName` answers `ActionMailer::TestCase`, `ActionMailer::TestHelper`,
  `ActiveJob::TestCase` and `ActiveJob::TestHelper` from a generated table.
- Both `static toString()` overrides are deleted.
- `pnpm parity:class-paths --check` is clean.
