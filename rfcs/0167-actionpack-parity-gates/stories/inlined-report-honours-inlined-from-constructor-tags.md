---
title: "inlined-report-honours-inlined-from-constructor-tags"
status: draft
updated: 2026-10-14
rfc: "0167-actionpack-parity-gates"
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

# Inlined-module-bodies report ignores a constructor's `@inlinedFrom` tag

## Context

`pnpm parity:api:extra --package actiondispatch` still lists
`actiondispatch/http/request.ts constructor inlined-from http/filter_parameters.rb (initialize)`
after `request-mixin-bodies-onto-their-rails-files` moved every other Request
mixin body. The constructor at `packages/actionpack/src/action-dispatch/http/request.ts`
carries `@inlinedFrom ActionDispatch::Http::FilterParameters#initialize`, which
CLAUDE.md § "A module's `initialize` is inlined into the constructor" makes the
sanctioned shape, and `pnpm parity:api:inlined` is green on it.

`inlinedModuleMembers` (`scripts/api-compare/extra-surface.ts:2153`) skips a
module's `initialize` only when the module file has a `[initialize]` hook
(line 2184); it never reads the constructor's `@inlinedFrom` tags. Rails:
`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/filter_parameters.rb:24-30`.

## Acceptance criteria

- `inlinedModuleMembers` drops an `initialize` finding when the host's
  constructor carries a matching `@inlinedFrom` tag.
- The actiondispatch report no longer lists `request.ts constructor`.
