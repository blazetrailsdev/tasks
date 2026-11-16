---
title: "net-http-multipart-buf-append-mirrors-string-lshift"
status: draft
updated: 2026-11-16
rfc: "0154-ruby-compat-surfaced-deviations"
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

`HTTPGenericRequest#encode_multipart_form_data`
(`vendor/ruby/v3.3.11/lib/net/http/generic_request.rb:313-363`) builds a
mutable String `buf` and appends with `buf << value` (`:333`, `:356`). With an
Integer value, `String#<<` appends that codepoint, and with a String it appends
the bytes. trails' port (`packages/ruby-compat/lib/net/http/request.ts`,
`encodeMultipartFormData`, added in trails#10155) keeps `buf` as an array of
`string | Uint8Array` pieces and coerces each value through a module helper,
`_formValue` (`String(value)` unless it is a `Uint8Array`). It concatenates
them in `flushBuffer` with `_concatBytes`. An Integer field therefore sends its
decimal digits where Ruby sends a codepoint.

## Acceptance criteria

- The `buf << value` arms append as Ruby's `String#<<` does: the codepoint for
  an Integer and the bytes for a String or `Uint8Array`, through ruby-compat's
  existing `String#<<` port if there is one.
- `_formValue` is removed or replaced by that port.
- A raw-`net` test posts an Integer multipart field and compares the bytes with
  Ruby's output.
