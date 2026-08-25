---
title: "Converge the 73 call-set rows surfaced by recording accessor call sets"
status: done
updated: 2026-08-17
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: 4
pr: 6666
claim: "2026-08-17T19:47:58Z"
assignee: "class-for-adapter-extracts-resolve-task"
blocked-by: null
closed-reason: null
---

## Context

PR #6656 (`ts-extractor-records-no-calls-for-getters`) made `extract-ts-api.ts`
record `calls` / `callSeq` / `skeleton` for `get` and `set` accessors, which the
method and constructor branches had always done. Every Rails method trails ports
as a TS accessor had been invisible to the call-set gate until then — the gate
saw an empty population and could not flag a dropped call in it.

Turning the population on surfaced **73 pre-existing call-set divergences** in
accessor bodies (140 before rebasing onto #6659, which subsumed roughly half by
pairing rows by owner, seam and accessor kind). They were baselined into
`scripts/api-compare/call-mismatches-exclude/**` in that PR because the story's
scope was the extractor change, not the burndown.

These rows are **debt, not permission**. They were classified by mechanism, not
line-diffed: representative entries were read against the vendored Rails body
and the rest carry a cluster-vetted reason saying exactly that. Two reason
strings identify the cohort:

- the Rack header-accessor cluster reason (`get_header` / `set_header` /
  `fetch_header` / `has_header?` — trails exposes headers as direct
  property/map access), shared with rows already in the tree; and
- the RFC 0108 reason, which names the accessor mechanism and ends in
  "not line-diffed individually".

Affected packages: `actiondispatch`, `activemodel`, `activerecord`,
`activesupport`, `globalid`, `i18n`, `rack`, `trailties`. The largest single
concentrations are `actiondispatch/http/request.ts`, `rack/request.ts` and
`activerecord/associations/collection-association.ts`.

## Converged shape

Each row converges the normal way: read the Rails body, make the TS accessor
call what Rails calls, delete the row by hand (the baseline is only-shrink), and
tighten the affected high-water mark with
`pnpm parity:api:calls:tighten <package>/<shard>` — never `--write`, which
rewrites the whole exclude tree and buries the one row you meant to retire.

The header-accessor cluster is likely one decision rather than N: either trails'
request/response objects grow the Rack accessor pair, or the cluster is
ratified once with a language/design justification recorded in one place. That
call should be made before grinding the individual rows, since it covers a large
share of the cohort.

Size this in waves, as RFC 0106 does elsewhere; the estimate below is the whole
cohort, not one PR.

## Acceptance criteria

- [ ] Every row carrying the RFC 0108 accessor reason or the Rack
      header-accessor cluster reason is either converged and deleted, or
      replaced with a per-row reviewed justification citing `gem/path.rb:LINE`.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green, with the
      exclude-tree row count strictly lower than at PR #6656.
- [ ] No `--write` reseed; marks lowered only via `parity:api:calls:tighten`.
