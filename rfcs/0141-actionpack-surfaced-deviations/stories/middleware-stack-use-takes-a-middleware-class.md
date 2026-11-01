---
title: "MiddlewareStack#use takes a middleware class with no cast"
status: draft
updated: 2026-11-01
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
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

Found on trails#9425: the default middleware stack casts every `stack.use` `as never`, because the middleware classes do not type as `MiddlewareFactory`. Rails' `use` takes any class (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/stack.rb`). trails#9425 fixed `delete` / `deleteBang` with `MiddlewareClass`.

## Acceptance criteria

- `MiddlewareStack#use` accepts the framework's middleware classes with no cast.
- The default middleware stack has no `as never`.
