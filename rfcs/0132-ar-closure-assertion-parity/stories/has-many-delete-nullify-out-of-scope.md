---
title: "has-many-delete-nullify-out-of-scope"
status: done
updated: 2026-09-21
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: trails#7930
claim: "2026-09-21T13:41:59Z"
assignee: "assert-helper-only-tests-trip-the-missing-assertions-guard"
blocked-by: null
closed-reason: null
---

## Context

`CollectionAssociation#delete` nullifies the foreign key of a record that is NOT in the
association's scope. Rails' `test_deleting_a_item_which_is_not_in_the_collection`
(`vendor/rails/activerecord/test/cases/associations/has_many_associations_test.rb:1764-1773`)
deletes `Client.find_by_name("Summit")` — `first_client`, `client_of: 2`
(`vendor/rails/activerecord/test/fixtures/companies.yml:1-7`) — from
`companies(:first_firm).clients_of_firm` (`client_of: 1`) and asserts `summit.client_of`
is still `2`, because Rails scopes the nullify UPDATE to the association
(`vendor/rails/activerecord/lib/active_record/associations/has_many_association.rb`'s
`delete_records` → `scope.where(...)`).

trails sets `summit.client_of` to `null`. The test is parked with `it.skip` + a `BLOCKED:`
line in `packages/activerecord/src/associations/has-many-associations.test.ts`
(the `describe` added by trails#TBD for `assertions-has-many-associations-remainder-2`).

## Acceptance criteria

- `CollectionAssociation#delete` / `HasManyAssociation#delete_records` only touches records
  inside the association scope, mirroring the Rails bodies.
- `deleting a item which is not in the collection` is un-skipped and passes, with its
  `BLOCKED:` line removed.
