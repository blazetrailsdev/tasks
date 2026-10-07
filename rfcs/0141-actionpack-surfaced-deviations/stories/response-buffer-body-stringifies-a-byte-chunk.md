---
title: "actionpack: Response::Buffer#body stringifies a byte chunk with JS String()"
status: draft
updated: 2026-10-07
rfc: "0141-actionpack-surfaced-deviations"
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

`ActionDispatch::Response::Buffer#body`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/response.rb:114-120`) is
`buf = +""; each { |chunk| buf << chunk }`. The port
(`packages/actionpack/src/action-dispatch/http/response.ts:69-75`) is
`for (const chunk of this.each()) buf += String(chunk)`.

Since trails#8634 a Rack body part can be a `Uint8Array`, ruby-compat's ASCII-8BIT String seat
(`rbObjEncoding`, `packages/ruby-compat/src/string/force-encoding.ts`): `Rack::Files` yields one
per file part. JS `String(uint8Array)` is the comma-joined decimal bytes (`"104,105"`), so a
buffer holding a byte chunk answers a corrupt `body`. trails#8634 fixed the same shape in
`Rack::Response#buffered_body!`, `Rack::Response#write`, `Rack::MockResponse#body`,
`Rack::ContentLength` and `Rack::Deflater::GzipStream#each`; this site was not reached by a
static file and was left.

## Acceptance criteria

- [ ] `Buffer#body` appends a byte chunk as its bytes, as `buf << chunk` does, and never through
      JS `String()`.
- [ ] A test builds a response whose stream yields a `Uint8Array` chunk with bytes at or above
      0x80 beside a String chunk, and asserts `body`.
- [ ] The other `String(chunk)` / `String(part)` sites over a response body in
      `packages/actionpack/src` (`action-controller/metal/live.ts:181`) are checked and converged
      the same way.
