---
title: "Live::Buffer#each's ThreadError re-push stops dropping its promise"
status: done
updated: 2026-11-16
rfc: "0234-no-void-promises"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#10214
claim: "2026-11-16T22:06:41Z"
assignee: "action-text-content-built-with-awaited-static-new"
blocked-by: null
closed-reason: null
---

## Context

`packages/actionpack/lib/action-controller/metal/live.ts:109`, `Live::Buffer#each`'s
`ThreadError` rescue arm, re-pushes the popped chunks with
`for (const str of popped) void this._buf.push(str);`, which is still a
`@typescript-eslint/no-floating-promises` finding (actionpack mark 48).
trails#10118 converged `Buffer#close`'s push (`live.rb:208-214`) and left this one,
which that story did not list.

Rails: `vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/live.rb`,
`Buffer#each`'s rescue (`popped.each { |str| @buf.push(str) }`), where the push
blocks the thread on a sized queue. `Queue#push` never rejects
(`ruby-compat/lib/queue.ts`, MRI `rb_szqueue_push`).

## Acceptance criteria

- [ ] The re-push is awaited or the promise returned (sync `each` may need its
      rescue arm to hand the pushes back), not voided.
- [ ] actionpack's `no-floating-promises` mark drops by 1 via `pnpm parity:promises:tighten`.

## Findings from trails#10199

- `vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/live.rb` has no
  `Buffer#each` and no `popped` re-push: the trails `each` is
  `@noRailsEquivalent`. The citation above is wrong.
- The re-push cannot be made synchronous. On a `SizedQueue`, `each` can pop more
  chunks than `max` (held writers refill it as it pops), so the re-push has to
  block. `live.test.ts` "a sync read of a live buffer raises rather than blocking
  before close" pins the synchronous `ThreadError`. The fix decides whether a
  sync `each` stops popping destructively, or whether the arm goes away along
  with the invented `each`.
