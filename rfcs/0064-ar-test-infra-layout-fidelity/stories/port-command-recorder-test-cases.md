---
title: "Port Rails CommandRecorderTest (4/93 matched; 73 bespoke extras)"
status: done
updated: 2026-08-07
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: 6175
claim: "2026-08-07T15:41:27Z"
assignee: "i18n-fallbacks-with-chain-tests"
blocked-by: null
closed-reason: null
---

## Context

**Re-homed 2026-08-07** from `0016-ar-test-compare-100`, which is `superseded` — its successor `0030-ar-test-compare-residual-burndown` is itself now `closed` with no open stories, so this story had no reachable parent and the non-active-parent rule (`scripts/validate-lib.mjs:44`) kept it out of the ready queue permanently. Premise re-verified against `origin/main` (311bff350) at the time of the move; the work below is live, not rot.

Surfaced while porting three delegation tests in PR #5635. `parity:test`
reports `migration/command_recorder_test.rb` against
`packages/activerecord/src/migration/command-recorder.test.ts` as:

````text
migration/command_recorder_test.rb   command-recorder.test.ts   4 OK  0 skip  0 desc  0 move  89 miss  73 extra  93 tot
```text

Only **4 of Rails' 93** tests match. The other 73 trails tests in the file are
counted "extra (TS only)" — they are bespoke trails tests named after the
`invert*` methods (`describe("invertCreateTable / invertDropTable")`,
`describe("invertAddIndex / invertRemoveIndex")`, …) under a top-level
`describe("CommandRecorder")`, whereas Rails' population is
`Migration > CommandRecorderTest > <test name>`. PR #5635 had to add a
separate correctly-nested `describe("Migration") > describe("CommandRecorderTest")`
block for its three ported tests to match at all, which is what exposed this.

Rails' file is `vendor/rails/activerecord/test/cases/migration/command_recorder_test.rb`
(93 tests). Use `pnpm rails:find <name>` to map each to its `file:line` — e.g.
`test_unknown_commands_delegate` → `command_recorder_test.rb:35`.

Note the three already ported by #5635, so they are not re-ported:
`respond_to_delegates`, `send_delegates_to_record`, `unknown_commands_delegate`.

## Acceptance criteria

- Rails' `CommandRecorderTest` cases are ported under the Rails describe path
  (`Migration` > `CommandRecorderTest`) with names matching Rails verbatim, so
  `parity:test` counts them OK rather than missing.
- The existing 73 bespoke `invert*`-named tests are either renamed to their
  Rails counterparts where one exists, or — where they cover trails-only
  behavior with no Rails equivalent — moved to
  `command-recorder.trails.test.ts` per the TS-only-extras convention.
- No test is renamed away from a Rails name it currently matches (the 4 OK
  stay OK).
- `parity:test` delta for this file is strongly positive; `parity:api`
  non-negative.
- Green on sqlite3, PostgreSQL and MySQL.

Likely needs splitting across several PRs under the LOC ceiling — file the
follow-ups as separate stories rather than fanning out.
````
