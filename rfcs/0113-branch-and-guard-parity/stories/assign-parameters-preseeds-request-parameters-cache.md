---
title: "assignParameters pre-seeds the request_parameters cache Rails leaves the body to fill"
status: ready
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 36
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`TestRequest#assignParameters`'s multipart arm
(`packages/actionpack/src/action-controller/test-case.ts:490-495`) ends with a
line Rails does not have:

```ts
this.env["action_dispatch.request.request_parameters"] = nonPathParameters;
```

Rails' `assign_parameters`
(`vendor/rails/actionpack/lib/action_controller/test_case.rb:110-135`) has no
such assignment in either arm. It builds the multipart body, sets
`CONTENT_TYPE` / `CONTENT_LENGTH` / `rack.input`, and lets the request parse
its own parameters back out of the wire body on demand:

```ruby
if ENCODER.should_multipart?(non_path_parameters)
  self.content_type = ENCODER.content_type
  data = ENCODER.build_multipart non_path_parameters
else
  ...
end

data_stream = StringIO.new(data.b)
set_header "CONTENT_LENGTH", data_stream.length.to_s
set_header "rack.input", data_stream
```

The pre-seeded cache means a trails controller test never exercises multipart
_parsing_ — `requestParameters` short-circuits on the cached hash
(`test-case.ts:519-521`) and hands back the very objects that were passed in,
including live `Rack::Test::UploadedFile` instances, where Rails would return
whatever `Rack::Multipart` parsed off the body. A multipart round-trip bug in
the parser is invisible to every controller test as a result.

Surfaced while porting `ENCODER` in #7502; the line predates that PR and was
left in place to keep the change scoped to the encoder.

## Converged shape

Delete the assignment. `assignParameters` writes only the three headers Rails
writes, and `requestParameters` parses the multipart body like any other
request. Expect `test-case.test.ts`'s "assignParameters builds real multipart
body when params include an UploadedFile" to need its
`toBeInstanceOf(UploadedFile)` assertion revisited — after convergence the
parsed value is whatever the multipart parser returns, which is the point of
the story, not a regression.

## Acceptance criteria

- [ ] No `action_dispatch.request.request_parameters` write in `assignParameters`.
- [ ] A controller test posting an `UploadedFile` round-trips through the
      encoded body rather than the pre-seeded hash.
