---
title: "constant-tables-written-from-the-walk"
status: draft
updated: 2026-11-03
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/class-paths.ts` `collectClassPaths` still selects rows of `constants*.generated.ts` from the `rails-api.json` pairing. `constant-table.ts` `walkConstants` derives 1,628 of 2,113 rows; `constant-residue.json` also counts 1,062 walked exports no table names. RFC 0213 § "Framework constants" wants the walk as the generator and `--check` as the cross-check.

## Acceptance criteria

- Rows are written from `walkConstants` plus the residue record, with no `rails-api.json` read outside `--check`.
- Each unpaired walked export is either a row or excluded by a stated rule, so `rbModName` gives no invented class a Ruby path by accident (activerecord alone has 624).
- `parity:class-paths --check` stays green.
