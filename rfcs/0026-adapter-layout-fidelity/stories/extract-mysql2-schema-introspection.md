---
title: "Extract MySQL introspection statements from mysql2-adapter into mysql/schema-statements"
status: draft
updated: 2026-06-12
rfc: "0026-adapter-layout-fidelity"
cluster: adapter-layout
deps: []
deps-rfc: []
est-loc: 480
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`mysql2-adapter.ts` is 1,385 code lines vs Rails'
`mysql2_adapter.rb` at 155 — Rails keeps MySQL logic in
`abstract_mysql_adapter.rb` plus the shared `mysql/` modules, and the trails
`connection-adapters/mysql/` directory mirrors Rails file-for-file, but
`mysql/schema-statements.ts` is interface-only.

**This story (~240 moved lines):** `columns` (~153 lines) and `indexes`
(~87). Move into
`connection-adapters/mysql/schema-statements.ts` (or a sibling class file),
leaving the adapter delegating. Methods shared with MariaDB belong in
`abstract-mysql-adapter.ts` (already a healthy 1.7×) — only move what Rails
keeps in the `mysql/` modules. Code motion counts double in the diff; if the
group exceeds the ceiling, ship the slice that fits and register the
remainder.

## Acceptance criteria

- [ ] Listed methods live in the mirrored module file; the adapter only delegates.
- [ ] No behavior change: no test edits beyond import paths; CI green on all three adapters.
- [ ] PR diff under the 500 LOC ceiling; if the group exceeds it, ship the slice that fits and register the remainder as a new story.
