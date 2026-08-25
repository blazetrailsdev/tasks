---
title: "Drop dead typeof-function guards around valueForDatabase getter"
status: done
updated: 2026-07-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: 4813
claim: "2026-07-09T00:37:34Z"
assignee: "converge-valuefordatabase-property-access-guards"
blocked-by: null
closed-reason: null
---

## Context

`valueForDatabase` is a getter on `Attribute` (activemodel `attribute.ts:84`),
never a callable. PR #4722 fixed `readAttributeForDatabase`
(`attribute-methods/before-type-cast.ts`) to read it as a property. Two call
sites still wrap it in a defensive `typeof x.valueForDatabase === "function"`
guard that can never be true:

- `packages/activerecord/src/explain.ts:70-72`
- `packages/activerecord/src/log-subscriber.ts:213-215`

These are benign (the `else` branch handles the value correctly) but are dead
legacy guards inconsistent with the established property-access convention
(`attribute-methods.ts:822-828`, `base.ts:3706/3891`,
`statement-cache.ts:67/258`).

## Acceptance criteria

- [ ] Replace the `typeof … === "function"` guards at both sites with direct
      property access to `valueForDatabase`.
- [ ] No behavior change; existing explain/log-subscriber tests still pass.
