---
title: "Constraints CALL dispatches app.call via rbFSend"
status: draft
updated: 2026-10-14
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/actionpack/src/action-dispatch/routing/mapper.ts:337` `Constraints.CALL` is `callableOf(app).call(app, req.env)`. `callableOf` (`:406-411`) is an invented helper that picks the function or its `.call` member. Rails `Constraints::CALL` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb`) is `->(app, req) { app.call req.env }`. ruby-compat's `rbFSend(app, "call", req.env)` dispatches `Proc#call` for a lambda and the object's `call` otherwise (`packages/ruby-compat/src/object.ts:1000`), which is the shape trails#8913 used for every `@app.call(env)`.

## Acceptance criteria

- [ ] `Constraints.CALL` is `rbFSend(app, "call", req.env)`.
- [ ] `callableOf` is deleted if nothing else uses it.
