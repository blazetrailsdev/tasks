---
title: "Honor custom foreignType on polymorphic-through write/read paths"
status: in-progress
updated: 2026-06-29
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 4257
claim: "2026-06-29T10:46:13Z"
assignee: "assoc-poly-through-custom-foreign-type"
blocked-by: null
---

## Context

PR #4247 (story assoc-has-many-custom-foreign-type) taught the **direct**
`has_many ..., as:` write/nullify paths to honor a custom `foreignType`
option (e.g. `imageable_class` instead of the default `imageable_type`):
`collection-association.ts` `setOwnerAttributes` / `computeNullifiedOwnerAttributes`,
and `collection-proxy.ts` concat-insert, `_buildRaw`/build-create, and
`_buildNullifyUpdates`.

The **polymorphic-through** write/read sites in `collection-proxy.ts` were
left out of scope and still hardcode `${underscore(asName)}_type`:

- `_throughOwnerPolymorphic` — `packages/activerecord/src/associations/collection-proxy.ts:1965`
  (`typeCol: \`${underscore(asName)}\_type\``)
- through join-attrs build — `packages/activerecord/src/associations/collection-proxy.ts:2149`
  (`joinAttrs[\`${underscore(throughAssoc.options.as)}\_type\`]`)

These key off the through join-model's own reflection. Rails derives the
column as `reflection.type`, which is `options[:foreign_type] || "#{options[:as]}_type"`
(`vendor/rails/activerecord/lib/active_record/reflection.rb:519`). A
polymorphic-through whose join model declares a custom `foreign_type` would
write/query the wrong column on these paths.

No failing test exists today (no canonical polymorphic-through fixture uses a
custom `foreign_type`), so this is a latent deviation rather than a live bug.

## Acceptance criteria

- [ ] `_throughOwnerPolymorphic` resolves `typeCol` via
      `throughAssoc.options.foreignType ?? \`${underscore(asName)}\_type\``
- [ ] The through join-attrs build path (`:2149`) honors the through
      reflection's `foreignType` the same way
- [ ] A test covering a polymorphic-through with a custom `foreign_type`
      (mirroring a Rails test if one exists; otherwise document the gap) passes
- [ ] No regression in `has-many-through-associations.test.ts` /
      `nested-through-associations.test.ts`
