---
title: "Remove over-gating to match Rails unconditional runs (24 across 8 files)"
status: done
updated: 2026-06-20
rfc: "0032-ar-gate-fidelity-burndown"
cluster: over-gated
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 3709
claim: "2026-06-20T12:37:27Z"
assignee: "gate-over-gated-burndown"
blocked-by: null
---

## Context

RFC `ar-gate-fidelity-burndown`, cluster `over-gated`. `test:compare --package
activerecord --gates` (2026-06-16) reports **24 `over-gated`** mismatches across
8 files: Rails runs the test on **every** adapter, but our TS port gates (skips)
it — coverage we believe we have but don't.

Per-file counts (kind == `over-gated`):

```text
 7  adapter_test.rb
 7  view_test.rb
 3  schema_dumper_test.rb
 2  migration_test.rb / dirty_test.rb
 1  query_cache_test.rb / primary_keys_test.rb / scoping/relation_scoping_test.rb
```

## Acceptance criteria

- [ ] For each `over-gated` test, **remove the TS gate** so it runs on all
      adapters, matching Rails (`classifyGateMismatch` returns null).
- [ ] Where removing the gate surfaces a real per-adapter failure, keep it
      pending with a `BLOCKED:` comment and register a follow-up convergence
      story instead of leaving a false gate; note IDs here.
- [ ] `test:compare --package activerecord --gates` reports **0 `over-gated`**
      for the files this story closes.
- [ ] Test names unchanged.

## Notes

`over-gated` is only flagged when Rails is `effectivelyUnconditional` — so these
are high-confidence: Rails genuinely runs them everywhere. `view_test.rb` and
`adapter_test.rb` dominate; check whether our gate was a workaround for an
adapter the test actually supports now.
