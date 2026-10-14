---
title: "url-helper-positional-nil-collides-with-a-string-id-option"
status: done
updated: 2026-10-14
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8906
claim: "2026-10-14T15:29:18Z"
assignee: "path-redirect-holds-its-template-string-as-block"
blocked-by: null
closed-reason: null
---

## Context

`TestUrlGenerationErrors#test_exceptions_have_suggestions_for_fix`
(`vendor/rails/v8.0.2/actionpack/test/dispatch/routing_test.rb:4981-4984`)
calls `product_path(nil, "id" => "url-tested")` and expects
`ActionController::UrlGenerationError`. In Ruby the positional `nil` fills the
Symbol key `:id` and `"id"` is a separate String key, so `:id` stays nil and
generation fails. In trails a Ruby Symbol is a JS string, so the options hash
`{ id: "url-tested" }` overwrites the positional `null` and the helper answers
`/products/url-tested`. The same collision makes the sibling
`URL helpers raise message with mixed parameters when generation fails`
(`:4964-4975`) unportable as written; its current trails body tests a
different route.

The port in `packages/actionpack/src/action-dispatch/dispatch/routing.test.ts`
is parked as `it.skip` under `// BLOCKED:` naming this story.
`UrlGenerationError` now includes `DidYouMean::Correctable` and
`ActionControllerError` extends `StandardError`
(`action_controller/metal/exceptions.rb:6,38-39`), so `detailedMessage`
answers once the error is raised.

## Acceptance criteria

- [ ] Decide how a route-helper call distinguishes a String `"id"` option from
      the positional Symbol `:id` (or rule the arm permanent with the owner),
      and un-skip `exceptions have suggestions for fix` with Rails' body.
