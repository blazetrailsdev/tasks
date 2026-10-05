---
title: "Rack::Headers#empty? is ported as an empty getter, not isEmpty"
status: draft
updated: 2026-10-05
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `Hash#empty?` is a predicate, and `Rack::Headers` inherits it. Rails
tests call it on response headers:
`vendor/rails/v8.0.2/actionpack/test/controller/new_base/bare_metal_test.rb:86`
(`assert_predicate controller.response.headers, :empty?`).

trails' `Headers` (`packages/rack/src/headers.ts:64-66`) spells it as a
value-typed getter, `get empty(): boolean`. CLAUDE.md's predicate rule is that
`foo?` is answered by `isFoo`, never by a `foo` getter. The parked port of that
test in
`packages/actionpack/src/action-controller/controller/new-base/bare-metal.test.ts`
(trails#8513) reads `(h) => h.empty` because no `isEmpty` exists.

## Acceptance criteria

- `Headers` answers `empty?` as `isEmpty()`; the `empty` getter is removed and
  its callers moved.
- `new-base/bare-metal.test.ts` reads `h.isEmpty()`.
- `pnpm parity:api:predicates` does not rise.
