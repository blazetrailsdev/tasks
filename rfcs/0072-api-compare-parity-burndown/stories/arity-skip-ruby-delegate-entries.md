---
title: "arity: skip Ruby delegate/alias entries recorded as zero-arity"
status: done
updated: 2026-07-25
rfc: "0072-api-compare-parity-burndown"
cluster: api-compare-tooling
deps: []
deps-rfc: []
est-loc: 120
priority: 10
pr: 5313
claim: "2026-07-25T19:18:54Z"
assignee: "arity-skip-ruby-delegate-entries"
blocked-by: null
closed-reason: null
---

## Context

The Ruby extractor already tags `delegate`-macro and alias entries:
`scripts/api-compare/output/rails-api.json` records e.g. `create_or_find_by`
(from `vendor/rails/activerecord/lib/active_record/querying.rb:12`) as
`{"params": [], "notes": "delegate"}`. But the arity check
(`scripts/api-compare/compare.ts:912-990` wiring →
`scripts/api-compare/arity.ts` `matchArityAgainst`/`positionalArity`) ignores
`notes` and compares these as genuine zero-arg methods against the real TS
signature, producing `ruby() [0-0]` false mismatches.

~21 of the 79 activerecord entries in `output/arity-mismatches.json` are this
shape. Verified delegate/alias sources:

- `querying.rb:12` (`create_or_find_by`, reported for both `base.rb` and
  `querying.rb`)
- `connection_adapters/abstract/schema_creation.rb:16` (`type_to_sql`,
  `options_include_default?`, `quoted_columns_for_index`)
- `relation/delegation.rb:101-104` delegate to `:records` (`in_groups`,
  `in_groups_of`, `split`, `rindex` — each reported for both `relation.rb`
  and `relation/delegation.rb`)
- `connection_adapters/postgresql/oid/array.rb:13` and `oid/range.rb:9`
  (`user_input_in_time_zone`)
- `connection_adapters/abstract/database_statements.rb:367`
  (`within_new_transaction`, reported also under `abstract_adapter.rb`)
- `connection_adapters/mysql/schema_creation.rb:7` (`add_sql_comment!`)
- `connection_adapters/postgresql/schema_creation.rb:8`
  (`quoted_include_columns_for_index`)
- `migration/command_recorder.rb:269-270` (`alias :invert_add_belongs_to`
  / `:invert_remove_belongs_to`)
- `type.rb` `add_modifier` and `migration.rb` `run_without_lock` — verify
  whether these are also delegate/alias-sourced or belong to the
  state-threading bucket.

A delegate forwards `(...)` — its true arity is that of the target, which the
extractor cannot see. Comparing `[0-0]` against anything is noise.

## Acceptance criteria

- Arity comparison skips (or treats as `0..Infinity` splat) Ruby entries whose
  extractor record carries `notes: "delegate"` (and alias-sourced entries, if
  the extractor tags them — extend `extract-ruby-api.rb` to tag aliases if it
  doesn't).
- `arity.test.ts` covers the delegate-skip behavior.
- `output/arity-mismatches.json` regenerated: the ~21 delegate/alias entries
  above disappear; no previously-matched pair regresses.
- The skip is reflected in the `compared` denominator or documented in the
  arity.ts header comment so the summary stays honest.
