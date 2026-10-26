---
title: "fugit brute_frequency examples fail under a DST local TZ"
status: ready
updated: 2026-10-26
rfc: "0207-fugit-gem-family-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

On main (verified before and after trails#9315), with a DST local zone (`TZ=America/Detroit`), three
`#brute_frequency` examples in `packages/fugit/src/cron.test.ts` fail. CI is UTC, so it never sees them:

- `computes "dmin: 1D, dmax: 1D, ocs: 365, …" for "0 0 * * *"`
- `computes "dmin: 1W, dmax: 1W, ocs: 53, …" for "0 0 * * sun"`
- `accepts a year argument`: trails gives `dmin: 6D23h, dmax: 1W1h`, where the spec expects `dmin: 1W, dmax: 1W`.

Fugit's `brute_frequency` (`vendor/fugit/v1.11.1/lib/fugit/cron.rb:400-424`) subtracts
consecutive `next_time` results. Those results are EoTimes in the cron's zone (`cron.rb`
`next_time`, `t.time.translate(from.zone)`), and `EoTime#-` subtracts seconds. Ruby reports 1W
across a DST change only if the spec's local zone is the same as the zone it computes in. Check
what fugit's spec runs under (its `spec_helper` / `in_zone`) before deciding whether the port or the test setup diverges.

## Acceptance criteria

- [ ] Run `ruby` (3.3.11, on PATH) on fugit 1.11.1 with `TZ=America/Detroit` and record what it reports for these three examples.
- [ ] If Ruby passes, converge the port (et-orbi / tzinfo / fugit) so these examples pass under a DST local `TZ`.
- [ ] If Ruby fails too, the spec pins a zone; mirror that pin in `cron.test.ts`.
