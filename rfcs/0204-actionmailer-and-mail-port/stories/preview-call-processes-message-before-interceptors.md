---
title: "Preview.call awaits the processed message before preview interceptors"
status: draft
updated: 2026-11-06
rfc: "0204-actionmailer-and-mail-port"
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

Rails' `Preview.call` (`vendor/rails/v8.0.2/actionmailer/lib/action_mailer/preview.rb`) runs `inform_preview_interceptors(message)` on a `MessageDelivery`. Delegator calls process the mail lazily there, so `InlinePreviewInterceptor#transform!` can call `html_part` on the delivery. In trails, processing is async (`MessageDelivery#message()`, `packages/actionmailer/src/message-delivery.ts`). `Preview.call` (`packages/actionmailer/src/preview.ts`) is sync, so the default `InlinePreviewInterceptor` hits `NoMethodError: htmlPart` on an unprocessed delivery. Trails#9764's `BasePreviewInterceptorsTest` worked around this with `await mail.message()` and a `beforeAll` that clears the default interceptors.

## Acceptance criteria

- `Preview.call` is async and awaits the delivery's processed message before `informPreviewInterceptors`, so `InlinePreviewInterceptor` works on a fresh preview.
- The `beforeAll` clear and the `await mail.message()` calls in `base.test.ts` (`BasePreviewInterceptorsTest`) are removed.
