---
title: "Profile and cut ruby-compat method-dispatch overhead on the request path"
status: ready
updated: 2026-11-14
rfc: "0241-request-path-performance"
cluster: request-perf
packages: [ruby-compat]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

In a `--cpu-prof` of the twelve-dollar server under 5,000 users, ruby-compat
is **13% of self time**, the second-largest package after activerecord
(16.8%). The top frames are `rbCallSuper` (`include.ts`, 1.8% self, 17%
inclusive), `basicObjRespondTo` (0.9%), `chainEntry` (0.8%), `sendInternal`
(0.6%, 11% inclusive), `fetch` in `hash.ts`, `isPlainHash`, and the
class-attribute getters (`class-attribute.ts` `get` and `methods.get`).
`rbCallSuper` alone carries the middleware and callback chain. Every lowering
of Ruby `super` and `send` pays a method lookup that V8 cannot inline.

These numbers were taken on main `094dec8aa8`, before trails#10062 (`perf(activerecord): inline init_internals on Base and make rbCallSuper cheaper`). #10062 inlines the eight-hop `initInternals` chain into `Base` and caches each method's super slot on the function. That removes some of the `rbCallSuper` cost and the `initInternals` allocations (about 1.3% of bytes) measured here.

## Acceptance criteria

- First, re-profile on a main that includes #10062, and restate the remaining shares before cutting anything.

- A per-call-site breakdown of the `rbCallSuper` and `sendInternal` callers on
  the request path, listing which of them could resolve once (for example,
  cached against `methodCacheSerial`, as `_includesAttributes` does since
  trails#9910).
- At least the top two callers are cached or lowered, with tests.
- The before and after CPU per request is recorded at 5,000 users.
