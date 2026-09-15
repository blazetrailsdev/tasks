---
title: "Rack::Deflater sync generic-body path chains flushes instead of awaiting per yield"
status: draft
updated: 2026-09-15
rfc: "0123-blocked-convergence-holding"
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

`Rack::Deflater::GzipStream#each` (`vendor/rack/lib/rack/deflater.rb:110-116`) writes each
yielded part and, under `sync`, flushes it inside `@body.each`. In trails
(`packages/rack/src/deflater.ts`, generic-body branch) `GzipWriter#flush` is async (#7811), and
a synchronous `body.each` callback cannot await, so the `sync` path chains every part onto a
promise and drains the chain after `each` returns — every yielded part is retained until then.
The non-sync path writes directly.

## Converged shape

Await each flush per yield: iterate the body through an async producer (or an awaited
`each` that honors a returned promise) so part N+1 is not pulled until part N's flush settles.

## Acceptance criteria

- [ ] The `sync` generic-body path no longer collects the enumerable into a promise chain.
- [ ] `deflater.test.ts` "flush gzipped chunks to the client as they become ready" still passes.
