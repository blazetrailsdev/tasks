---
title: "canonical-fixture-ref-resolves-explicit-id"
status: in-progress
updated: 2026-06-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3635
claim: "2026-06-19T12:00:26Z"
assignee: "canonical-fixture-ref-resolves-explicit-id"
blocked-by: null
---

## Context

Surfaced by the canonical conversion of
`packages/activerecord/src/associations/join-model.test.ts` (wave 3, RFC 0019).
`test_has_many_through_with_custom_primary_key_on_belongs_to_source` is
`it.skip`'d there.

The test relies on a cross-table id coincidence: Rails
`authors.author_address_extra_id == categorizations.author_id == 2`. In the
canonical fixtures `ref("author_addresses", "david_address_extra")` resolves to
a label-hash (e.g. 1006418192) instead of the explicit `id: 2` pinned in the
author_addresses fixture, so the belongs_to custom-primary_key join never
matches. Debug: `david.author_address_extra_id` = 1006418192 while the
author_addresses row has id 2.

A `ref()` to a fixture that pins an explicit `id:` must resolve to that id, not
to the label-hash.

## Acceptance criteria

- [ ] `ref()` resolves to a target fixture's explicit `id:` when present.
- [ ] Un-skip `has many through with custom primary key on belongs to source`.
