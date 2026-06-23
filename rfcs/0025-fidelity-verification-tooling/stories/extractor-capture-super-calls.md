---
title: "Capture super calls in both extractors for call-set parity"
status: ready
updated: 2026-06-23
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The advisory call-set parity dimension (`scripts/api-compare/compare.ts`,
`SIGNIFICANT_CALLS`, PR #4002) cannot see `super` omissions by construction: a
ported method that forgets to chain to its parent is invisible. Two reasons:

- `extract-ruby-api.rb` `walk_for_calls` only records `:fcall`/`:vcall`/
  `:call`/`:command`/`:command_call` nodes by ident name, and filters names
  starting with `_` or not matching `/\A[a-z]/` — `super`/`zsuper` are never
  recorded.
- `extract-ts-api.ts` `extractCalls` records `CallExpression` callees that are
  `Identifier`/`PropertyAccessExpression` only — a `super.foo()` records `foo`,
  but a bare `super(...)` (SuperKeyword callee) is dropped.

`super`-chaining omission is high-signal fidelity (e.g. a ported lifecycle
override that skips `super`), so capturing it would meaningfully extend the
calls-parity dimension. Noted twice in PR #4002 review as a known limitation.

## Acceptance criteria

- `extract-ruby-api.rb` records `super`/`zsuper` as a `"super"` entry in a
  method's `calls`.
- `extract-ts-api.ts` `extractCalls` records a `super(...)` call (SuperKeyword
  callee) as `"super"`.
- Add `"super"` to `SIGNIFICANT_CALLS` (or document why not) and confirm it
  produces real signal on activerecord without flooding noise.
- Tests on both extractors for the new capture.
