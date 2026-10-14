---
title: "PathRedirect holds its template String as @block"
status: ready
updated: 2026-10-14
rfc: "0163-actiondispatch-routing-parity"
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

`PathRedirect` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/redirection.rb:88-110`)
inherits `Redirect#initialize(status, block)` and is built as
`PathRedirect.new(status, path)` (`:210`), so `@block` is the path String.
`#path` runs `block.match(URL_PARTS)` on it, and `inspect` interpolates it.
trails' `PathRedirect` (`packages/actionpack/src/action-dispatch/routing/redirection.ts`)
passes `super(status, () => pathTemplate)`, and its `template` getter calls the
closure to get the string back. Both the closure and the `template` getter are
things Rails does not have.

## Acceptance criteria

- [ ] `PathRedirect` stores the template string as `block`, as Rails does, and
      `path` / `inspect` read `this.block` directly.
- [ ] The `template` getter is removed.
