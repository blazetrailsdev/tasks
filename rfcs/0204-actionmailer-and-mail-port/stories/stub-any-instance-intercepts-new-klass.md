---
title: "stubAnyInstance intercepts new Klass and awaits its block"
status: draft
updated: 2026-11-06
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`stubAnyInstance` (`packages/activesupport/src/testing/method-call-assertions.ts:232`) swaps `klass.new`. Trails constructs with `new Klass` (CLAUDE.md, "A record is built with `new Klass` only"), so a body that does `new this(...)`, such as `Preview.call` (`packages/actionmailer/src/preview.ts`), never sees the stub. Rails' `stub_any_instance` (`vendor/rails/v8.0.2/activesupport/lib/active_support/testing/method_call_assertions.rb`) stubs `klass.new` and returns the given instance. Trails#9764 had to stub `welcome` on `BaseMailerPreview.prototype` in `BasePreviewInterceptorsTest` (`packages/actionmailer/src/base.test.ts`) instead. `stubAnyInstance` is also sync, so it cannot wrap an async block.

## Acceptance criteria

- `stubAnyInstance` makes `new klass(...)` return the stubbed instance for the block's duration, for example by swapping a construct hook or the class binding, and it awaits an async block.
- `BasePreviewInterceptorsTest` uses `stubAnyInstance(BaseMailerPreview, {}, (instance) => stub(instance, "welcome", mail, ...))` as Rails does at `actionmailer/test/base_test.rb:1056-1062`.
