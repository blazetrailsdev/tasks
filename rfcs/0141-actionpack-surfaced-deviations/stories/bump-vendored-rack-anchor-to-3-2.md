---
title: "rack: bump the vendored Rack anchor from 3.1.14 to 3.2 and re-baseline"
status: draft
updated: 2026-10-08
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["rack"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Owner ruling, 2026-10-08 (blocked-story triage, decision 14): bump the vendored
Rack anchor from 3.1.14 to 3.2.

`vendor/sources.lock.json` pins rack `v3.1.14`, the Rack that Rails v8.0.2
targets. `Rack::Request#form_pairs` exists only in 3.2 (`request.rb:499-533`
there), and 3.2 restructures `POST` (`:539-548`) to delegate to it, dropping
3.1's `RACK_REQUEST_FORM_INPUT` memoization and stream-changed warning that
trails' `POST` mirrors today. Its parse arm reads
`query_parser.parse_query_pairs` (`:523`), which neither vendored Rack 3.1 nor
trails defines. trails already ships `formPairs`
(`packages/rack/src/request.ts:754`) under a
`@noRailsEquivalent CONVERGEABLE port-rack-request-form-pairs` receipt.

## Acceptance criteria

- The rack `ref` moves to a 3.2 tag following `vendor/README.md` § "Upgrading a
  source", and `vendor/sources.test.ts` passes.
- `pnpm parity:api --package rack` and `pnpm parity:test` are re-run and the
  package's marks are re-baselined in the same PR, with the deltas stated.
- Every method the bump adds or changes that trails does not yet mirror is
  listed, each filed as a story or ported.
