---
title: "Replace TODO skips with Rails gates (23 across 7 files)"
status: done
updated: 2026-06-20
rfc: "0032-ar-gate-fidelity-burndown"
cluster: should-gate
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 3710
claim: "2026-06-20T12:49:28Z"
assignee: "gate-should-gate-burndown"
blocked-by: null
---

## Context

RFC `ar-gate-fidelity-burndown`, cluster `should-gate`. `test:compare --package
activerecord --gates` (2026-06-16) reports **23 `should-gate`** mismatches across
7 files: Rails runs the test under a gate, but we `it.skip` it (a TODO/pending
skip) instead of **gating** it. The fix is to replace the bare skip with Rails'
actual adapter/feature gate.

Per-file counts (kind == `should-gate`):

```text
 11  insert_all_test.rb
  5  schema_dumper_test.rb
  2  defaults_test.rb / hot_compatibility_test.rb
  1  transactions_test.rb / adapter_test.rb / primary_keys_test.rb
```

## Acceptance criteria

- [ ] For each `should-gate` test, replace the unconditional `it.skip` with
      Rails' gate (adapter/feature condition from `railsGate`) so the test runs
      where Rails runs it and is gated-out elsewhere.
- [ ] If, once gated to Rails' condition, the test still cannot pass due to an
      impl gap, keep it pending with a `BLOCKED:`/`ROOT-CAUSE:` comment and
      register a follow-up convergence story; note IDs here.
- [ ] `test:compare --package activerecord --gates` reports **0 `should-gate`**
      for the files this story closes.
- [ ] Test names unchanged.

## Notes

`should-gate` overlaps RFC 0030's skip axis: these are currently counted as
skipped too. Converging the gate may also clear a `matchedSkipped` entry where
the test passes on the gated adapter. `insert_all_test.rb` (11) dominates and
pairs naturally with its `missing-gate` work — coordinate to avoid conflicts.
