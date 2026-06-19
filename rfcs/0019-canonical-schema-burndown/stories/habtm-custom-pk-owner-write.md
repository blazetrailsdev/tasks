---
title: "habtm-custom-pk-owner-write"
status: done
updated: 2026-06-19
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 50
pr: 3609
claim: "2026-06-18T23:03:07Z"
assignee: "habtm-custom-pk-owner-write"
blocked-by: null
---

## Context

`associations/has-and-belongs-to-many-associations.test.ts` (canonicalized in
PR #3480, RFC 0019) had to keep two Rails tests skipped:

- `should property quote string primary keys`
- `proper usage of primary keys and join table`

Both mirror Rails `setup_data_for_habtm_case` (`country.treaties << treaty`
where `Country#country_id` / `Treaty#treaty_id` are custom string primary
keys, schema.rb `create_table :countries, id: false`).

HABTM `push` derives the owner-side join foreign key (`countries_treaties.country_id`)
from the owner's `id` attribute rather than its configured primary key, so a
custom-string-PK owner writes a NULL owner FK and the insert fails
(`NOT NULL constraint failed: countries_treaties.country_id`). The read path
already honors the custom PK; only the join-row write path does not.

The canonical Country/Treaty models now declare `static _primaryKey`
(country_id / treaty_id), so `Country.primaryKey` is already correct — the
remaining gap is purely the HABTM owner-FK write derivation.

## Acceptance criteria

- [ ] HABTM `collection << record` writes the owner-side join FK from the
      owner's primary-key value (not `owner.id`), so custom string-PK owners
      round-trip.
- [ ] Un-skip both tests in
      `associations/has-and-belongs-to-many-associations.test.ts` (verbatim
      names) and assert against the canonical Country/Treaty models + push.
- [ ] No regression in has_many/has_one through + habtm suites.
