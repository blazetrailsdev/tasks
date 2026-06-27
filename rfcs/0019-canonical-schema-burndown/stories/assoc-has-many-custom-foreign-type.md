---
title: "assoc-has-many-custom-foreign-type"
status: ready
updated: 2026-06-27
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`Post.hasMany("images", { as: "imageable", foreignKey: "imageable_identifier", foreignType: "imageable_class" })`
uses a custom `foreignType` to override the default type column name (`imageable_type` → `imageable_class`).

In `packages/activerecord/src/associations/collection-association.ts:649`, the write path for
polymorphic `as:` associations always uses `${underscore(as)}_type` as the type column:

```ts
const typeCol = `${underscore(this.reflection.options.as)}_type`;
```

This ignores `foreignType` from the association options, so `post.images.push(image)` writes
to `imageable_type` (missing column) instead of `imageable_class`. The query scope also
uses the default name, so both write and read paths need fixing.

Rails source:

- `vendor/rails/activerecord/test/cases/associations/has_many_associations_test.rb:2613`
  `test_with_polymorphic_has_many_with_custom_columns_name`
- `vendor/rails/activerecord/test/models/post.rb` has_many :images, as: :imageable,
  foreign_key: :imageable_identifier, foreign_type: :imageable_class

Skipped in `packages/activerecord/src/associations/has-many-associations.test.ts`
("with polymorphic has many with custom columns name").

## Acceptance criteria

- [ ] `collection-association.ts` respects `foreignType` option when writing the type column
      on `push`, `create`, `build`, and `concat`
- [ ] Association scope (SELECT query) also uses the custom type column name
- [ ] Test `"with polymorphic has many with custom columns name"` un-skipped and passing
- [ ] `pnpm vitest run packages/activerecord/src/associations/has-many-associations.test.ts` passes
