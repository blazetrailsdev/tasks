---
title: "class-paths-resolve-for-entry-less-deep-imports"
status: ready
updated: 2026-10-28
rfc: "0205-namespace-seats-are-plain-javascript"
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

Ruby's `rb_mod_name` (`vendor/ruby/v3.3.11/variable.c:122`) answers a class's full path however the class was reached. After RFC 0205's sweeps, a class whose seat became a plain assignment, or was deleted, gets its path only from its package's `class-paths.generated.ts`. That table is loaded by the package entry, and in tests by `packages/ruby-compat/test-setup/class-paths.ts`.

A plain-node caller that deep-imports a single `dist/**.js` module, without the entry, sees bare `klass.name`. trails#9376 found one such case: `ActionDispatch::ExceptionWrapper#rescue_responses` is keyed by `exception.class.name` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/exception_wrapper.rb:12-30`). `scripts/root-build-templates.test.ts` deep-imported `debug-exceptions.js` and rendered a `RoutingError` as 500. trails#9376 made that test import `dist/index.js` first, as a Rails app requires `action_dispatch`, but any other entry-less deep import is still exposed.

## Acceptance criteria

- [ ] Decide and implement how a deep-imported class reaches its table without changing load order: each defining module registering its own rows, or the table being split per module, so `rbModName` answers the Rails fqn with no entry loaded.
- [ ] A plain-node test (child `node`, built `dist`) deep-imports `action-controller/metal/exceptions.js` alone and gets `ActionController::RoutingError` from `rbModName`.
