---
title: "ContentSecurityPolicy and PermissionsPolicy initialize_copy walk Map entries where Rails calls deep_dup"
status: draft
updated: 2026-10-10
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::ContentSecurityPolicy#initialize_copy`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/content_security_policy.rb:185-187`)
is `@directives = other.directives.deep_dup`. The port, added in trails#8758
(`packages/actionpack/src/action-dispatch/http/content-security-policy.ts`,
`initializeCopy`, directly after the constructor), walks the entries by hand:
`new Map(Array.from(other.directives.entries()).map(([k, v]) => [k, v === true ? true : [...v]]))`.
`PermissionsPolicy#initializeCopy`
(`packages/actionpack/src/action-dispatch/http/permissions-policy.ts:138-141`;
Rails `action_dispatch/http/permissions_policy.rb`, `initialize_copy`) has the
same hand-written copy.

Both do it because `directives` is a native `Map` and `deepDup`
(`packages/activesupport/src/hash-utils.ts:71`) has arms for `Array`,
ruby-compat `Hash` and plain objects only, so a `Map` is returned as is.

## Acceptance criteria

- Both `initializeCopy` bodies are `this.directives = deepDup(other.directives)`,
  either because `directives` is stored as a type `deepDup` already copies or
  because the storage decision is made once for both classes.
- `pnpm parity:api:calls` shows `deep_dup` credited for both methods, with no
  baseline row.
- The `dup` tests in `action-dispatch/dispatch/content-security-policy.test.ts`
  and the permissions-policy tests still pass.
