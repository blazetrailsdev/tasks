---
title: "Run the /graphs/parity gate in CI against vendored ringo and a fixture stats database"
status: claimed
updated: 2026-10-12
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: "2026-10-12T18:39:42Z"
assignee: "deploy-the-smoke-schedule-on-the-box"
blocked-by: null
closed-reason: null
---

Follow-up to trailmap#53.

`pnpm gate:parity` (scripts/gate-ringo-parity.ts) diffs trailmap's
`/graphs/parity/data` against ringo's `/spawnloop/parity` over one stats
database, point for point. It found two real defects while the page was being
written. It needs a running ringo and the multi-gigabyte live stats.db, so it
is not in CI or `pnpm gate` — the only thing holding the port equal to ringo
after merge is the unit tests written from the two defects it already found.

## Do

Make it run in CI the way the other ringo gates do: build ringo's parity
handler from the vendored pin (scripts/vendor-ringo.sh already calls
`HandleParityPage` in a throwaway worktree) and run both sides over a small
fixture stats database — test/models/stats-schema.ts has the schema — covering
the six existing cases, including a derived metric and the two call tables.

## Acceptance

- [ ] a CI job runs the parity gate with no live ringo and no host stats.db
- [ ] reverting either fixed defect (gaps keyed by table; fixed select list) fails it
