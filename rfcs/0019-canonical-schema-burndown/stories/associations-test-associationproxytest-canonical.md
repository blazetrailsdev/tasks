---
title: "Convert AssociationProxyTest describe in associations.test.ts to canonical"
status: claimed
updated: 2026-06-18
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: 50
pr: null
claim: "2026-06-18T19:58:47Z"
assignee: "associations-test-associationproxytest-canonical"
blocked-by: null
---

## Context

Follow-up from `assoc-associations-test-wave-final-drop-exclude` (PR #3589).
The `AssociationProxyTest` describe in
`packages/activerecord/src/associations.test.ts` (~423 LOC, 27 tests) still calls
`defineSchema` with bespoke tables (`ap_audit_logs`, `ap_categories`,
`ap_comments`, `ap_developers`, `ap_posts`, `ap_tagged_posts`, `ap_taggings`,
`is_humans`, `is_interests`) and defines inline `AP*`/`IS*` models.

- trails: `packages/activerecord/src/associations.test.ts` (`AssociationProxyTest` describe)
- Rails: `vendor/rails/activerecord/test/cases/associations_test.rb` (`AssociationProxyTest`)

## Acceptance criteria

- [ ] Convert the `AssociationProxyTest` describe onto canonical `TEST_SCHEMA` + official models (`Author`/`Post`/`Comment`/`Developer`/`Category` etc.) + fixtures, matching Rails test names verbatim.
- [ ] Remove the describe's bespoke `defineSchema` block.
- [ ] test:compare delta non-negative.
