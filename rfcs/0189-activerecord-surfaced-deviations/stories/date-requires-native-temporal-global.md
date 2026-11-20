---
title: "date-requires-native-temporal-global"
status: draft
updated: 2026-11-20
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: ["date"]
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/date/lib/temporal.ts:4` exports `globalThis.Temporal` and never installs the `@js-temporal/polyfill` that `packages/date/package.json` depends on. Node 26 ships Temporal natively; Hermes does not, so `packages/date/lib/date.ts:3959` (`class SubMinuteOffsetZonedDateTime extends Temporal.ZonedDateTime`) throws "Cannot read property 'ZonedDateTime' of undefined" when activerecord loads.

Found running `examples/react-native-notes` on an Android emulator (Expo Go, SDK 58, Hermes) for trails#10425, which works around it in the example; see its README row 15.

## Acceptance criteria

- `@blazetrails/date` answers the native `Temporal` where the host has one and the polyfill otherwise, with no host setup.
- Loading `@blazetrails/activerecord` in a context with no `globalThis.Temporal` succeeds.
