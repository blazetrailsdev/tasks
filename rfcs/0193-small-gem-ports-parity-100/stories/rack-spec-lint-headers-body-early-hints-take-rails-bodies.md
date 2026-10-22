---
title: "rack-spec-lint-headers-body-early-hints-take-rails-bodies"
status: ready
updated: 2026-10-22
rfc: "0193-small-gem-ports-parity-100"
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

Split out of `rack-spec-lint-takes-rails-bodies`, whose PR ported 24 of the 29
`vendor/rack/v3.1.14/test/spec_lint.rb` tests in `packages/rack/src/lint.test.ts`
(the `must_raise` + `must_match` arms as `rejects.toThrow(LintError)` plus a
message matcher, with Rails' `env(options)` helper over `MockRequest.envFor`)
and ran out of LOC room. Still short of Rails' assertion count:

- "notice header errors" (`spec_lint.rb:403-496`, 19 vs 7): the `Object`-with-`each`
  headers arm, `{ true => false }` key arm, the `0.upto(31)` / `A..Z` / valid-header loops.
- "notice rack.early_hints errors" (`spec_lint.rb:498-548`, 19 vs 1): the same arms
  through `env['rack.early_hints'].call(value)`.
- "responds to to_path" (`spec_lint.rb:586-595`, 2 vs 1): needs a `must_respond_to`
  port (`toRespondTo` lives in `@blazetrails/vitest-matchers`, not a rack devDep yet).
- "notice body errors" (`spec_lint.rb:597-745`, 24 vs 5): the Struct-wrapping
  stacked-lint arms, to_path non-existent, Streaming Body `call` arms.
- "notice environment errors" (`spec_lint.rb:94-121`, 80 vs 70): the five
  `rack.session` arms (`{}.freeze`, singleton `undef_method :to_hash/:clear/:delete/:fetch`)
  cannot pass while `Wrapper#check_environment` skips plain hashes
  (`packages/rack/src/lint.ts` `isPlainHash` invented arm); depends on
  `ruby-compat-respond-to-answers-hash-store-fetch-delete-clear`.
- The TS-only tests in `lint.test.ts` with no Rails name ("handles valid rack.hijack env",
  "notices when rack.hijack env entry does not respond to #call", "... does not return an IO",
  "handles valid rack.hijack response header", "allows non-hijack responses when server
  supports hijacking", "notices when the response headers has a rack.hijack callback with
  hijacking being supported", "notices rack.response_finished errors", "notices when the
  response protocol is not an array of strings", "handles body.to_path returning nil")
  still sit in `lint.test.ts` with the old `validEnv` helper.

## Acceptance criteria

- [ ] 0 assertion-count, kind and value mismatches for `spec_lint.rb`.
- [ ] TS-only extras move to `lint.trails.test.ts`, and `validEnv` leaves `lint.test.ts`.
