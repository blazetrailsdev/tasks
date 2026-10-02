---
title: "rails-file-structure-method-order manifest omits initialize_copy, so every copy hook is forced to the end of its class"
status: draft
updated: 2026-10-02
rfc: "0025-fidelity-verification-tooling"
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

`blazetrails/rails-file-structure-method-order` orders class members from
`eslint/rails-file-structure-method-order.json`
(`scripts/build-rails-file-structure-manifest.ts`). The entry for
`packages/arel/src/select-manager.ts` starts `constructor, limit, taken,
constraints, …` and has no `initializeCopy`, although
`vendor/rails/v8.0.2/activerecord/lib/arel/select_manager.rb:14-17` declares
`initialize_copy` directly after `initialize` (`:9-12`).

A member absent from the manifest is sorted last, so the autofix moved
`SelectManager#initializeCopy` to the bottom of the class in trails#8375, and
placing it in Rails order fails the rule with "`limit` should precede
`initializeCopy`". `packages/arel/src/nodes/window.ts` carries
`Window#initializeCopy` / `NamedWindow#initializeCopy` last for the same
reason (`arel/nodes/window.rb` declares them after `initialize`), as do the
other arel copy hooks ported in trails#8302.

`scripts/build-rails-privates-manifest.ts:660-670` treats
`initialize_dup` / `initialize_clone` / `initialize_copy` specially; the
method-order manifest drops them instead of mapping them to
`initializeCopy` at their Rails position.

## Acceptance criteria

- [ ] The method-order manifest lists `initializeCopy` (and
      `initializeDup` / `initializeClone`) at the position Rails declares
      `initialize_copy` / `initialize_dup` / `initialize_clone`.
- [ ] `pnpm lint --fix` moves `SelectManager#initializeCopy` to directly
      after the constructor, and every other arel copy hook to its Rails
      position, with the rule green.
