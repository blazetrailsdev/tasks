---
title: "nested-attr-hasmany-fk-from-reflection"
status: done
updated: 2026-06-21
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3772
claim: "2026-06-21T03:42:41Z"
assignee: "nested-attr-hasmany-fk-from-reflection"
blocked-by: null
---

## Context

`packages/activerecord/src/nested-attributes.ts` `processNestedAttributes`
(~lines 221-225) derives a has-many association's foreign key as
`${underscore(ctor.name)}_id` from the **runtime instance's** constructor
name when the association reflection carries no explicit `foreignKey`.

Rails derives the FK from the association reflection's `active_record`
(the class that _declared_ the association), not the instance's class. So a
subclass instance (`Class.new(Pirate).new`) of a model that declares
`has_many :birds` correctly resolves the FK to `pirate_id`, never
`sub_pirate_id`.

Surfaced while canonicalizing `TestNestedAttributesInGeneral`
(PR #3642): the "accepts nested attributes for can be overridden in
subclasses" test had to filter the inherited `birds` reflection and
re-declare it with an explicit `foreignKey: "pirate_id"` to work around
this. A bare `class SubPirate extends CanonicalPirate {}` fails (nested
birds get a non-existent `sub_pirate_id` FK → never persisted).

## Acceptance criteria

- `processNestedAttributes` (and any sibling FK derivation in nested
  attributes) resolves a has-many/has-one FK from the association
  reflection's owner class, matching Rails.
- The `nested-attributes.test.ts` "accepts nested attributes for can be
  overridden in subclasses" test passes with a bare
  `class SubPirate extends CanonicalPirate {}` (no `_associations` filter,
  no explicit `foreignKey`), and that workaround is removed.
- No regressions in test:compare / api:compare.
