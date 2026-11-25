---
title: "SyntaxErrorInTemplate answers an empty 500 instead of the DebugExceptions page"
status: draft
updated: 2026-11-25
rfc: "0141-actionpack-surfaced-deviations"
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

Rails' `Template#compile` turns a `SyntaxError` from the compiled source into `SyntaxErrorInTemplate` (`vendor/rails/v8.0.5.2/actionview/lib/action_view/template.rb:506-514`), and `DebugExceptions` renders it with the template's source extract. trails ports the raise (`packages/actionview/lib/template.ts:412-423`), but the response that comes back is an empty `500` (`content-length: 0`) and nothing is logged beyond `Completed 500 Internal Server Error`.

Repro, in `examples/browser-sqlite` on trails#10753's tree with the example's own wrapper removed (`src/runtime/template-compiler.ts`, the `try`/`catch` around `compile`): change `<h1>Posts</h1>` in `app/views/posts/index.html.tse` to `<h1><%= 1 + %></h1>` and request `/`. The template compiler's `new Function` raises `SyntaxError`, `Template#compile` raises `SyntaxErrorInTemplate`, and the debug page never renders. Wrapping the same failure in a plain `Error` (what the example does now) renders the debug page, so the loss is specific to `SyntaxErrorInTemplate` on its way through `DebugExceptions` / `ExceptionWrapper`. The same path under Node with a precompiled view was not checked.

## Acceptance criteria

- A template whose compiled source has a syntax error answers the `DebugExceptions` page for `ActionView::SyntaxErrorInTemplate` in development, with the message and the log lines Rails writes (`action_dispatch/middleware/debug_exceptions.rb`, `log_error`).
- The root cause is found and named (which call drops the exception, or raises while rendering it), and fixed at that site.
- The example's wrapper in `src/runtime/template-compiler.ts` is deleted and `pnpm smoke` still passes; the smoke gains a step that breaks a template and sees the error page.
