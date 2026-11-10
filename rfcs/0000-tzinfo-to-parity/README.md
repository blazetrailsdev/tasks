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

**Production data.** The Intl stand-in is retired only after tzinfo-data is
vendored and generated into TS definition modules, so `DataSource.get` answers a
`RubyDataSource` on every platform, as it does in a Rails app that bundles
tzinfo-data (`tzinfo-data-definitions-generated`).

**Sequencing with 0223.** `tzinfo-data-timezone-is-a-real-subclass` (RFC
`0223-package-layout-mirrors-a-rails-gem`, ready) owns `InfoTimezone`,
`DataTimezone` and their two test files. It lands against the stand-in:
`DataTimezone` wraps the info the stand-in already builds. This RFC's
`tzinfo-timezone-reads-the-data-source` later points that info at
`DataSource.get`, so 0223 needs no dep on this RFC.

Prior art referenced, not re-filed: `tzinfo-data-timezone-is-a-real-subclass`
(above), `tzinfo-timezone-get-is-case-sensitive`
(0158), `time-zone-utc-offset-reads-current-period-base-offset` (0101),
`initialize-time-zone-checks-tzinfo-data-source` (0142). The `0207` fugit-family
tzinfo stories that built the stand-in are done.

## Non-goals

- **The `ts_all*.rb` suite runners.** They only `require` the `tc_*` files and
  define no tests.
- **A host-`zoneinfo` production path.** `ZoneinfoDataSource` is ported and
  tested, but trails' default is the generated tzinfo-data, so no platform
  depends on `/usr/share/zoneinfo`.

## Alternatives considered

- **Keep the Intl stand-in and port only the value classes.** Rejected: periods
  and transitions are what ActiveSupport's `TimeZone` reads, and the stand-in is
  the deviation.

## Rollout

Within a phase, the stories' `deps` set the order; stories with no dep between
them can run in parallel. In phase 2, `tzinfo-transition-rule-and-annual-rules`
waits for `tzinfo-offset-transition-and-periods`; in phase 3, the zoneinfo
stories chain reader → data source, and the Ruby-source chain is definers →
`tzinfo-ruby-data-source` → `tzinfo-data-definitions-generated`.

1. `tzinfo-parity-test-credits-tc-files`
2. `tzinfo-timestamp`, `tzinfo-with-offset-classes`, `tzinfo-offset-transition-and-periods`,
   `tzinfo-transition-rule-and-annual-rules`
3. `tzinfo-data-source-base`, `tzinfo-zoneinfo-reader-and-posix-parser`,
   `tzinfo-zoneinfo-data-source`, `tzinfo-format1-and-format2-definers`,
   `tzinfo-ruby-data-source`, `tzinfo-data-definitions-generated`
4. `tzinfo-timezone-subclasses`, `tzinfo-timezone-reads-the-data-source`,
   `tzinfo-country-and-country-timezone`, `tzinfo-small-files-and-city-zone-tests`

## Verification

`pnpm parity:api`: tzinfo 371/371, 45/45 files. `pnpm parity:test`: tzinfo
reports its Ruby denominator and reaches 100% matched with only `PERMANENT-SKIP`
skips.

## Open questions

1. **Which data source is the default?** Resolved: the gem's
   `create_default_data_source` order, ported as written. trails ships the
   generated tzinfo-data, so the order resolves to `RubyDataSource` everywhere,
   and `ZoneinfoDataSource` is reached only when an app sets it.
2. **How does `RubyDataSource` load Ruby definition files?** Resolved: a build
   step generates TS modules from the definitions, loaded by an awaited
   `import()`.

## Changelog

- 2026-11-09: initial RFC; Open Questions resolved above, so it lands `active`.
- 2026-11-09: revised for review feedback.
