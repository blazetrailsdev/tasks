---
title: "mysql2 test parity 100%: no scope-only skips remain"
status: ready
updated: 2026-11-22
rfc: "0254-mysql2-gem-port"
cluster: null
packages: ["mysql2"]
deps:
  [
    "mysql2-statement-result-each-reads-its-cast-options-per-call",
    "mysql2-specs-row-type-mapping-skips-run",
    "mysql2-statement-execute-specs-run",
    "mysql2-client-spec-surface-skips-run",
    "mysql2-result-streaming-and-cache-rows-specs-run",
    "mysql2-multi-result-sets-and-session-track-specs-run",
    "mysql2-result-field-types-and-server-flags-specs-run",
    "mysql2-client-ssl-connect-specs-run",
  ]
deps-rfc: []
est-loc: 50
priority: 9
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Capstone for 100% mysql2 test parity. After the port stories land, every remaining `it.skip` in `packages/mysql2/test/*.test.ts` must cite a genuine Node/JS impossibility (encoding tags, fork/threads/signals, `LocalJumpError`), never "outside the RFC 0254 surface" or "not in the surface table".

## Acceptance criteria

- [ ] `git grep -n "RFC 0254 surface" packages/mysql2/test` is empty.
- [ ] `pnpm parity:test -- --package mysql2` reports 0 missing and every skip is a PERMANENT-SKIP with an impossibility reason; the counts are recorded in the PR.
