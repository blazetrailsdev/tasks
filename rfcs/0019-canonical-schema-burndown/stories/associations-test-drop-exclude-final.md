---
title: "Drop associations.test.ts from canonical-schema exclude list"
status: blocked
updated: 2026-06-26
rfc: "0019-canonical-schema-burndown"
cluster: null
deps:
  - associations-test-associationproxytest-canonical
  - associations-test-preloadertest-canonical
  - converge-integration-namedscoping-remainder
deps-rfc: []
est-loc: 50
priority: 50
pr: null
claim: null
assignee: null
blocked-by: "Blocked on two unfinished prerequisites: associations-test-associationproxytest-canonical (AssociationProxyTest bespoke ap_* defineSchema block was converted in #3600 but REGRESSED back onto main by #3601's stale-base merge) and associations-test-preloadertest-canonical (PreloaderTest defineSchema still present, multi-wave conversion ongoing). OverridingAssociationsTest (#3601) and cpk-counter (#3607) prerequisites are done. associations.test.ts still on the canonical-schema exclude list."
---

## Context

Final step of the `associations.test.ts` canonical conversion (RFC 0019).
`assoc-associations-test-wave-final-drop-exclude` (PR #3589) converged the first
`AssociationsTest` describe's trails-specific bodies, but the file is still on
`eslint/require-canonical-schema-exclude.json` because bespoke `defineSchema`
blocks remain.

Blocked-by (all must land first):

- `associations-test-associationproxytest-canonical` (AssociationProxyTest describe)
- `associations-test-preloadertest-canonical` (PreloaderTest describe, multi-wave)
- `associations-test-overridingassociationstest-canonical` (OverridingAssociationsTest describe)
- `cpk-counter-cache-column-demodulize-convergence` (unblocks the deferred
  `loading cpk association when persisted and in memory differ` body in the first
  describe, the last consumer of the bespoke `cpk_orders`/`cpk_order_items` block)

- trails: `packages/activerecord/src/associations.test.ts`,
  `eslint/require-canonical-schema-exclude.json`

## Acceptance criteria

- [ ] All `defineSchema` bespoke blocks removed from `associations.test.ts`.
- [ ] Drop `packages/activerecord/src/associations.test.ts` from
      `require-canonical-schema-exclude.json`; `blazetrails/require-canonical-schema`
      passes on the whole file.
- [ ] test:compare delta non-negative.
