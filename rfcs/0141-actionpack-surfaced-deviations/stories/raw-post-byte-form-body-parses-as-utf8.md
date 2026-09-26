---
title: "raw-post-byte-form-body-parses-as-utf8"
status: draft
updated: 2026-09-26
rfc: "0141-actionpack-surfaced-deviations"
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

`assign-parameters-duplicates-rails-shared-body-tail` wants `TestRequest#assignParameters`
(`packages/actionpack/src/action-controller/test-case.ts`) to end in Rails' single
tail (`vendor/rails/v8.0.2/actionpack/lib/action_controller/test_case.rb:130-132`):

```ruby
data_stream = StringIO.new(data.b)
set_header "CONTENT_LENGTH", data_stream.length.to_s
set_header "rack.input", data_stream
```

Ported literally as `new StringIO(b(data))`, it regresses both arms, measured on a
probe posting `{ title: "café" }`:

- **JSON / url-encoded arm.** `rack.input` becomes byte form (one code unit per
  byte, ruby-compat's ASCII-8BIT convention, `packages/ruby-compat/src/string/b.ts`).
  `Request#rawPost` / `readBodyStream` (`action-dispatch/http/request.ts`) hands
  that byte-form string straight to the `:json` parser
  (`action-dispatch/http/parameters.ts`, Rails `parameters.rb:12-16`), and
  `requestParameters.title` reads `"cafÃ©"`. In Rails `raw_post` is binary too
  (`request.rb:348-353,509-519`), and `ActiveSupport::JSON.decode` reads its bytes
  as UTF-8. trails' read side has no such step.
- **Multipart arm.** `Rack::Test::Utils.build_multipart` already returns an
  ASCII-8BIT String (`vendor/rack-test/v2.2.0/lib/rack/test/utils.rb:54`,
  `String.new`), so Rails' `.b` is the identity there. The trails port
  (`packages/rack-test/src/utils.ts`) `b()`s each part into byte form, and
  `b()` of a byte-form string re-encodes every byte >= 0x80
  (`café` -> `cafÃƒÂ©`, CONTENT_LENGTH 281 -> 284). A JS string has no
  encoding tag, so `b` cannot tell a binary receiver from a UTF-8 one.

## Acceptance criteria

- The request read side treats `raw_post` as a binary body the way Rails does:
  a byte-form `rack.input` holding UTF-8 bytes parses to the same params
  (`:json`, url-encoded, multipart) as the UTF-8 form does today.
- A way to spell "this String is already ASCII-8BIT" exists, so that
  `String#b` on the `build_multipart` result is the identity, as in Ruby.
- With both in place, `assign-parameters-duplicates-rails-shared-body-tail`
  can land its single `new StringIO(b(data))` tail with no change in the
  params a non-ASCII body parses to.
