---
title: "form-builder-nested-attributes-probe-misses-ar-writer-spelling"
status: ready
updated: 2026-10-01
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

`port-form-helper-form-for-and-fields-for` ported `FormBuilder#fields_for` and its
`nested_attributes_association?` probe
(`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/form_helper.rb:2704-2706`)
literally, as an `rbObjRespondTo` probe for the association name plus `_attributes=`, in
`packages/actionview/src/helpers/form-helper.ts` (`isNestedAttributesAssociation`), and
`fieldsForWithNestedAttributes` names the fields `post[comments_attributes][0]`
(`form_helper.rb:2709`), which is what `Tags::Translator`'s `_attributes]` rewrite
(`actionview/lib/action_view/helpers/tags/translator.rb:8`) and the Rails tests expect.

ActiveRecord's generated nested-attributes writer is spelled differently in trails:
`generateAssociationWriter` (`packages/activerecord/src/nested-attributes.ts:195-217`, Rails
`activerecord/lib/active_record/nested_attributes.rb` `generate_association_writer`, which
defines `#{association_name}_attributes=`) defines `setCommentsAttributes` and
`commentsAttributes=`, never `comments_attributes=`. So for a real trails ActiveRecord model
`f.fieldsFor("comments")` does not take the nested-attributes arm: the probe answers false,
the plain arm names the fields `post[comments]`, and no `[comments_attributes][N]` index or
hidden `id` is emitted. The form-helper tests pass only because their `Post` test model
(mirroring `actionview/test/lib/controller/fake_models.rb`) defines a `comments_attributes`
setter by hand.

The two halves need one spelling: either the writer AR generates answers
`comments_attributes=` (and mass-assignment of a `comments_attributes` param key reaches it),
or the form builder's probe and emitted field name follow AR's camelCase spelling — in which
case `Translator`'s regex and the ported Rails expectations move with it. Decide from how
`assign_attributes` (`packages/activemodel/src/attribute-assignment.ts:67`) resolves a
snake_case param key today.

## Acceptance criteria

- `f.fieldsFor("comments")` on a trails ActiveRecord model with
  `acceptsNestedAttributesFor("comments")` takes the `fields_for_with_nested_attributes` arm
  and the submitted params round-trip through `assignAttributes` to the nested writer.
- A test drives that end to end with a real ActiveRecord model rather than a hand-written
  `comments_attributes` setter.
