---
title: "parse_formatted_parameters rescues every thrown value, not only StandardError"
status: done
updated: 2026-10-06
rfc: "0164-actiondispatch-http-parity"
cluster: null
packages: ["actionpack", "ruby-compat"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8569
claim: "2026-10-06T13:12:05Z"
assignee: "parse-formatted-parameters-rescues-every-thrown-value"
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Http::Parameters#parse_formatted_parameters`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/parameters.rb:89-100`)
wraps `strategy.call(raw_post)` in a bare `rescue`, which takes `StandardError`
only. An `Interrupt` (`SignalException < Exception`,
`vendor/ruby/v3.3.11/error.c:3318`) raised by a parser propagates unchanged.

`parseFormattedParameters` in
`packages/actionpack/src/action-dispatch/http/parameters.ts:104-129` has a bare
`catch (e)` that converts every thrown value into `ParseError`, plus three
invented re-raise arms (`ParseError`, and the three Rack parameter errors) that
Rails' body does not have. ruby-compat has no `Interrupt` / `SignalException`
class to raise.

`webservice_test.rb:101-113` (`test_parsing_json_doesnot_rescue_exception`)
asserts `assert_raises(Interrupt) { req.request_parameters }`. Its port in
`packages/actionpack/src/action-controller/controller/webservice.test.ts` is
parked `it.skip` under a `BLOCKED:` line naming this story.

## Acceptance criteria

- [ ] ruby-compat exports `SignalException` and `Interrupt` at MRI's hierarchy
      (`error.c:3318`), each with its `@noRailsEquivalent PERMANENT` receipt.
- [ ] `parseFormattedParameters`' rescue takes what a bare Ruby `rescue` takes
      and nothing else; the invented re-raise arms are converged away or
      receipted with `@inventedArm`.
- [ ] "parsing json doesnot rescue exception" is un-skipped and green.
