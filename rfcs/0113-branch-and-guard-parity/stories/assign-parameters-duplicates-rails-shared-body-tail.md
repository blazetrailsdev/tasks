---
title: "assignParameters duplicates Rails' single rack.input tail into both arms, with divergent length math"
status: ready
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: 37
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `assign_parameters`
(`vendor/rails/actionpack/lib/action_controller/test_case.rb:110-135`) branches
only to compute `data`, then writes the body once, through a shared tail:

```ruby
data_stream = StringIO.new(data.b)
set_header "CONTENT_LENGTH", data_stream.length.to_s
set_header "rack.input", data_stream
```

trails duplicates that tail into both arms of the branch
(`packages/actionpack/src/action-controller/test-case.ts:493-494` and
`:519-521`), and each copy diverges from the Ruby and from the other:

- the multipart arm measures with `Buffer.byteLength(data, "binary")`, the
  else arm with `new TextEncoder().encode(data).byteLength` — latin1 vs UTF-8,
  so a non-ASCII urlencoded body reports a different `CONTENT_LENGTH` than the
  same bytes would through the multipart arm.
- neither wraps the body in a `StringIO`; `rack.input` is set to a raw JS
  string, where Rails hands downstream middleware a rewindable IO.

`StringIO` is already available from `@blazetrails/ruby-compat` and is what
`Rack::Test::Utils.buildMultipart` builds its body in
(`packages/rack-test/src/utils.ts:47-50`), so the Ruby shape is reachable.

Surfaced while porting `ENCODER` in #7502; both tails predate that PR.

## Converged shape

One tail after the if/else, matching `test_case.rb:130-132`: each arm assigns
`data` and nothing else, then a single `dataStream = new StringIO(b(data))`
supplies both `CONTENT_LENGTH` and `rack.input`.

## Acceptance criteria

- [ ] `CONTENT_LENGTH` and `rack.input` are written exactly once, after the
      branch.
- [ ] Length is the byte length of `data.b`, identical for both arms.
- [ ] `rack.input` is a rewindable `StringIO`, not a string.
