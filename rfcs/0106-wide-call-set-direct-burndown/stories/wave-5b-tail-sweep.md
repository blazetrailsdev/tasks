---
title: "wave-5b-tail-sweep"
status: done
updated: 2026-08-22
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6869
claim: "2026-08-22T18:04:58Z"
assignee: "wave-5b-tail-sweep"
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

- [x] Each row above leaves as a `@missingRailsCall` tag at the call site carrying its existing reviewed reason, via `pnpm parity:api:build --package activesupport --file <f> --call <c>`. Never `--write`, never a reseed. — 14 of 15 in #6869. Each reason additionally gained the `PERMANENT` / `CONVERGEABLE` prefix `suppressedCallsIn` requires (`scripts/api-compare/missing-rails-call-tags.ts:219-231`); the two `CONVERGEABLE` ones name new stories rather than ratifying the deviation (`benchmarkable-should-mix-in-logger-reader`, `travel-to-should-stub-rails-time-receivers`).
- [ ] `gem-version.ts` `new` — DEFERRED, not migrated. Minting its tag reds the ratchet with a STALE row under `actionpackversion`: `compare.ts` keys the tag population by relative `tsFile` alone (`compare.ts:2602`, `recordTaggedCalls` :2722) across a package AND its deps, and both packages ship a `gem-version.ts`. Row left baselined; tracked by `call-tag-population-collides-on-shared-basename`, which owns the migration.
- [x] Emptied shards deleted, not committed as `[]`. — 12 shards deleted; `number-helper/rounding-helper.json` and `testing/time-helpers.json` keep their out-of-scope rows (`digit_count`, two `kind: "args"`).
- [x] `pnpm parity:api:calls`, `pnpm parity:api:calls:args`, `pnpm parity:api:reasons`, `pnpm parity:api:detached` all green.
- [x] SQLite, PostgreSQL and MySQL/MariaDB lanes green. — JSDoc-only diff, no method body touched; CI green on #6869.
