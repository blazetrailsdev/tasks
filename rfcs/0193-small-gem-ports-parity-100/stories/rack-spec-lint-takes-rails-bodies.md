---
title: "rack-spec-lint-takes-rails-bodies"
status: blocked
updated: 2026-10-19
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: []
deps:
  - rack-port-lint-wrapper-checks
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-10-19T22:37:49Z"
assignee: "rack-spec-lint-takes-rails-bodies"
blocked-by: "waiting on rack-port-lint-wrapper-checks: packages/rack/src/lint.ts is a 253-line invention without Rack::Lint::Wrapper (lint.rb:44+), so none of spec_lint.rb's must_match/must_equal messages (e.g. 'No env given', 'env should not be frozen, but is', session/logger checks, InputWrapper/ErrorWrapper) can pass; porting lint.rb plus ~990 lines of spec exceeds 800 LOC"
closed-reason: null
---

## Context

Split out of `rack-spec-headers-response-utils-lint-take-rails-bodies`, whose PR
landed `spec_headers.rb` and `spec_response.rb` and ran out of LOC room.

`vendor/rack/v3.1.14/test/spec_lint.rb` against `packages/rack/src/lint.test.ts`:
24 tests where nearly every port has 1 assertion and Rails has many — "notice
environment errors" 80 vs 1, "notice body errors" 24 vs 1, "notice input
handling errors" 22 vs 1, "notice header errors" 19 vs 7, "notice rack.early_hints
errors" 19 vs 1, the request-target form tests 3-7 vs 1. Each Rails arm is a
`lambda { ... }.must_raise(Rack::Lint::LintError).message.must_match(/.../)`
pair, so a faithful port is two assertions per arm. Probably ~1000 LOC on its own:
split per test group if needed.

## Acceptance criteria

- [ ] 0 assertion-count, kind and value mismatches for `spec_lint.rb`.
- [ ] TS-only extras move to `lint.trails.test.ts`.
