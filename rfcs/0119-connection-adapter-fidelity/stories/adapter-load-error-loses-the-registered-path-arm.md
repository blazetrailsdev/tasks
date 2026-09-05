---
title: "adapter-load-error-loses-the-registered-path-arm"
status: ready
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
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

Rails' `ConnectionAdapters.resolve` rescues the adapter `require`'s `LoadError`
into TWO distinct messages
(`vendor/rails/activerecord/lib/active_record/connection_adapters.rb:44-51`):

- `error.path == path_to_adapter` — the adapter gem registered a path that does
  not exist: "Error loading the '<name>' Active Record adapter. Ensure that the
  path registered by the adapter gem is correct. <message>"
- otherwise — the failure bubbled up from inside the adapter: "Error loading the
  '<name>' Active Record adapter. Missing a gem it depends on? <message>"

PR #7382 (`validate-bang-defers-adapter-load-failure`) ported only the second,
in `packages/activerecord/src/connection-adapters.ts`'s `resolve`, because an
ESM loader rejection carries no `error.path` to compare against a registered
path the way Ruby's `LoadError#path` does.

So a `register("x", () => import("./typo.js"))` — the registered-path-is-wrong
case, the one a trails adapter package would actually hit — reports "Missing a
package it depends on?", pointing the reader at the adapter's dependencies
rather than at the loader they wrote.

## Converged shape

Distinguish the two arms the way the runtime allows: a `ERR_MODULE_NOT_FOUND`
whose specifier IS the module the loader named is the registered-path arm and
takes Rails' first message ("Ensure that the path registered by the adapter
package is correct."); anything else keeps the second. The specifier is
recoverable from the rejection (`err.url` / the message's quoted specifier) —
confirm which, rather than assuming.

## Acceptance criteria

- [ ] A loader whose own import specifier does not resolve reports the
      registered-path message.
- [ ] A loader whose adapter module fails on one of ITS imports keeps the
      "Missing a package it depends on?" message.
- [ ] Both arms pinned by tests in
      `packages/activerecord/src/database-configurations/hash-config.trails.test.ts`
      (or the connection-adapters test beside `resolve`).
