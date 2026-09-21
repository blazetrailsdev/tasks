---
title: "assertions-has-many-associations-remainder-3"
status: ready
updated: 2026-09-21
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Third slice of `assertions-has-many-associations-remainder`. The PR for
`assertions-has-many-associations-remainder-2` converged 12 more tests (adding, adding
using create, adding a mismatch class, deleting, deleting a collection, clearing an
association collection, clearing a dependent association collection, clearing an
exclusively dependent association collection, clearing without initial access, deleting
by string id, destroy all, plus parking `deleting a item which is not in the collection`)
by re-homing them onto the canonical companies/developers/projects/topics fixtures with
`Firm#clients_of_firm`, `#dependent_clients_of_firm`, `#exclusively_dependent_clients_of_firm`
and `#plain_clients`, and porting the class-level `setup`
(`vendor/rails/activerecord/test/cases/associations/has_many_associations_test.rb:125-127`,
`Client.destroyed_client_ids.clear`) as a `beforeEach`.

Counters went 82 → 70 count mismatches and 157 → 145 kind mismatches against
`vendor/rails/activerecord/test/cases/associations/has_many_associations_test.rb`.

Measure: `pnpm parity:test -- --package activerecord --assertions | grep has_many_associations_test`.

Remaining clusters: finder/`assert_queries_count` cluster (find each with conditions, find
in batches, find all/first sanitized, find grouped, find scoped grouped, reload with query
cache), build/new aliased, collection size/empty with dirty target (posts/readers fixtures),
counter-cache cluster, `delete_all` with not-yet-loaded collection (needs
`CollectionProxy#reset`, `vendor/rails/activerecord/lib/active_record/associations/collection_proxy.rb`),
dependence/restrict, get/set ids, replace, extend option, in-memory replacement, composite key.

Known blockers: `association proxy transaction method starts transaction in association class`
(rb:2506); `deleting a item which is not in the collection` (rb:1764) — see
`has-many-delete-nullify-out-of-scope`.

## Acceptance criteria

- 0 assertion count/kind/value mismatches for the file, or a converged slice plus re-filed
  remainder. Parked tests use `it.skip` with a `BLOCKED:` line.
