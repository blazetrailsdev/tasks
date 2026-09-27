---
title: "Port Rails' respond_to_test variant arms (inline, block, any) as controller tests"
status: draft
updated: 2026-09-27
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8166 ported `ActionController::MimeResponds::Collector#response`'s three
arms and `VariantCollector`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/mime_responds.rb:262-333`).
It covered them only with trails-only tests in
`packages/actionpack/src/action-controller/metal/mime-responds.trails.test.ts`.
Rails' own controller tests for those arms are not ported. They live in
`vendor/rails/v8.0.2/actionpack/test/controller/mime/respond_to_test.rb`: the actions at
`:220-318` (`variant_with_format_and_custom_render`, `multiple_variants_for_format`,
`variant_plus_none_for_format`, `variant_inline_syntax`,
`variant_inline_syntax_without_block`, `variant_any`, `variant_any_any`,
`variant_inline_any`, `variant_inline_any_any`, `variant_any_implicit_render`,
`variant_any_with_none`, `format_any_variant_any`) and the tests at `:787-905`.
The trails file `packages/actionpack/src/action-controller/controller/mime/respond-to.test.ts`
tests the invented ActionDispatch `respondTo`, not a controller, and has none of them.

`test_variant_with_implicit_template_rendering` (`:733`) and the other
implicit-render arms are owned by `0140/thread-request-variant-into-deferred-render`;
this story is the explicit-block arms only.

## Acceptance criteria

- [ ] A `RespondToController` port drives each action above through a real
      controller request with `request.variant` set from `params[:v]`
      (`respond_to_test.rb:9-14`).
- [ ] The tests from `test_variant_with_format_and_custom_render` (`:787`)
      through `test_format_any_variant_any` are ported with their Rails
      names verbatim, excluding the implicit-template-rendering ones owned
      by the 0140 story.
- [ ] Any arm that fails is fixed in `mime-responds.ts`, not skipped.
