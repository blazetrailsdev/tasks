---
title: "wave-5b-tail-sweep"
status: ready
updated: 2026-08-22
rfc: "0106-wide-call-set-direct-burndown"
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

Continuation of `wave-5-tail-sweep`, which migrated the 43 single-row
`kind: "set"` shards under `scripts/api-compare/call-mismatches-exclude/activerecord/**`
to `@missingRailsCall` tags and hit the 700 LOC ceiling there (681 LOC).

The **activesupport** half of the same tail was staged, verified green, then
reverted out of that PR purely for size. It is 15 files / 15 rows, ~224 LOC, and
migrates cleanly with the same per-file procedure:

    pnpm build && API_COMPARE_FORCE=1 pnpm parity:api --calls
    pnpm parity:api:build --package activesupport --file <tsFile> --call <ruby_call>

The rows (all carry reviewed, per-site, Rails-anchored reasons already):

    actionable-error.ts                fetch
    benchmarkable.ts                   logger
    broadcast-logger.ts                delete
    cache/memory-store.ts              new
    configuration-file.ts              load
    error-reporter.ts                  merge
    gem-version.ts                     new
    message-pack/serializer.ts         fetch
    message-verifier.ts                hexdigest
    notifications/fanout.ts            transform_values
    number-helper/rounding-helper.ts   fetch
    testing/method-call-assertions.ts  new
    testing/time-helpers.ts            at
    xml-mini.ts                        call
    xml-mini/nokogiri.ts               first

Two activesupport tail rows are explicitly NOT in this list:

- `core-ext/date-and-time/zones.ts` `acts_like?` — the migrator reports
  `inTimeZone — no body-bearing declaration`; see
  `call-set-migrator-skips-non-body-bearing-declarations`.
- `module-ext.ts` `generate` — a real divergence, not a language shortcoming;
  see `module-ext-delegate-should-call-delegation-generate`.

## Acceptance criteria

- [ ] Each row above leaves as a `@missingRailsCall` tag at the call site carrying its existing reviewed reason, via `pnpm parity:api:build --package activesupport --file <f> --call <c>`. Never `--write`, never a reseed.
- [ ] Emptied shards deleted, not committed as `[]`.
- [ ] `pnpm parity:api:calls`, `pnpm parity:api:calls:args`, `pnpm parity:api:reasons`, `pnpm parity:api:detached` all green.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
