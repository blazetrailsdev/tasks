---
title: "assertions-tail-adapters-1-remainder-2-connection-adapters-lane-assertions"
status: draft
updated: 2026-09-21
rfc: "0132-ar-closure-assertion-parity"
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

Split from `assertions-tail-adapters-1-remainder-2` (connection_adapters lane).
`connection_adapters/connection_handler_test.rb` has unmatched/extra tests (21 matched, 1 missing,
29 trails-only) and `connection_adapters/connection_handlers_multi_db_test.rb` reports 3 value
mismatches under `pnpm parity:test -- --package activerecord --assertions --missing`. Both need a
second pool on a real server to verify.

## Acceptance criteria

- Both files report 0 count/kind/value mismatches.
