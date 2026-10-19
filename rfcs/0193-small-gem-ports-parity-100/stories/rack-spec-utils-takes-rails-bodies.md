---
title: "rack-spec-utils-takes-rails-bodies"
status: draft
updated: 2026-10-19
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

Split out of `rack-spec-headers-response-utils-lint-take-rails-bodies`, whose PR
landed `spec_headers.rb` and `spec_response.rb` and ran out of LOC room.

`pnpm parity:test --package rack --assertions --missing` reports count/kind/value
mismatches for `vendor/rack/v3.1.14/test/spec_utils.rb` against
`packages/rack/src/utils.test.ts`: "parse nested query strings correctly"
(spec_utils.rb:142-243, 44 vs 28), "build nested query strings correctly"
(:301, uses the `assert_nested_query` helper at :27), "only moves to a new array
when the full key has been seen" (:247), "handles unexpected use of [ and ]"
(:259), "allow setting the params hash class" (:273), RFC 7239 Forwarded (:414),
"select best quality match" (:453), "escape html entities" (:473), encodings
(:494), obsolete symbols (:536), invalid symbol (:556), clean directory traversal
(:567), cookies (:588-700), "run different apps" (:778).

The parse_nested_query expectations can be generated mechanically: eval each
`must_equal` hash literal in Ruby and `JSON.generate` it into a `toEqual`. Each
`must_raise(...).message.must_equal` is two assertions (raises + equal/match).

## Acceptance criteria

- [ ] 0 assertion-count, kind and value mismatches for `spec_utils.rb`.
- [ ] TS-only extras move to `utils.trails.test.ts`.
