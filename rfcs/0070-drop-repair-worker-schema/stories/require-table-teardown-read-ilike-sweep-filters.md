---
title: "require-table-teardown: read ILIKE sweep filters, not just LIKE"
status: claimed
updated: 2026-07-29
rfc: "0070-drop-repair-worker-schema"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-07-29T02:05:45Z"
assignee: "require-table-teardown-read-ilike-sweep-filters"
blocked-by: null
closed-reason: null
---

## Context

`sweepPrefixMatchers` in `eslint/require-table-teardown.mjs` (added by #5555)
reads only `LIKE` filters: `LIKE_PREFIX_RE` is
`/(?<!\bnot\s+)\blike\s+'([^'%]+)%'/gi`, and `\blike` cannot match inside
`ILIKE` (no word boundary between `i` and `l`). A teardown sweep written as
`WHERE tablename ILIKE 'ex_%'` therefore credits nothing, and every raw
`CREATE TABLE ex_…` in that file still reports `missingTeardown`.

This is an under-accepting gap — noise, not a leak — and is listed in the
rule header's KNOWN GAPS paragraph alongside `SIMILAR TO` and regex operators.
PostgreSQL's `ILIKE` is case-insensitive, so the compiled matcher would need
the `i` flag; Arel emits it from the same `visit_Arel_Nodes_Matches` node as
`LIKE` (`vendor/rails/activerecord/lib/arel/visitors/postgresql.rb:7-16`,
`vendor/rails/activerecord/test/cases/arel/visitors/postgres_test.rb:80-91`),
including the `ESCAPE` clause the rule already honours.

No file in the tree uses an `ILIKE` sweep today, so this is pre-emptive: file
it before someone writes one and is told to hand-maintain a DROP list.

## Acceptance criteria

- `sweepPrefixMatchers` recognises `ILIKE` as well as `LIKE`, compiling the
  case-insensitive matcher with the `i` flag so `ILIKE 'ex_%'` credits `EX_FOO`.
- `NOT ILIKE` yields no matcher, exactly as `NOT LIKE` does.
- The `ESCAPE` clause is honoured on `ILIKE` filters too.
- Rule tests pin each of the three above, and the header's KNOWN GAPS
  paragraph drops `ILIKE` from its list.
