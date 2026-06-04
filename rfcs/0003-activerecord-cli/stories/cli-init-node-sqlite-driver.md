---
title: "ar init: support --driver node-sqlite"
status: ready
rfc: "0003-activerecord-cli"
cluster: cli
deps: ["cli-generators-manifest"]
deps-rfc: []
est-loc: 5
priority: 18
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Post-merge finding from the ar-cli series (#2741). `ar new` supports
`--driver node-sqlite`; `ar init` always scaffolds a `better-sqlite3` config.
Low priority — `ar new` covers the new-project case — but `ar init` should match.

## Acceptance criteria

- [ ] `ar init --driver node-sqlite` scaffolds a `node:sqlite` config (parity
      with `ar new`).
- [ ] Default (no `--driver`) behavior unchanged.

## Notes

Migrated from `activerecord-gaps.md` (ar-cli follow-ups) during the RFC 0011
cutover.
