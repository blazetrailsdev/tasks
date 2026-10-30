---
title: "framework-constantize-calls-become-imports-or-registries"
status: blocked
updated: 2026-10-30
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
blocked-by: "Needs its acceptance criteria rewritten for RFC 0213; waits on constantize-restored-over-namespaces."
closed-reason: null
---

## Context

**Direction change (repo owner, 2026-10-28, trails#9424):** lookup is an ES import or an explicit `registerX` registry, never `constantize` / `const_get`, even where Rails calls it; class-path tables answer class → Ruby name only. The text below is rescoped to that.

Repo-owner ruling, 2026-10-28, on closed trails#9397: trails does not resolve classes through a ported `const_get` constant walk. A Rails `constantize` / `const_get` call becomes a plain ES import where the name is known when the call is written. Where the name is computed, it becomes a read of an explicit registry, as CLAUDE.md § "A dispatch by name is spelled directly" rules for a computed `send`. `constantize-open-codes-rb-mod-const-get` was closed FALSIFIED on this ruling.

`constant-lookup-helpers-keep-only-rails-const-get-sites` covers the ruby-compat lookup helpers (`rbModConstGet`, `rbConstGet`, `rbPathToClass`, ...). This story covers framework calls to ActiveSupport's `constantize` / `safeConstantize` (`packages/activesupport/src/inflector.ts`), outside tests:

- actionpack: `action-dispatch/http/request.ts` (`controller_class_for`, `request.rb:94-110`), `action-dispatch/middleware/session/abstract-store.ts`
- actionview: `helpers/form-helper.ts`
- activejob: `core.ts`, `serializers/module-serializer.ts`
- activemodel: `validations/validates.ts`
- activerecord: `aggregations.ts`, `connection-adapters.ts`, `core.ts`, `delegated-type.ts`, `inheritance.ts`, `migration.ts`, `reflection.ts`, `associations/collection-proxy.ts`
- activesupport: `delegation.ts`, `module-ext.ts`, `deprecation/constant-accessor.ts`, `deprecation/proxy-wrappers.ts`, `message-pack/extensions.ts`
- chronic: `handler.ts`, `repeater.ts`
- globalid: `global-id.ts`

## Acceptance criteria

- [ ] Each call site is classified with its Rails `file:line`. A site whose name is known where it is written becomes an import. A site whose name ranges over a closed framework set (adapters, chronic handlers and repeaters, deprecation targets) reads a module-private map beside it. A site whose name comes from the application (association `class_name:`, STI `type`, polymorphic `_type`, a controller name, GlobalID, a serialized job class) reads its domain's `registerX` registry (`register-x-registries-gain-a-read-side`).
- [ ] A Rails `constantize` at the site is not a reason to keep one. No converted site calls `constantize`, `safeConstantize`, a class-path table, `RCLASS_CONST_TBL` or a `const_get` walk.
- [ ] Once every application-class site reads its registry, `registerModel`, `registerJob`, `registerChannel` and `registerConnection` stop writing through `registerConstant` (moved from `register-x-registries-gain-a-read-side`).
- [ ] actionpack gains `registeredController` beside `registerController`, over its own map, read by the routing controller lookup in the same PR.
- [ ] Touched test files pass, and each touched package's built `dist/**.js` loads as a plain-node ESM entry module.
