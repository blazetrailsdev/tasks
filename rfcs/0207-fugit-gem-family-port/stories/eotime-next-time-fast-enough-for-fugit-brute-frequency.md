---
title: "Make EoTime fast enough for fugit's brute_frequency spec to run in CI"
status: in-progress
updated: 2026-10-25
rfc: "0207-fugit-gem-family-port"
cluster: null
packages: ["et-orbi", "tzinfo", "date", "fugit"]
deps:
  - port-fugit-package
deps-rfc: []
est-loc: 300
priority: null
pr: trails#9315
claim: "2026-10-25T21:19:08Z"
assignee: "eotime-next-time-fast-enough-for-fugit-brute-frequency"
blocked-by: null
closed-reason: null
---

## Context

`Fugit::Cron#brute_frequency` (`vendor/fugit/v1.11.1/lib/fugit/cron.rb:400-424`) calls
`next_time` once per occurrence, so the `* * * * *` example in
`vendor/fugit/v1.11.1/spec/cron_spec.rb:998-1017` (`computes "dmin: 1m, …" for "* * * * *"`)
makes 525,600 `next_time` calls. Ruby runs it in about 62 s. The port
(`packages/fugit/src/cron.ts`, `Cron#nextTime`) takes about 1 ms per call, roughly 10 minutes,
which does not fit a 20-minute CI unit shard. That example is parked as `it.skip` with
`// BLOCKED: <this story>` in `packages/fugit/src/cron.test.ts`.

A `--cpu-prof` of 5,000 `nextTime` calls under `TZ=UTC` puts about 95% of the time outside
fugit:

- `EoTime#strftime` → `strfz` (`packages/et-orbi/src/time.ts`), about 40%: each call builds
  fresh `Time` objects through `Time.utc` and the Temporal polyfill.
- `EtOrbi.determineLocalTzone` → `getTzinfoTzone` → `TZInfo::Timezone.get`
  (`packages/tzinfo/src/index.ts:419`), about 17%: every `get` constructs a new
  `Intl.DateTimeFormat` to validate the identifier. Ruby's TZInfo caches loaded timezone
  info in its data source (`DataSource#get_timezone_info`).
- `Timezone#periodForUtc` / `getZoneInfo` (`packages/tzinfo/src/index.ts`), about 20%.

Even with a vitest test timeout raised, a synchronous block longer than 60 s also trips vitest's
worker RPC timeout ("Timeout calling onTaskUpdate"). `cron.test.ts` works around that with a
`beforeEach` tick in the `#brute_frequency` and `implicit tz DST transition` describes.

## Acceptance criteria

- [ ] `Cron#nextTime` on `* * * * *` costs well under 0.1 ms per call under `TZ=UTC`, through
      faithful changes in et-orbi / tzinfo / date (for example, caching validated identifiers in
      `TZInfo::Timezone.get` the way TZInfo's data source caches, and not rebuilding `Time`
      objects per `EoTime#strftime`).
- [ ] The parked `computes "dmin: 1m, …" for "* * * * *"` example in
      `packages/fugit/src/cron.test.ts` runs again, and the fugit vitest project finishes inside a
      CI shard.
