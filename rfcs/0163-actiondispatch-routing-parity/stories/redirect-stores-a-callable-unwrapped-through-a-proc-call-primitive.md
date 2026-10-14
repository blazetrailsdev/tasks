---
title: "redirect stores a callable unwrapped through a ruby-compat Proc-call primitive"
status: claimed
updated: 2026-10-14
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 2
pr: null
claim: "2026-10-14T17:46:22Z"
assignee: "port-actionview-polymorphic-routes-test-part-1"
blocked-by: null
closed-reason: null
---

## Context

`Redirection#redirect` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/redirection.rb:204-215`)
takes `block = path if path.respond_to? :call`. After trails#8906,
`packages/actionpack/src/action-dispatch/routing/redirection.ts` `redirect`
spells that test inline, twice: `typeof x === "function" &&
x.call === Function.prototype.call && !/^class\b/.test(Function.prototype.toString.call(x))`
for a proc, and `x.call !== Function.prototype.call` for an object answering
`call`. A callable object is then wrapped in a closure at definition time, so
`Redirect#path` makes one call (`redirection.rb:63-65`, `block.call params, request`).

The wrapper closure, the source-text regex and the duplicated predicate are
not Rails shapes.

## Acceptance criteria

- [ ] One ruby-compat Proc-call primitive (Ruby `respond_to?(:call)` plus
      `Proc#call` dispatch) is used by `redirect` and `Redirect#path`, so the
      callable object is stored as `block` unwrapped, as Rails stores it.
- [ ] The inline `/^class\b/` source-text test and the definition-time
      closure are removed.
