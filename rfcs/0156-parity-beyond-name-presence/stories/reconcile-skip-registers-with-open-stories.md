---
title: "Flag an open story that asks to port something a skip register says is unportable"
status: done
updated: 2026-09-23
rfc: "0156-parity-beyond-name-presence"
cluster: "denominator"
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: trails#8002
claim: "2026-09-23T16:38:24Z"
assignee: "reconcile-skip-registers-with-open-stories"
blocked-by: null
closed-reason: null
---

## Context

Two open 0155 stories contradict a recorded skip reason, and nothing notices (`audit-20260920.md` in this RFC's directory).

- `assertions-activesupport-multibyte-chars-port` asks to port `ActiveSupport::Multibyte::Chars` (110 assertion rows). `multibyte/chars.rb` is scoped-skipped as a whole (`scripts/parity/conventions.ts:1012`), its 24 definitions get no comparison row, and `core_ext/string/multibyte.rb` is an excluded file (`scripts/parity/unported-files/activesupport.ts:36`).
- `activesupport-test-case-has-no-test-order` asks to port `TestCase.test_order`. `conventions.ts:1070-1088` skips it with the reason "vitest is the runner in trails: it owns ordering".

Either the register or the story is wrong. CLAUDE.md says a register is a burndown ledger, so the default reading is that the story wins, but each needs a decision.

## Acceptance criteria

- Both contradictions are decided and recorded: the skip entry is removed, or the 0155 story is closed with the register's reason. `tasks close` is the verb for the second.
- A check lists every open story whose body names a Ruby file in `unported-files/` or a (file, name) pair in `SCOPED_SKIP_GROUPS`.
- The check runs in the tasks repo's validate step or in trails' `parity:*` namespace, and the PR body says which and why.
- Report-only.
