---
title: "A1i — eager_test: notifications/i18n, too-many-ids, preload SQL, pk has_one"
status: in-progress
updated: 2026-06-22
rfc: "0030-ar-test-compare-residual-burndown"
cluster: associations
deps: []
deps-rfc: []
est-loc: null
priority: 30
pr: 3930
claim: "2026-06-22T21:39:15Z"
assignee: "a1-eager-misc-notifications-too-many-ids"
blocked-by: null
---

## Context

Split off from `a1-eager-preloader-semantics` (RFC 0030). Remaining eager_test.rb cases not in the other split stories: ActiveSupport **load notifications** + i18n **base messages**, the **no-temp-instances** allocation guard, **too-many-ids** IN-clause splitting (Citation, 65536-row fixture), the generated **belongs_to preload SQL** assertion, and **has_one using primary_key** over the STI Firm model.

Rails: vendor/rails/activerecord/test/cases/associations/eager_test.rb.

### Tests to un-skip

- association loading notification
- base messages
- dont create temporary active record instances
- preloading too many ids
- eager loading too many ids
- preloading belongs_to association SQL
- preload has one using primary key
- include has one using primary key

## Acceptance criteria

- [ ] Each listed test un-skipped + passing (Rails-faithful, canonical models/fixtures) or reclassified permanent-skip with reason.
- [ ] No new gate-mismatches.
