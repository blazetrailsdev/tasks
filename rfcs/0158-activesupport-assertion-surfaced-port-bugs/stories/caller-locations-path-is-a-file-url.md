---
title: "callerLocations Location#path is a file:// URL, not a filesystem path"
status: draft
updated: 2026-10-14
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `Thread::Backtrace::Location#path` is a filesystem path. trails' `callerLocations` (`packages/activesupport/src/deprecation.ts:124-165`) keeps V8's `file://` URL in `path` for ESM frames. Only `absolutePath` is stripped and decoded.

As a result, `Mapping#routeSourceLocation` (`packages/actionpack/src/action-dispatch/routing/mapper.ts`, around line 894) reads `location.absolutePath ?? location.path` where Rails reads `location.path` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb:382-384`). The cleaned source location it renders also starts with `file://` when running from `dist`.

## Acceptance criteria

- `callerLocations` `path` is a decoded filesystem path for `file://` frames, matching Ruby's `Location#path`.
- `routeSourceLocation` reads `location.path` alone, as Rails does.
- Check other `absolutePath ?? path` readers (`deprecation.ts:~284`) against their Rails bodies.
