---
title: "preview-call-awaits-message-delivery-before-interceptors"
status: done
updated: 2026-11-06
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9760
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionMailer::Preview.call` (`vendor/rails/v8.0.2/actionmailer/lib/action_mailer/preview.rb`) calls the preview method and hands the result to `inform_preview_interceptors`. A preview method usually returns a `MessageDelivery` (a Delegator to the lazily built `Mail::Message`). In trails `Preview.call` (`packages/actionmailer/src/preview.ts`) is sync and `MessageDelivery#message` is async, so `InlinePreviewInterceptor` reads `htmlPart` on the `MessageDelivery` and raises `NoMethodError`.

`base_test.rb:1150-1162` `BasePreviewTest` "has access to params" is `it.skip` in `packages/actionmailer/src/base.test.ts` under this story.

## Acceptance criteria

- `Preview.call` resolves the preview result to its message before informing interceptors.
- "has access to params" is un-skipped and passes.
