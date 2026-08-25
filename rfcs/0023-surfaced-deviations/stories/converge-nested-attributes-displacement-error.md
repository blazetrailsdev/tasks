---
title: "Converge NestedAttributesDisplacementError onto Rails' RecordNotFound (parity:api:extra red on main)"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already done: NestedAttributesDisplacementError no longer exists in packages/activerecord/src/associations/errors.ts on main (621d49cce); grep finds no reference anywhere in the package."
---

## Context

`pnpm parity:api:extra --package activerecord` fails on `main` (observed while gating
PR #6024, which did not touch the file):

```text
extra-surface: 1 @noRailsEquivalent tag(s) state no permanence claim.
  - activerecord  associations/errors.ts  NestedAttributesDisplacementError
```

The tag on `NestedAttributesDisplacementError` in
`packages/activerecord/src/associations/errors.ts` carries a reason but no
PERMANENT / CONVERGEABLE classification, so the gate reds for every agent who
runs it.

Rails declares no such error class: the nested-attributes displacement path in
`vendor/rails/activerecord/lib/active_record/nested_attributes.rb` raises
`ActiveRecord::RecordNotFound` from `raise_nested_attributes_record_not_found!`
(nested_attributes.rb:604). That makes this CONVERGEABLE, not permanent.

## Acceptance criteria

- Converge the raise site onto the Rails error class and message, deleting
  `NestedAttributesDisplacementError` — or, if a genuine TypeScript shortcoming
  blocks that, restate the `@noRailsEquivalent` reason with an explicit
  PERMANENT claim and the Rails cite.
- `pnpm parity:api:extra --package activerecord` exits clean.

## Definition of done

Gate green on `main`; no new baseline rows.

## Verification

`pnpm parity:api:extra --package activerecord`
