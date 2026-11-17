---
title: "MiddlewareStack#use takes a middleware class with no cast"
status: done
updated: 2026-11-17
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: [actionpack]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#10216
claim: "2026-11-16T23:07:02Z"
assignee: "ascii-8bit-param-encoding-answers-a-js-string-not-bytes"
blocked-by: null
closed-reason: null
---

## Context

Found on trails#9425: the default middleware stack casts every `stack.use` `as never`, because the middleware classes do not type as `MiddlewareFactory`. Rails' `use` takes any class (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/stack.rb`). trails#9425 fixed `delete` / `deleteBang` with `MiddlewareClass`.

## Acceptance criteria

- `MiddlewareStack#use` accepts the framework's middleware classes with no cast.
- The default middleware stack has no `as never`.
