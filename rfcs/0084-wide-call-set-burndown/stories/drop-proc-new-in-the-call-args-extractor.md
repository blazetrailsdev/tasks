---
title: "Drop Proc.new sites in the call-argument extractor too"
status: done
updated: 2026-08-11
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6379
claim: "2026-08-11T21:26:07Z"
assignee: "burndown-order-only-rows-associations-remainder"
blocked-by: null
closed-reason: null
---

## Context

PR #6374 taught the Ruby extractor to drop `new` at a `Proc` receiver:
`Proc.new { ... }` ports to an arrow function, which names no callee, so the
`new` could never be satisfied by any TS body. The rule lives in
`walk_for_calls` (`scripts/api-compare/extract-ruby-api.rb:2305-2334`) via
`proc_new_receiver?` (`:2295-2301`), applied per-site on the receiver shape
`[:var_ref, [:@const, "Proc"]]`.

**The argument-side extractor was left untouched.** `walk_for_call_args` /
`record_call_site` (`extract-ruby-api.rb:2350-2385`) still record the
`Proc.new` site, so `parity:api:calls:args` (RFC 0095) can flag argument
mismatches on a call site the call-set gate has agreed can never be satisfied.
The two extractors now disagree about whether a `Proc.new` site exists.

Scoped out of #6374 deliberately: that story specified `walk_for_calls`, and
touching the args extractor moves a second baseline
(`call-mismatches-exclude/**` rows with `kind: "args"`), which wanted its own
measured change rather than a drive-by.

The vendored survey from #6374 still applies: `Proc.new` occurs 50 times
outside tests; `proc.new` / `lambda.new` occur zero times, so only the `Proc`
constant needs matching.

## Acceptance criteria

- `record_call_site` drops the site when the callee is `new` and the receiver
  is the `Proc` constant, reusing `proc_new_receiver?` — per-site, so a
  `Foo.new` site in the same body is still recorded.
- Unit test in `extract-ruby-api.test.ts` covering both halves, mirroring the
  call-set tests added in #6374.
- Any `kind: "args"` baseline rows that go STALE are DELETED by hand
  (only-shrink; `pnpm parity:api:calls:reseed` for the mark shards only).
- `pnpm parity:api:calls` and `pnpm parity:api:calls:args` both green.
