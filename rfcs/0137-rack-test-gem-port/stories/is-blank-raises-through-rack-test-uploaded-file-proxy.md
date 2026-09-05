---
title: "is-blank-raises-through-rack-test-uploaded-file-proxy"
status: done
updated: 2026-09-05
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 19
pr: 7529
claim: "2026-09-05T17:58:56Z"
assignee: "port-rack-test-methods"
blocked-by: null
closed-reason: null
---

## Context

`ActionController::Parameters#require` calls `value.blank?`
(`vendor/rails/actionpack/lib/action_controller/metal/strong_parameters.rb`),
which in Ruby is `Object#blank?` — a real public method, so
`Rack::Test::UploadedFile#method_missing`
(`vendor/rack-test/lib/rack/test/uploaded_file.rb:52-54`) is never reached.

In trails `blank?` is the free function `isBlank`
(`packages/activesupport/src/core-ext/object/blank.ts:101-105`), which probes
the receiver for an `isBlank` member. Reading `.isBlank` off a
`Rack::Test::UploadedFile` goes through `methodMissingProxy`'s `get` trap
(`packages/ruby-compat/src/method-missing-proxy.ts:79-95`), whose delegate
(`Tempfile`) does not answer `isBlank`, so the trap manufactures a raising
function — and `isBlank` then _calls_ it:

    NoMethodError: undefined method 'isBlank' for an instance of UploadedFile

Surfaced while converging `ParametersPermitTest`/`ParametersExpectTest`'s
`"key: permitted scalar values"` onto Rails' full thirteen-type value list
(`vendor/rails/actionpack/test/controller/parameters/parameters_expect_test.rb:205-218`)
in #PR-for-port-permitted-scalar-types-list. The `permit` half converged; the
`expect` half could not, because `expect` routes through `require`. The expect
test therefore still carries trails' narrower value list.

`PROTOCOL_PROBES` (`method-missing-proxy.ts:17-25`) is the existing mechanism
for names a JS-side probe reads-and-calls where Ruby sends nothing — but its
doc scopes it to names _JS itself_ probes, so widening it is a decision, not a
mechanical step. The alternative is for `isBlank`'s member probe not to treat a
proxy-manufactured function as a `blank?` implementation.

## Acceptance criteria

- [ ] `isBlank(new RackTestUploadedFile(path))` answers `false` rather than
      raising, matching Ruby's `Object#blank?` on a `Rack::Test::UploadedFile`.
- [ ] `ParametersExpectTest`'s `"key: permitted scalar values"` is converged onto
      Rails' value list at `parameters_expect_test.rb:205-218`, including both
      `UploadedFile` classes, and passes.
- [ ] Whichever of the two shapes is chosen is justified at the call site
      against the Ruby, not in the PR body.
