---
title: "UploadedFile#initialize drops the encode!/force_encoding UTF-8 arm for filename and head"
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActionDispatch::Http::UploadedFile#initialize`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/upload.rb`, `def initialize(hash)`)
dups `hash[:filename]` and `hash[:head]`, then `encode!(Encoding::UTF_8)` with a
`rescue EncodingError` → `force_encoding(Encoding::UTF_8)` arm. trails'
`packages/actionpack/src/action-dispatch/http/upload.ts` constructor assigns
both verbatim, dropping the encode/rescue calls.

Effect: a multipart filename reaches `original_filename` as the binary
one-char-per-byte string Rack produces, so `ファイル%名.txt` reads as mojibake.
`multipart_params_parsing_test.rb:86` is dropped via an assertion receipt in
`scripts/test-compare/assertion-receipts.ts` (trails#8914).

## Acceptance criteria

- The constructor calls `encode(..., Encoding.UTF_8)` with an `EncodingError`
  rescue to `forceEncoding(..., Encoding.UTF_8)` for both filename and head, in
  Rails' order — which needs the Rack parser to hand the filename as bytes
  (a `Uint8Array` tagged ASCII-8BIT) so `encode` sees a binary receiver.
- The `:86` receipt row is deleted and the assertion is restored in
  `dispatch/request/multipart-params-parsing.test.ts`.
