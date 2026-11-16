---
title: "rbObjRespondTo walks the method chain on every call"
status: ready
updated: 2026-11-16
rfc: "0241-request-path-performance"
cluster: request-perf
packages: [ruby-compat]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rbObjRespondTo` (`packages/ruby-compat/lib/object.ts:1649`), via
`basicObjRespondTo` (`:768`) and `chainEntry` (`:877`), resolves a method name
by walking the object's prototype chain and its `respond_to_missing?`, on every
call. The request path asks the same questions over and over: Rack's
`BodyProxy` asks about its body, `Response` about `RackBody`, rendering about
its options, `sanitize_for_mass_assignment` on `where`, Arel's `unboundable?`,
and the log subscriber about its `logger`.

Under the twelve-dollar load this is **3.5% of busy CPU** (1.2%
`basicObjRespondTo`, 1.0% `chainEntry`, 0.4% `rbObjRespondTo`, and their
`isPlainHash` and `temporalTag` checks).

## Acceptance criteria

- [ ] Cache the method-resolution part of `respond_to?` per prototype and name,
      and invalidate it on the same events that already invalidate method caches
      (`include`, `prepend`, `define_method`, `remove_method`, `undef_method`).
- [ ] `respond_to_missing?` is still consulted on every call, as Ruby does.
- [ ] The ruby-compat respond_to tests stay green, and a new test covers a method
      defined after the first query.
- [ ] The respond_to family falls below 1.5% of busy CPU.

## Verification

Run the slim profile harness from the RFC README's Verification section on
trails main before and after the change. Record CPU per request, p95, p99 and
this story's measured share in the PR body.
