---
title: "rack-spec-headers-takes-rails-bodies"
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

Split out of `rack-spec-headers-response-utils-lint-take-rails-bodies` for LOC:
the faithful `spec_headers.rb` port alone is ~590 LOC. The finished work is on
branch `wip/rack-spec-headers-takes-rails-bodies` (commit deb946ae08). Take
`packages/rack/src/headers.test.ts` and `packages/ruby-compat/src/hash.ts` from
it onto a fresh branch from main. It brought `spec_headers.rb` to 0 count/kind/value
mismatches locally:

- `headers.test.ts` rewritten test-for-test against
  `vendor/rack/v3.1.14/test/spec_headers.rb`. `@fh` is built positionally
  (`Headers.get("AB","1","cd","2","3","4")`), because a JS object literal puts
  the integer-like key `"3"` first and breaks Ruby's insertion order.
- ruby-compat `fetch` gets `rb_check_arity(argc, 1, 2)`
  (`vendor/ruby/v3.3.11/hash.c:2182`), and `Hash`'s constructor raises
  `rb_hash_initialize`'s ArgumentError for a default plus a block
  (`hash.c:1786-1787`).
- "public interface" (`spec_headers.rb:15-20`) is parked behind
  `ruby-compat-hash-answers-rack-headers-public-interface`.

## Acceptance criteria

- [ ] 0 assertion-count, kind and value mismatches for `spec_headers.rb`.
- [ ] `pnpm parity:test:assertions` stays green.
