---
title: "Converge missing-gate tests to Rails gates (173 across 21 files)"
status: ready
updated: 2026-06-16
rfc: "0032-ar-gate-fidelity-burndown"
cluster: missing-gate
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC `ar-gate-fidelity-burndown`, cluster `missing-gate`. `test:compare
--package activerecord --gates` (2026-06-16) reports **173 `missing-gate`**
mismatches across 21 files: Rails gates these tests to specific
adapters/features, but our TS port runs them unconditionally, so the comparison
adapter matrix is wrong and a real adapter difference may be masked.

Per-file counts (refresh via `pnpm test:compare --cached --package activerecord
--gates --json`, then read each file's `gateMismatches[]` where
`kind == "missing-gate"`):

```text
 49  insert_all_test.rb
 20  migration_test.rb
 18  date_time_precision_test.rb
 15  relation/with_test.rb
 12  connection_adapters/type_lookup_test.rb
  8  view_test.rb
  7  schema_dumper_test.rb
  6  persistence_test.rb
  6  defaults_test.rb
  6  connection_adapters/mysql_type_lookup_test.rb
  5  invertible_migration_test.rb
  3  relations_test.rb / calculations_test.rb / relation/merging_test.rb / cache_key_test.rb
  2  attributes_test.rb / active_record_schema_test.rb / adapter_prevent_writes_test.rb
  1  finder_test.rb / attribute_methods_test.rb / locking_test.rb
```

## Acceptance criteria

- [ ] For each `missing-gate` test, apply the **exact Rails gate** (adapter set + feature predicate from `railsGate`) to the TS test so
      `classifyGateMismatch` returns null.
- [ ] Where applying the gate unskips a test our impl can't pass, keep it gated
      to Rails' condition, mark it pending (`it.skip` + `BLOCKED:`/`ROOT-CAUSE:`
      comment), and register a follow-up convergence story (best-fit active RFC,
      else `0023-surfaced-deviations`). Note the new story IDs here.
- [ ] `test:compare --package activerecord --gates` reports **0 `missing-gate`**
      for the files this story closes.
- [ ] Test names unchanged (test:compare matching depends on them).
- [ ] If the diff exceeds the 500-LOC ceiling, ship the portion that fits and
      register the remaining files as a follow-up story in this RFC.

## Notes

`missing-gate` is the bulk of the RFC. `insert_all_test.rb` (49) and
`date_time_precision_test.rb` (18) alone likely exceed one PR; expect to split
by file into follow-up stories. Read the corresponding Rails test for the gate
source — it is usually a class-level `unless current_adapter?(...)` or a
`skip unless supports_*?` body guard.
