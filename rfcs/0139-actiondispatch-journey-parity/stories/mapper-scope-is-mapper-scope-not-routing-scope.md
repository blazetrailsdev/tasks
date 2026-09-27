---
title: "Mapper::Scope lives in trails-only routing/scope.ts; move it into mapper.ts and port Scope#each"
status: done
updated: 2026-09-27
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: ["actionpack"]
deps: ["routing-route-class-has-no-rails-counterpart"]
deps-rfc: []
est-loc: 200
priority: 8
pr: trails#8179
claim: "2026-09-27T13:00:31Z"
assignee: "route-set-formatter-built-over-self"
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Routing::Mapper::Scope` (`vendor/rails/actionpack/lib/action_dispatch/routing/mapper.rb:2290-2380`)
is ported, but in a trails-only file: `packages/actionpack/src/action-dispatch/routing/scope.ts`
(`export class Scope`, imported by `mapper.ts:16`). As a result, on origin/main 9c8fe0b6c8:

- `parity:api --package actiondispatch --missing` lists 7 `Mapper::Scope` methods as
  missing from `routing/mapper.rb`: `parent`, `scope_level`, `null?`,
  `action_name`, `new_level`, `frame`, `each`.
- `parity:api:extra` lists `routing/scope.ts — 1 novel, 17 moved [no Rails counterpart]`.
  The novel member is `[Symbol.iterator]`, which trails has where Rails has
  `Scope#each` (`mapper.rb`, `def each; node = self; until node.equal? NULL; yield node; node = node.parent; end; end`).

Rails nests `Scope` inside `Mapper` (with `NULL` and `ROOT`) in `mapper.rb`, so
the port belongs in `mapper.ts` as `Mapper.Scope`.

## Acceptance criteria

- `Scope` (with `OPTIONS`, `RESOURCE_SCOPES`, `RESOURCE_METHOD_SCOPES`, `NULL`,
  `ROOT`) lives in `routing/mapper.ts`, nested as `Mapper.Scope`, and
  `routing/scope.ts` is deleted.
- `Scope#each` is ported. `[Symbol.iterator]` may stay only as a delegate to
  `each`, if call sites need it.
- The 7 `Mapper::Scope` rows no longer appear under `routing/mapper.rb`'s missing
  list, and `parity:api:extra` no longer lists `routing/scope.ts`.
- `call-gate-instance-new-call-expects-constructor`'s `Scope#new` call rows still
  resolve. Re-read its baseline row after the move.
