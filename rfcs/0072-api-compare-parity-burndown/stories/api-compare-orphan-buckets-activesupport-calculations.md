---
title: "api-compare-orphan-buckets-activesupport-calculations"
status: done
updated: 2026-08-06
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6160
claim: "2026-08-06T16:25:50Z"
assignee: "api-compare-orphan-buckets-activesupport-calculations"
blocked-by: null
closed-reason: null
---

## Context

Follow-up slice of `api-compare-orphan-reopened-file-buckets`, whose first PR
mapped the non-activesupport orphans (`activerecord:encryption/cipher.rb`,
`globalid:global_id.rb`, `activemodel:validations/validates.rb`,
`activemodel:validations/helper_methods.rb`,
`activerecord-test-support:connection.rb`) through `RUBY_FILE_TS_OVERRIDES` in
`scripts/api-compare/conventions.ts`.

The largest remaining cluster is activesupport's date/time core_ext reopenings —
`Time`, `Date` and `DateTime` are each first defined by some other core_ext file,
so every method these three add buckets under the DEFINING file and reads as
missing forever:

- `core_ext/time/calculations.rb` — 57 methods
- `core_ext/date_time/calculations.rb` — 38 methods
- `core_ext/date/calculations.rb` — 34 methods

129 methods total. Enumerate with the orphan query in the parent story
(a file that appears as a `MethodInfo.file` but is no entity's `ClassInfo.file`
in `scripts/api-compare/output/rails-api.json`).

## Acceptance criteria

- Each of the three files gets a `RUBY_FILE_TS_OVERRIDES` entry naming its TS
  counterpart, or is documented as genuinely unported (`UNPORTED_FILES`, with a
  reason).
- Per-package ported-method deltas are reported in the PR body and called out as
  measurement fixes, not new porting work.
- `pnpm parity:api:calls` stays green; any newly matched pair that surfaces a wide
  call mismatch gets a real reason, never the seeded default.
