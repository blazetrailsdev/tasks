---
title: "_adapter fast path bypasses the permanent-checkout gate, narrowing the ban vs Rails"
status: draft
updated: 2026-07-26
rfc: "0073-permanent-connection-checkout-disallowed"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' suite-wide ban (`test/cases/helper.rb:27`,
`permanent_connection_checkout = :disallowed`) covers every model, because in
Rails every model resolves through a pool. trails' ban does not, and the gap is
a single line.

`packages/activerecord/src/connection-handling.ts` `connection()` short-circuits
on a directly-assigned adapter **above** the flag check:

```ts
if ((this as any)._adapter) return (this as any)._adapter;
// ... only then: if (pool.isPermanentLease()) { gate }
```

So any model backed by `Model.adapter = x` never reaches the gate at all — the
deprecation warning and the `disallowed` raise are both unreachable for it.
There are 116 `.adapter =` assignments across 32 test files, so the blind spot
is not marginal.

Consequence: when `arm-permanent-connection-checkout-disallowed` lands, a green
suite will **not** mean what a green Rails suite means. The measured residual
that story works from is a floor, not a ceiling — call sites hidden behind the
fast path are simply invisible to the instrumentation used to enumerate them
(method recorded in the RFC 0073 README).

Found while auditing the ban (PR #5318 / #5349).

## Distinct from `retire-direct-adapter-with-connection-shim`

That story tracks `withPooledOrDirectConnection` collapsing back into
`withConnection` once direct-adapter models go away. This one is about the
_enforcement gate's_ coverage, which is a different symptom of the same root
cause (`Model.adapter = x` is a trails invention with no Rails counterpart).
Retiring direct-adapter models would close both; until then this hole is
undocumented in code and unmeasured.

## Acceptance criteria

- Quantify the blind spot: how many call sites currently reach `connection()`
  via the `_adapter` fast path, using the same gate instrumentation the RFC 0073
  README documents (extended to count the fast-path arm).
- Either move the flag check above the `_adapter` short-circuit so direct-adapter
  models are covered too, or record — in a comment at that line, not only in an
  RFC — that trails' ban is deliberately narrower than Rails' and why.
- If the check moves, expect fallout in the 32 `.adapter =` test files; size it
  before committing to the change and split if it exceeds the LOC ceiling.
