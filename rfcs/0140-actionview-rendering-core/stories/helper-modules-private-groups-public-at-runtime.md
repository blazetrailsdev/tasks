---
title: "Helper modules' Rails-private groups (active_model_helper.rb:39, tag_helper.rb:574, form_tag_helper.rb:985) are public at runtime"
status: draft
updated: 2026-09-30
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8268 made `ActiveModelInstanceTag`, `TagHelper` and `FormTagHelper` live `Module`s (`packages/actionview/src/helpers/active-model-helper.ts`, `tag-helper.ts`, `form-tag-helper.ts`). Each one registers its methods in the public/private groups Rails declares:

- `vendor/rails/v8.0.2/actionview/lib/action_view/helpers/active_model_helper.rb:39`: `object_has_errors?`, `select_markup_helper?` and `tag_generate_errors?` are private.
- `tag_helper.rb:574`: `build_tag_values` and `tag_builder` are private.
- `form_tag_helper.rb:985`: `html_options_for_form`, `extra_tags_for_form`, `form_tag_html`, `form_tag_with_body`, `sanitize_to_id` and `set_default_disable_with` are private.

The private group is only `@internal` in JSDoc. At runtime it is as public as the rest: `basicObjRespondTo(tag, "isObjectHasErrors")` answers true, and `rbFPublicSend` does not raise. That differs from Ruby's `respond_to?` / `public_send` on a `Tags::Base`.

## Converged shape

Record the private group in the method-visibility side table (CLAUDE.md § "Method visibility is a side table"). That means `rbModPrivate` on the Module, keyed on the Module's carrier the way `Module#private` keys on the module's method table (`vendor/ruby/v3.3.11/vm_method.c:2482-2516`). If `rbModPrivate` only takes a class today, extend it to a `Module` in ruby-compat.

## Acceptance criteria

- The three modules' private groups are private at runtime: `respond_to?` without `include_all` is false, and `public_send` raises `NoMethodError`, on a `Tags::Base` instance.
- The public groups are unchanged.
