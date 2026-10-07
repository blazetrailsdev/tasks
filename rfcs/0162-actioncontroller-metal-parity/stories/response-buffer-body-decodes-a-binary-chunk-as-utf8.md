---
title: "ResponseBuffer#body decodes a binary chunk as UTF-8 where Rails appends it"
status: ready
updated: 2026-10-07
rfc: "0162-actioncontroller-metal-parity"
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

`ActionDispatch::Response::Buffer#body`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/response.rb`, `def body` on `Buffer`)
joins the chunks into one String: `buf = +""; each { |chunk| buf << chunk }`. A
binary chunk stays binary, so `response.body` equals the bytes `send_data` was
given (`actionpack/test/controller/send_file_test.rb:121-128`, `test_data`,
`assert_equal file_data, response.body`).

trails' `ResponseBuffer#body`
(`packages/actionpack/src/action-dispatch/http/response.ts`) builds the string
with `buf += String(chunk)`. Since trails#8610 a `send_data` Buffer reaches the
buffer as a `Uint8Array` chunk (the binary String seat, see ruby-compat's
`rbObjAsString`), and `String(chunk)` decodes it as UTF-8. The rack body
(`each` / `bodyParts`) is byte-exact; the string view is not.
`SendFileTest` "data" in
`packages/actionpack/src/action-controller/controller/send-file.test.ts`
therefore asserts `response.bodyParts()` rather than `response.body`.

## Acceptance criteria

- [ ] `ResponseBuffer#body` joins chunks with Ruby's `String#<<` semantics, so a
      `Uint8Array` chunk is carried without a UTF-8 decode.
- [ ] `SendFileTest` "data" asserts `response.body` against the file data, as
      `send_file_test.rb:127` does.
