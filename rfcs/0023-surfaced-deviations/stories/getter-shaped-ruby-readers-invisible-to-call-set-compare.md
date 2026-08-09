---
title: "Getter-shaped Ruby readers are invisible to the api-compare call-set"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Not Rails-convergent: the ported bodies are already faithful (isEtag inlines the getter body byte-for-byte, cache.rb:129); only scripts/api-compare's call-set extractor cannot see a property access as a call. This is a measurement-policy decision about the parity tooling, not a port divergence."
---

## Context

`scripts/api-compare/call-mismatches-wide-exclude/actiondispatch/http/cache.json`
carries an `etag? -> etag` entry that PR #5637 could not converge. Rails'
`etag?` is `def etag?; etag; end`
(`vendor/rails/actionpack/lib/action_dispatch/http/cache.rb:129`) and the `etag`
reader it calls is a `Rack::Response::Helpers` method. In trails that reader is a
**class getter** on both `packages/actionpack/src/action-dispatch/http/cache.ts`
(`get etag()`) and `packages/rack/src/response.ts:269`, so `isEtag`'s body reads
`this.getHeader(ETAG)` directly — byte-for-byte the getter's body, but with no
call expression for the call-set extractor to see.

This is a general shape problem, not an ETag one: every Ruby `attr_reader`-style
method we port as a TS getter is invisible to
`scripts/api-compare/compare.ts`'s call-set comparison, so any Rails method that
_calls_ such a reader reads as omitting the call and needs a baseline entry.
`weak_etag? -> etag` in the same file is a second instance.

## Acceptance criteria

- Decide the policy: either teach the TS extractor to count a property access on
  a known getter as a call to that getter, or accept getter-shaped readers as a
  permanent equivalent-path class and document it in
  `scripts/api-compare/conventions.ts` so reviewers stop re-litigating it.
- If the extractor changes, `etag? -> etag` and `weak_etag? -> etag` come out of
  the `actiondispatch/http/cache.json` baseline, and
  `pnpm exec tsx scripts/api-compare/lint-call-mismatches-wide.ts` stays clean
  (expect newly-STALE entries elsewhere — the shape is common).
- No test name is added, removed or reworded.
