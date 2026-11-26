---
title: "response-body-does-not-buffer-enumerator"
status: claimed
updated: 2026-11-26
rfc: "0259-near-complete-packages-to-100"
cluster: null
packages: []
deps:
  - actiondispatch-reaches-100
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-26T14:14:48Z"
assignee: "generator-class-paths-actiontext-actionmailbox-stimulus"
blocked-by: null
closed-reason: null
---

## Context

Rails' `Response#body=` (`vendor/rails/v8.0.5.2/actionpack/lib/action_dispatch/http/response.rb:371-384`)
buffers only a `to_str` or `to_ary` body; any other body (an `Enumerator`, a
streaming body) is stored as `@stream` unchanged, and `Response#body`
(`:356-364`) answers it as is. trails' `setBody`
(`packages/actionpack/lib/action-dispatch/http/response.ts`, the
`rbObjRespondTo(body, "each") || body instanceof ReadableStream` arm) also
buffers every `each` body and every `ReadableStream`. Dropping that arm (tried in
the actiondispatch-reaches-100 PR) reds 16 streaming tests
(`render-streaming.test.ts`, `readable-stream-body.trails.test.ts`,
`base.trails.test.ts` streaming describes, `response.test.ts` "each isnt called
if str body is written"), because trails' streamed template body relies on
being wrapped in a Buffer.

Rails test: `actionpack/test/dispatch/response_test.rb:656-667`
"response does not buffer enumerator body".

## Acceptance criteria

- [ ] `setBody` mirrors `body=`: buffer only `to_str` / `to_ary`; other bodies stored unchanged.
- [ ] The streaming paths keep working without the invented `each` / `ReadableStream` arm.
- [ ] "response does not buffer enumerator body" is ported in `dispatch/response.test.ts` and passes.
