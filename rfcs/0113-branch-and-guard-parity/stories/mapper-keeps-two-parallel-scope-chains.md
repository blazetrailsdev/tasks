---
title: "Mapper keeps scopeStack beside _scope where Rails has one @scope chain"
status: ready
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 320
priority: 54
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `Mapper` carries exactly ONE scope chain: `@scope`, a `Mapper::Scope`
linked list (`vendor/rails/actionpack/lib/action_dispatch/routing/mapper.rb:668-750`).
Every scoping method pushes a frame onto it — `path_scope`
(`mapper.rb:1955-1959`), `scope` (`mapper.rb:857-897`), `shallow_scope`
(`mapper.rb:1877-1881`) — and the URL segment is read back out of it with
`@scope[:path]`.

`packages/actionpack/src/action-dispatch/routing/mapper.ts` carries TWO:

- `this._scope`, a real `Scope` linked list — the Rails-shaped one; and
- `this.scopeStack`, an array of `{ path, namePrefix, controller, resource,
memberPath, shallow, ... }` frames, which is what actually produces the URL
  (`currentPrefix()` reads only `scopeStack[last].path`).

`resources`, `resource`, `collection`, `member` and `new` push `scopeStack`
frames; `pathScope`, `resourceScope`, `shallowScope`, `withScopeLevel` and
`controller`/`defaults` push `_scope` children. The two are not derived from
each other.

PR #7389 (`mapper-namespace-drops-rails-defaults-and-scope-merge`) had to
paper over this to route `namespace` through Rails' `path_scope` + `scope`
composition: `pathScope` now pushes to BOTH chains to keep them in step, and
`scope` pushes a `_scope` child alongside its `scopeStack` frame. That is
correct for `namespace` today but it is a second store being maintained by
hand, and it is the reason `resources` still needs the two trails-only helpers
`outerNonResourcePrefix()` and `outerNonResourceNamePrefix()` as a fallback
where Rails simply reads `@scope[:shallow_path]` / `@scope[:shallow_prefix]`
(`mapper.rb:964-968` derives them; `mapper.rb:1877-1881` consumes them).

## Converged shape

`_scope` is the only chain. `currentPrefix()` becomes `@scope[:path]`,
`scopeStack` is deleted, the resource-level frames become `Scope` children with
Rails' keys (`scope_level_resource`, `shallow`, …) as
`resource_scope`/`nested`/`shallow_scope` already model them, and
`outerNonResourcePrefix` / `outerNonResourceNamePrefix` are deleted in favour of
`@scope[:shallow_path]` / `@scope[:shallow_prefix]`.

## Acceptance criteria

- [ ] `scopeStack` is gone; `Mapper` keeps one scope chain, `_scope`.
- [ ] `outerNonResourcePrefix` and `outerNonResourceNamePrefix` are deleted;
      shallow paths and prefixes come from `@scope[:shallow_path]` /
      `@scope[:shallow_prefix]` per `mapper.rb:1877-1881`.
- [ ] `pathScope` pushes one frame, not two.
- [ ] `packages/actionpack/src/action-dispatch/routing/` and
      `dispatch/routing.test.ts` stay green, including the five
      `namespaced shallow routes with …` tests enabled by #7389.
- [ ] `pnpm parity:api:extra --package actiondispatch` shows no new surface and
      the two deleted helpers gone.
