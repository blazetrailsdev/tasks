---
title: "Response#munge_body_object keeps a body that answers each"
status: draft
updated: 2026-10-18
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

`ActionDispatch::Response#munge_body_object`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/response.rb:485-487`) is
`body.respond_to?(:each) ? body : [body]`: an object answering `each` is kept as the
buffer and iterated lazily by `Buffer#each`/`each_chunk` (`:131-139`). The port
(`packages/actionpack/src/action-dispatch/http/response.ts`, `mungeBodyObject`) instead
tests `Symbol.iterator` and eagerly `Array.from`s the body, and wraps an object that only
answers `each` as a single chunk. `response_test.rb`'s "each isnt called if str body is
written" (`:42-60`) passes a body defining `each`; the trails port (trails#9038) had to
give it a `Symbol.iterator` instead.

## Acceptance criteria

- `mungeBodyObject` keeps any body answering `each` (`rbObjRespondTo(body, "each")`),
  and `Buffer#each`/`eachChunk` iterate it through its `each`.
- The ported test's body defines `each`, as Rails' does, and stays green.
