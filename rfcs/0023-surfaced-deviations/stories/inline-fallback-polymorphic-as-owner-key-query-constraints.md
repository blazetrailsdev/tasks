---
title: "loadHasMany/loadHasOne polymorphic inline fallback: route owner key through _inlineOwnerKey"
status: in-progress
updated: 2026-06-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 3747
claim: "2026-06-20T22:47:27Z"
assignee: "inline-fallback-polymorphic-as-owner-key-query-constraints"
blocked-by: null
---

## Context

Follow-up surfaced reviewing PR #3740
(`inline-fallback-composite-pk-active-record-primary-key`, RFC 0023). That PR
routed the scalar-FK inline (no-reflection) fallback branches in `loadHasMany`
and `loadHasOne` (`packages/activerecord/src/associations.ts`) through
`_inlineOwnerKey`, which mirrors `reflection.active_record_primary_key`
(reflection.rb:587-604): explicit `options.primaryKey` → query_constraints →
composite-PK array collapse → scalar PK.

The **polymorphic** scalar-FK branches (`options.as`) were left untouched and
still compute the owner key inline as `Array.isArray(primaryKey) ? "id" :
primaryKey` rather than routing through `_inlineOwnerKey`:

- `loadHasOne` polymorphic branch (associations.ts:~1357-1363)
- `loadHasMany` polymorphic branch (associations.ts:~1636-1642)

Consequence: a polymorphic association on a **query_constraints owner** hits
the wrong owner-key path — it keys against the scalar `id`/collapsed `"id"`
instead of the owner's `query_constraints_list`, diverging from
`reflection.active_record_primary_key`. Pre-existing; out of scope for #3740.

## Acceptance criteria

- [ ] The `options.as` scalar-FK fallback branches in `loadHasMany` /
      `loadHasOne` resolve the owner key via `_inlineOwnerKey` (or otherwise
      honor query_constraints), matching `reflection.active_record_primary_key`.
- [ ] A no-reflection test with a polymorphic association on a
      query_constraints owner keys via the query_constraints list, not the
      scalar `id`.
