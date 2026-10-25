---
title: "Converge pubsub_adapter's require onto a LoadError#path-setting awaited require"
status: done
updated: 2026-10-25
rfc: "0177-actioncable-package-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#9304
claim: "2026-10-25T13:33:13Z"
assignee: "converge-two-prepends-in-activesupport"
blocked-by: null
closed-reason: null
---

## Context

`Server::Configuration#pubsub_adapter`
(`vendor/rails/v8.0.2/actioncable/lib/action_cable/server/configuration.rb:40-67`) calls
`require path_to_adapter` and tells its two `LoadError` arms apart with
`e.path == path_to_adapter`.

trails#9235 ported that `require` as a local async closure inside
`pubsubAdapter` (`packages/actioncable/src/server/configuration.ts`). The closure:

- reads `ActionCable.SubscriptionAdapter.loadPath[path]`;
- raises `Object.assign(new LoadError(...), { path })` when the entry is missing;
- turns an `ERR_MODULE_NOT_FOUND` rejection into a `LoadError` whose `path` is the missing module's URL.

`LoadError` in ruby-compat (`packages/ruby-compat/src/load-error.ts`) has no
`path` reader, so `path` is attached ad hoc. `ConnectionAdapters.load` in
activerecord (`packages/activerecord/src/connection-adapters.ts`) open-codes the
same ERR_MODULE_NOT_FOUND classification.

## Converged shape

- ruby-compat's `LoadError` carries `path`, as Ruby's `LoadError#path` does (`vendor/ruby/v3.3.11/error.c`).
- One awaited `require` over a namespace `loadPath` (the shape CLAUDE.md § "An adapter file is loaded by an awaited step" ratifies) raises `LoadError` with `path` set: the requested path on a miss, the missing module's path on a dependency failure.
- `pubsubAdapter` calls it as `await require(pathToAdapter)` with no local closure, and its rescue reads `e.path` directly.

## Acceptance criteria

- [ ] `LoadError#path` is ported in ruby-compat.
- [ ] `pubsubAdapter` has no local `require` closure and no `Object.assign(..., { path })`.
- [ ] `configuration.trails.test.ts` still covers both LoadError messages.
