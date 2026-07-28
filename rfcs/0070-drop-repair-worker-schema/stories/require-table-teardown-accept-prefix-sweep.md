---
title: "Accept a prefix sweep as teardown so the hand-maintained DROP list can go"
status: ready
updated: 2026-07-28
rfc: "0070-drop-repair-worker-schema"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`require-table-teardown` (`eslint/require-table-teardown.mjs`) balances raw DDL
**per table name**: a raw `CREATE TABLE foo` must be matched by a raw
`DROP TABLE foo` somewhere in the same file. It does not recognise a **prefix
sweep** as teardown, even though a sweep drops strictly more than the list does.

`packages/activerecord/src/adapters/postgresql/postgresql-adapter.trails.test.ts`
tears its tables down twice as a result: a catalogue sweep

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'ex_%'
```

followed by a per-row `DROP TABLE`, _plus_ a hand-written static
`DROP TABLE IF EXISTS abba, ex_arr, ex_backslash, …` naming ~45 tables. The
static list exists only to satisfy the lint — the sweep already drops every
`ex_`-prefixed table.

That duplication rots silently, because nothing checks the list against reality.
PR #5519 found it holding **~20 names no `CREATE TABLE` in the file produces**
(`ex_custom_pk`, `ex_dates`, `ex_def_seq`, `ex_expr`, `ex_incl_esc`,
`ex_incl_kw`, `ex_include`, `ex_include2`, `ex_insert_ret`…`ex_insert_ret4`,
`ex_invalid_idx`, `ex_keyword`, `ex_no_pk`, `ex_no_seq`, `ex_ns_pk`,
`ex_nulls_nd`, `ex_opclass`, `ex_partial`, `ex_pk_seq`, `ex_serial_seq`,
`ex_unparsed_defaults`) while **missing `ex_insert_pkfalse`**, which the file
does create and which only the sweep was dropping. It also still named
`pk_test`, `no_pk_test`, `exec_test` and `Items`, none of which the file creates
— and `items`, which is CANONICAL, whose presence in the sweep filter is the
bug #5519 fixed.

So the hand-maintained list is not merely redundant: it is the artefact that
made a canonical table name look like an ordinary teardown entry.

## Acceptance criteria

- Teach `require-table-teardown` to accept a prefix sweep as teardown for the
  tables it covers: a raw `DROP TABLE` whose name is an interpolation fed by a
  catalogue query filtered on `LIKE '<prefix>%'` satisfies every raw
  `CREATE TABLE <prefix>…` in the same file.
- Only a statically-readable prefix counts. A dynamic or absent filter must NOT
  satisfy anything, or the rule stops catching bespoke tables that outlive their
  test — which is the reason it exists.
- With the rule taught, delete the redundant static list from
  `postgresql-adapter.trails.test.ts`, keeping only names the sweep cannot
  reach (`abba`, `test_no_returning`).
- The rule's own tests must pin: a prefix sweep satisfying prefixed creates; a
  non-matching create in the same file still reported; a dynamic filter
  satisfying nothing.
- Do NOT let this weaken `require-canonical-rebuild`. A sweep that can select a
  canonical table must still report `sweepReachesCanonical` — the two rules
  answer different questions and #5519's regression case must stay red on the
  pre-fix file.
