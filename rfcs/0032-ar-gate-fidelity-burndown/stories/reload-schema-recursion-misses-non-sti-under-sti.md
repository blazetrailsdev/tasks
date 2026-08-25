---
title: "reloadSchemaFromCache recursion misses non-STI descendants under STI subclasses"
status: done
updated: 2026-07-23
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5168
claim: "2026-07-23T17:34:38Z"
assignee: "reload-schema-recursion-misses-non-sti-under-sti"
blocked-by: null
closed-reason: null
---

## Context

PR #5144 unified `reloadSchemaFromCache`
(packages/activerecord/src/model-schema.ts, `reloadSchemaFromCache` /
`clearStiSubclassLocalCaches`). Rails `reload_schema_from_cache`
(vendor/rails/activerecord/lib/active_record/model_schema.rb:553-568) recurses
`subclasses.each` reaching EVERY descendant. Trails recurses non-STI subclasses
fully and walks STI subclasses' deeper STI descendants via
`clearStiSubclassLocalCaches`, but a non-STI subclass nested UNDER an STI
subclass (own `table_name` set on a class whose parent is an STI subclass) is
never reached — its `_schemaLoaded`/memos can stay stale after a parent
`lockingColumn=` / `ignoredColumns=` reload. The STI branch cannot simply
recurse `reloadSchemaFromCache` (it would redirect back to the shared base and
loop), so the walk in `clearStiSubclassLocalCaches` needs a non-STI check that
re-enters the full reload for such children.

## Acceptance criteria

- A non-STI descendant below an STI subclass gets its schema memos invalidated
  when an ancestor reloads (regression test that fails on current main).
- No infinite recursion through the STI-redirect branch (existing suites stay
  green).
