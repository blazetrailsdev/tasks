---
title: "Phase 2 — MariaDB template (measure before committing)"
status: in-progress
updated: 2026-06-10
rfc: "0008-test-perf-template-clone"
cluster: test-perf
deps: ["phase0-sqlite-template-spike"]
deps-rfc: []
est-loc: 150
pr: 3085
claim: "2026-06-10T14:40:19Z"
assignee: "phase2-mariadb-template"
blocked-by: null
---

## Context

MariaDB has no template-DB primitive. Options: `mysqldump` schema-only + replay,
or DDL replay from a cached statement list. The win here is smallest and may not
beat per-fork DDL — **measure before committing**. If it doesn't win, MariaDB
keeps the current per-worker preload and only sqlite/PG adopt the template path.

See RFC 0008 §Phases beyond the spike (Phase 2).

## Acceptance criteria

- [ ] Spiked separately: `mysqldump` schema-only replay vs cached DDL-statement
      replay, measured against per-fork DDL baseline
- [ ] If it wins: MariaDB clones from the template; suites green
- [ ] If it doesn't win: documented, MariaDB keeps per-worker preload (no change)

## Notes

Status `draft` — gated on [[phase0-sqlite-template-spike]] and an explicit
measurement decision.
