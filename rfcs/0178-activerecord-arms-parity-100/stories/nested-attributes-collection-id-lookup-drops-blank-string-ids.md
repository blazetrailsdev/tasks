---
title: "activerecord: nested-attributes collection id lookup drops blank-string ids Rails' filter_map keeps"
status: ready
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`assign_nested_attributes_for_collection_association`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/nested_attributes.rb:510-515`) collects the ids
to look up with `attributes_collection.filter_map { |a| a["id"] || a[:id] }`. `filter_map` drops
`nil` and `false` only, so an `id: ""` is kept and the existing-record query runs with it; the
attributes hash is then treated as a new record by `attributes["id"].blank?` (`:523`).

The port (`packages/activerecord/src/nested-attributes.ts`,
`assignNestedAttributesForCollectionAssociation`) filters with
`id != null && id !== false && id !== ""`. Dropping `""` skips a query Rails makes. It was left in
trails#8731 because removing it makes the body answer a promise on a path `new Foo({...})` reaches
synchronously; that was reasoned, not tested.

## Acceptance criteria

- [ ] The id collection drops `nil` and `false` only, as `filter_map` does, or the story is shown to
      wait on `reopen-rfc-0087-constructor-arm-for-association-io-at-assignment` and carries that
      `deps` edge.
- [ ] `nested-attributes*.test.ts` green.
