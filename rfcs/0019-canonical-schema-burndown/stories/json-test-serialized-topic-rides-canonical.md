---
title: "json-test-serialized-topic-rides-canonical"
status: ready
updated: 2026-06-25
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
---

> **Scope override (RFC 0019 prioritization, 2026-06-25):** This story is exempt from the 500-LOC PR ceiling. Ship the full file conversion as **one PR per file**, even if additions+deletions exceed 500 LOC. Do **not** split into sibling PRs or defer part of the file to a follow-up story — the goal is to drop the file from the canonical-schema exclude list in a single PR.

## Context

`coders/json.test.ts` defines `SerializedTopic` with `_tableName = "topics"` and
loads a bespoke inline `topics` schema (`title` + serialized `content` only — no
`author_name`). Because the handler DB is shared per worker and the canonical
schema preload keeps the signature cache warm, this bespoke table physically
replaces `topics` and survives into any canonical-`topics` suite scheduled after
it in the same worker. Those suites' fixture loads then fail with
`table topics has no column named author_name`.

Surfaced in `f9-bind-params-to-sql-and-join-subquery` (PR #3237): the
bind-parameter suite was poisoned on SQLite. That PR shielded the _victim_ with a
`beforeAll` `dropExisting` rebuild, but the root cause (the bespoke `topics`)
still threatens other canonical-`topics` suites. Fits the canonical-schema
burndown ("prefer the canonical table Rails uses").

## Acceptance criteria

- `coders/json.test.ts` no longer leaves a bespoke `topics` table in the shared
  handler DB — either ride the canonical `topics` (preferred) or add an
  `afterAll(dropAllTables)` / `dropExisting` shield.
- No canonical-`topics` suite can be poisoned by it (the `beforeAll` shield added
  to `bind-parameter.test.ts` should no longer be load-bearing, or is kept only
  as defense-in-depth).
