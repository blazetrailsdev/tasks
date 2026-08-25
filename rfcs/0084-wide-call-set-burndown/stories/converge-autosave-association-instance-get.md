---
title: "converge-autosave-association-instance-get"
status: done
updated: 2026-08-11
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6382
claim: "2026-08-11T22:26:02Z"
assignee: "converge-autosave-association-instance-get"
blocked-by: null
closed-reason: null
---

## Context

Split out of `burndown-associations` (RFC 0084) after the post-0083 re-measure.

`autosave_association.rb` carries six wide-ratchet rows for
`association_instance_get`, plus `compute_primary_key` and `define_method`:

- `nested_records_changed_for_autosave?` — `association_instance_get`, `wrap`
- `validate_has_one_association` / `validate_belongs_to_association` /
  `validate_collection_association` — `association_instance_get`
- `save_collection_association` — `association_instance_get`,
  `associated_records_to_validate_or_save`
- `save_has_one_association` / `save_belongs_to_association` —
  `association_instance_get`, `compute_primary_key`
- `define_non_cyclic_method` — `define_method`

Rails reads the association through `association_instance_get(reflection.name)`
(vendor/rails/activerecord/lib/active_record/associations.rb:214) everywhere in
this file; trails' `packages/activerecord/src/autosave-association.ts` reaches
for the association by another route in each of these bodies, so the same
lookup is spelled six different ways and the Rails helper has no single
counterpart.

`compute_primary_key` (autosave_association.rb, `save_has_one_association` /
`save_belongs_to_association`) resolves the FK target column and is missing
outright — worth confirming whether trails hardcodes the primary key there.

## Acceptance criteria

1. `associationInstanceGet` exists at the Rails name and every listed body
   reads the association through it.
2. `computePrimaryKey` is ported and called from both save paths; confirm
   against `vendor/rails/activerecord/lib/active_record/autosave_association.rb`
   whether the current hardcoding is a behavioral bug (a `primary_key:` /
   `query_constraints` association would expose it) and add a regression test if so.
3. Rows retired by hand from
   `scripts/api-compare/call-mismatches-exclude/activerecord/autosave-association.json`
   (only-shrink; no `--write`).
4. Verified against
   `vendor/rails/activerecord/test/cases/autosave_association_test.rb`.
