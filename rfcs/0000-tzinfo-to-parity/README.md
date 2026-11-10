---
rfc: "0000-tzinfo-to-parity"
title: "tzinfo to parity: port the gem behind the Intl stand-in"
status: active
created: 2026-11-09
updated: 2026-11-09
owner: "@deanmarano"
packages:
  - "tzinfo"
clusters: []
---

<!-- Unnumbered until merge: `scripts/finalize-rfc.mjs` swaps 0000 for the
     assigned number at merge. -->

# RFC — tzinfo to parity: port the gem behind the Intl stand-in

## Summary

Port the tzinfo 2.0.6 gem file for file, replacing the Intl-backed stand-in in
`packages/tzinfo`, and bring its tests into `parity:test`.

## Motivation

`pnpm parity:api` on 2026-11-09: tzinfo 41/371, 7 of 45 files. `pnpm
parity:test`: 0/0 although the extractor finds 961 Ruby tests, and trails has
one TS test file (`packages/tzinfo/test/index.trails.test.ts`). trailmap's "no
test data" is that 0/0. Enrollment in `vendor/sources.ts` (`tzinfo`, `v2.0.6`,
`testPath: "test"`, `compareTests: true`) and in parity:api already landed
(`tzinfo-tests-enroll-in-parity-test`, `tzinfo-port-mirrors-lib-tzinfo-files`).

## Design

The gem's dependency order: `Timestamp` → offsets, transitions, periods →
transition rules → `DataSource` and info classes → `ZoneinfoReader` /
`ZoneinfoDataSource` and the Format1/2 definers / `RubyDataSource` →
`Timezone` subclasses → `Timezone` itself reading the data source →
`Country`. Each story ports its files with their tests.

Prior art referenced, not re-filed: `tzinfo-data-timezone-is-a-real-subclass`
(0223, ready; `DataTimezone` as its own class), `tzinfo-timezone-get-is-case-sensitive`
(0158), `time-zone-utc-offset-reads-current-period-base-offset` (0101),
`initialize-time-zone-checks-tzinfo-data-source` (0142). The `0207` fugit-family
tzinfo stories that built the stand-in are done.

## Non-goals

- **Publishing the full tzinfo-data set as a package.** This RFC generates
  definition modules for the test fixtures; shipping tzinfo-data is a follow-up
  once `RubyDataSource` exists.

## Alternatives considered

- **Keep the Intl stand-in and port only the value classes.** Rejected: periods
  and transitions are what ActiveSupport's `TimeZone` reads, and the stand-in is
  the deviation.

## Rollout

1. `tzinfo-parity-test-credits-tc-files`
2. `tzinfo-timestamp`, `tzinfo-with-offset-classes`, `tzinfo-offset-transition-and-periods`,
   `tzinfo-transition-rule-and-annual-rules`
3. `tzinfo-data-source-base`, `tzinfo-zoneinfo-reader-and-posix-parser`,
   `tzinfo-zoneinfo-data-source`, `tzinfo-format1-and-format2-definers`,
   `tzinfo-ruby-data-source`
4. `tzinfo-timezone-subclasses`, `tzinfo-timezone-reads-the-data-source`,
   `tzinfo-country-and-country-timezone`, `tzinfo-small-files-and-city-zone-tests`

## Verification

`pnpm parity:api`: tzinfo 371/371, 45/45 files. `pnpm parity:test`: tzinfo
reports its Ruby denominator and reaches 100% matched with only `PERMANENT-SKIP`
skips.

## Open questions

1. **Which data source is the default?** Resolved: the gem's
   `create_default_data_source` order (RubyDataSource when tzinfo-data loads,
   else ZoneinfoDataSource), ported as written.
2. **How does `RubyDataSource` load Ruby definition files?** Resolved: a build
   step generates TS modules from the definitions, loaded by an awaited
   `import()`.

## Changelog

- 2026-11-09: initial RFC; Open Questions resolved above, so it lands `active`.
