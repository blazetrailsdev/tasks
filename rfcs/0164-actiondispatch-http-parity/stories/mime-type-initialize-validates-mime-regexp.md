---
title: "mime-type-initialize-validates-mime-regexp"
status: draft
updated: 2026-09-30
rfc: "0164-actiondispatch-http-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `Mime::Type#initialize`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/mime_type.rb:264-270`)
validates its string against `MIME_REGEXP` (`:257-260`, built from
`MIME_NAME` / `MIME_PARAMETER_VALUE` / `MIME_PARAMETER`) and raises
`InvalidMimeType, "#{string.inspect} is not a valid MIME type"`. It also sets
`@hash = [@string, @synonyms, @symbol].hash`.

trails' `MimeType` constructor
(`packages/actionpack/src/action-dispatch/http/mime-type.ts`) validates
nothing and defines neither the regexp constants nor `InvalidMimeType`. So:

- `MimeType.lookup("")` returns a `MimeType("")`. In Rails, `"".split(";", 2)[0]`
  is `nil`, `LOOKUP[nil]` misses, and `Type.new(nil)` raises `InvalidMimeType`
  (`mime_type.rb:163-168`). Surfaced in review of trails#8256.
- Rails' tests "invalid mime types raise error" and "can be initialized with
  parameters without having space after ;" (`test/dispatch/mime_type_test.rb:230-273`)
  cannot be ported.

`MimeNegotiation::InvalidType`'s parent is story
`mime-type-invented-constants-and-invalid-type-parent`; this story is the
validation itself.

## Acceptance criteria

- [ ] `MIME_NAME`, `MIME_PARAMETER_VALUE`, `MIME_PARAMETER` and `MIME_REGEXP`
      ported per `mime_type.rb:257-260`; `Mime::Type::InvalidMimeType < StandardError`
      defined (`:262`).
- [ ] The constructor raises `InvalidMimeType` with Rails' message for a
      string that does not match, including `nil`.
- [ ] `lookup` passes `nil` on for an empty string, as `split(";", 2)[0]&.rstrip` does.
- [ ] "invalid mime types raise error" is ported with its Rails name.
