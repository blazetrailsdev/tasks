---
title: "date-uses-native-temporal-when-present"
status: draft
updated: 2026-11-19
rfc: "0241-request-path-performance"
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

From `boot-define-property-cost-in-mixin-installers` (docs/trailties/boot-cost-and-bundle-findings.md).
`@js-temporal/polyfill` costs ~18 ms of module eval at boot (`IndianHelper`) and most of the `date`
package's 685 KB bundle weight. It is a static import of `packages/date/lib/index.ts:1`, `date.ts:8`,
`time.ts:1` and `tzdata-isdst.ts:1`, and the APIs that use it are synchronous, so it cannot be
deferred to first use. Node 26 ships a native `globalThis.Temporal`.

## Acceptance criteria

- `date` uses the native `Temporal` when present and the polyfill only where it is absent, with the
  polyfill out of the boot graph on Node 26 (for example a separate entry or conditional export).
- Check the behaviours the polyfill was chosen for still hold on native Temporal (the julian-calendar
  note at `date.ts:5645`).
- Record boot self time before/after outside vitest.
