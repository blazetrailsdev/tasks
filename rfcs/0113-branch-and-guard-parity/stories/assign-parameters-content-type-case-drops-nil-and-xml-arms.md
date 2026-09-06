---
title: "assignParameters' Content-Type case drops Rails' nil raise and encodes :xml as a query string"
status: claimed
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 5
pr: null
claim: "2026-09-06T14:38:14Z"
assignee: "converge-route-set-recognize-path-onto-mock-request-env-for"
blocked-by: null
closed-reason: null
---

## Context

Rails' `assign_parameters` dispatches the non-multipart body on
`content_mime_type&.to_sym` with a four-arm `case`
(`vendor/rails/actionpack/lib/action_controller/test_case.rb:119-131`):

```ruby
case content_mime_type&.to_sym
when nil
  raise "Unknown Content-Type: #{content_type}"
when :json
  data = ActiveSupport::JSON.encode(non_path_parameters)
when :xml
  data = non_path_parameters.to_xml
when :url_encoded_form
  data = non_path_parameters.to_query
else
  @custom_param_parsers[content_mime_type.symbol] = ->(_) { non_path_parameters }
  data = non_path_parameters.to_query
end
```

`packages/actionpack/src/action-controller/test-case.ts:501-517` diverges in
three ways:

1. **The `when nil` arm is dropped.** An unrecognised Content-Type falls
   through to the `else`, silently registering a custom parser under the raw
   media-type string instead of raising `Unknown Content-Type: ...`.
2. **`:xml` is conflated with `:url_encoded_form`.** Both are encoded with
   `buildNestedQuery`, where Rails uses `to_xml` for `:xml`. A controller test
   posting XML gets a urlencoded body.
3. **The dispatch value is hand-rolled**, not `content_mime_type&.to_sym`:
   `ct.split(";")[0].trim().toLowerCase()` then
   `MimeType.lookup(mediaType).symbol ?? mediaType`, with an extra
   `ct.includes("application/x-www-form-urlencoded")` disjunct bolted onto the
   `:url_encoded_form` arm. That `??` fallback to the raw string is what makes
   the missing `nil` arm unreachable.

`contentMimeType` already exists on the request, so the Ruby dispatch is
reachable.

Surfaced while porting `ENCODER` in #7502; this arm predates that PR and was
left untouched to keep the change scoped to the multipart branch.

## Converged shape

Dispatch on `this.contentMimeType?.symbol` with Rails' four arms in Rails'
order, including the `nil` arm's `raise` and `:xml`'s `toXml`. Drop the
`ct.includes(...)` disjunct and the `?? mediaType` fallback — `:url_encoded_form`
is what `MimeType` already resolves that header to.

## Acceptance criteria

- [ ] An unknown Content-Type raises `Unknown Content-Type: #{contentType}`.
- [ ] `:xml` encodes with `toXml`, not `buildNestedQuery`.
- [ ] Dispatch reads `contentMimeType`'s symbol; no raw-string media-type
      matching remains.
