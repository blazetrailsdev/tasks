---
title: "Resolve a bare constant in the API extractor lexically, not by first match"
status: draft
updated: 2026-09-27
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`PermissionsPolicy` defines `DIRECTIVES = { accelerometer: …, camera: …, … }`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/permissions_policy.rb:84`)
and then `DIRECTIVES.each { |name, directive| define_method(name) … }` (`:122`).
`ContentSecurityPolicy` has its own `DIRECTIVES = { base_uri: …, child_src: …, … }`
(`http/content_security_policy.rb:149`).

`resolve_const_members` (`scripts/api-compare/extract-ruby-api.rb:2565-2581`)
resolves a bare name (empty container) to the first stored FQN that holds a
constant of that name, regardless of the lexical scope it is read from. So
`pnpm parity:api --package actiondispatch` expands `permissions_policy.rb`'s
loop with the CSP keys, and reports `http/permissions_policy.rb` 13/35 with 22
"missing" methods (`base_uri` … `worker_src`) that do not exist on
`PermissionsPolicy`. trails ports the real directives
(`packages/actionpack/src/action-dispatch/http/permissions-policy.ts:61-71`).

## Acceptance criteria

- A bare constant resolves through the reading scope first — the current FQN,
  then each enclosing namespace — as Ruby's lexical lookup does, falling back to
  today's search only when nothing lexical matches.
- A `scripts/` test covers two classes with a same-named constant.
- `pnpm parity:api --package actiondispatch` reports `http/permissions_policy.rb`
  13/13 and `http/content_security_policy.rb` unchanged; no other package's
  totals move, or the PR lists each that does.
