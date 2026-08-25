---
title: "Converge the trails-only guards in validateEach and tableExists that reorder Rails' calls"
status: done
updated: 2026-08-13
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: 6457
claim: "2026-08-13T03:56:51Z"
assignee: "call-args-ar-select-async-kwarg"
blocked-by: null
closed-reason: null
---

## Context

PR #6404 (evaluation-order call sequences) surfaced two ported bodies that
evaluate a call earlier than Rails because the port added a guard Rails does
not have. Both are trails-only arms, so this is port divergence, not an
extractor artifact.

- Rails `activemodel/lib/active_model/validations/numericality.rb:24`:
  `validate_each` calls `is_number?(value, precision, scale)` FIRST and reaches
  `filtered_options(value)` only inside the failure arm. trails
  `packages/activemodel/src/validations/numericality.ts:63` adds a
  `value === null || value === undefined` arm ahead of it that calls
  `filteredOptions` before `isNumber` is ever reached. Rails' `is_number?`
  already returns false for nil (numericality.rb:105 `Kernel.Float`), so the
  extra arm is the deviation.
- Rails `activerecord/lib/active_record/model_schema.rb#table_exists?`:
  `schema_cache.data_source_exists?(table_name)` — the argument evaluates
  first. trails `packages/activerecord/src/model-schema.ts:1574` adds a
  `typeof cache.dataSourceExists !== "function"` capability guard that credits
  `dataSourceExists` ahead of `tableName`.

## Acceptance criteria

1. `validateEach` drops the nil pre-arm and lets `isNumber` produce the
   `:not_a_number` verdict as Rails does, keeping the existing test coverage
   green (`test_default_validates_numericality_of`).
2. `tableExists` drops the capability guard, or converges it so the Rails call
   order is preserved; state which if the guard is load-order forced.
3. Both `order:` rows are deleted by hand from `call-mismatches-exclude/`
   (only-shrink, no `--write` reseed).
