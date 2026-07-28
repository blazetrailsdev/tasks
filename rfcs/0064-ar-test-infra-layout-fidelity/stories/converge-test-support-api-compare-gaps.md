---
title: "converge-test-support-api-compare-gaps"
status: in-progress
updated: 2026-07-28
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5517
claim: "2026-07-28T15:39:18Z"
assignee: "converge-test-support-api-compare-gaps"
blocked-by: null
closed-reason: null
---

## Context

`wire-test-support-into-api-compare` (PR pending) added the
`activerecord-test-support` pseudo-package, pairing
`vendor/rails/activerecord/test/support/*.rb` against
`packages/activerecord/src/support/*.ts`. The first real run reports
**23/43 methods (53.5%)**, files 9/9, inheritance 1/2, arity 14/14.

Per that story's acceptance criteria the mismatches are filed here rather than
fixed in the wiring PR. Missing TS counterparts, per Ruby file:

- `adapter_helper.rb` (6/10) — `supports_default_expression?`,
  `supports_non_unique_constraint_name?`, `supports_text_column_with_default?`,
  `supports_sql_standard_drop_constraint?`
- `config.rb` (0/7) — `config`, `config_file`, `read_config`, `expand_config`,
  `connection_name`, `test_configuration_hashes`, `connect`
  (trails' `src/support/config.ts` is a different shape entirely)
- `connection_helper.rb` (1/2) — `reset_connection`
- `fake_adapter.rb` (9/10) — `initialize`
- `stubs/strong_parameters.rb` (2/9) — `keys`, `key?`, `has_key?`, `empty?`,
  `permit!`, `to_unsafe_h`, `each_pair`

Reproduce with `pnpm api:compare --package activerecord-test-support`; the
per-method list is in `scripts/api-compare/output/api-comparison.json`.

## Acceptance criteria

- Each missing method above is either ported into the matching
  `packages/activerecord/src/support/*.ts` file, or the Ruby method is excluded
  with a reason (`SKIP_GROUPS` / `unported-files.ts`) explaining why trails'
  suite has no counterpart.
- `pnpm api:compare --package activerecord-test-support` percentage improves and
  the remaining gap is entirely accounted for by documented exclusions.
- Split across multiple stories if one PR would exceed the 500 LOC ceiling —
  `config.rb` and `stubs/strong_parameters.rb` are the two largest clusters and
  are natural split points.
