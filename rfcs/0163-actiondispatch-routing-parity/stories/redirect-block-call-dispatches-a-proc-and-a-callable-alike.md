---
title: "redirect-block-call-dispatches-a-proc-and-a-callable-alike"
status: ready
updated: 2026-10-14
rfc: "0163-actiondispatch-routing-parity"
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

`Redirect#path` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/redirection.rb:63-65`)
is `block.call params, request`, which serves a Proc and an object that
responds to `call` alike. `redirect` (`:204-215`) takes `block = path if
path.respond_to? :call`. In JS a function's own `call` is
`Function.prototype.call`, whose first argument is `this`, so
`packages/actionpack/src/action-dispatch/routing/redirection.ts` `Redirect#path`
branches on `typeof this.block === "function"` and carries
`@inventedArm if — CONVERGEABLE` naming this story.

## Acceptance criteria

- [ ] `Redirect#path` invokes its block through one call shape (a shared
      ruby-compat Proc-call helper, or a ratified rule), and the
      `@inventedArm` receipt is removed.
