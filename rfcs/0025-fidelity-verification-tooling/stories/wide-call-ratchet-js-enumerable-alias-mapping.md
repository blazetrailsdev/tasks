---
title: "Wide call ratchet lacks JS→Ruby enumerable alias mapping (some never satisfies any?)"
status: done
updated: 2026-07-24
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5182
claim: "2026-07-23T21:42:09Z"
assignee: "wide-call-ratchet-js-enumerable-alias-mapping"
blocked-by: null
closed-reason: null
---

## Context

Found while closing pool-connected-predicate-skips-per-connection-probe
(PR #5153). The wide call ratchet
(scripts/api-compare/lint-call-mismatches-wide.ts) flags Rails
`connected?`'s `any?` call as missing from
connection-pool.ts isConnected even though the port is the exact JS
analogue `_connections.some((conn) => conn.isConnected())` — the wide
comparison has no JS→Ruby enumerable-alias mapping, so `some` never
satisfies `any?`. The narrow lint (scripts/api-compare/lint-calls.ts:253
region) already treats `any?`/`all?`/`include?` etc. as common-call noise,
but the wide population re-surfaces them. Result: verified-equivalent
wide-exclude entries (e.g.
scripts/api-compare/call-mismatches-wide-exclude/activerecord/connection-adapters/abstract/connection-pool.json
connected?/any?) must be kept forever for faithfully-converged bodies.

## Acceptance criteria

- Wide call comparison maps common JS enumerable analogues to their Ruby
  names before diffing (at minimum: some→any?, every→all?,
  includes→include?, filter→select).
- The connection-pool.ts connected?/any? wide-exclude entry (and any
  other entries whose reason is "JS analogue, extractor has no mapping")
  can be deleted and the ratchet stays green.
