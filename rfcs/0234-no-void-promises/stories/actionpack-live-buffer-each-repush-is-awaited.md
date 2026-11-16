---
title: "Live::Buffer#each's ThreadError re-push stops dropping its promise"
status: ready
updated: 2026-11-16
rfc: "0234-no-void-promises"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
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
