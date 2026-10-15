---
title: "nested-attributes-writer-uses-rails-snake-attributes-spelling"
status: ready
updated: 2026-10-15
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `generate_association_writer`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/nested_attributes.rb`, `def generate_association_writer`)
defines `#{association_name}_attributes=`. trails' `generateAssociationWriter`
(`packages/activerecord/src/nested-attributes.ts`) defines `setXAttributes` and
`xAttributes=`, and ~54 AR test files mass-assign `shipAttributes:`-style keys.
trails#8940 made `FormBuilder#nested_attributes_association?` and
`fields_for_with_nested_attributes`
(`actionview/lib/action_view/helpers/form_helper.rb:2704-2709`) and
`Tags::Translator` (`tags/translator.rb:8`) follow the camel spelling, so
emitted field names are `post[commentsAttributes][0]` where Rails emits
`post[comments_attributes][0]`, and the ported Rails expectations moved with them.

## Ratification

The repo owner ratified trails#8940's camelCase interim (form builder follows
AR's `${association}Attributes=` writer) on 2026-10-15, pending this story's
convergence.

## Acceptance criteria

- AR's generated writer answers `#{association}_attributes=` (snake), and
  `assignAttributes({ ship_attributes: ... })` reaches it; AR tests use the
  Rails key.
- `form-helper.ts` / `translator.ts` go back to Rails' `_attributes` literal,
  their `@missingRailsArgs` receipts are removed, and the Rails expectations in
  `template/form-helper.test.ts` and
  `activerecord/form-helper-activerecord.test.ts` return to Rails' strings.
