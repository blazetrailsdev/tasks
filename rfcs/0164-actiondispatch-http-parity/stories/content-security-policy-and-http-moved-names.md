---
title: "Remove ContentSecurityPolicy's invented readers and the HTTP files' moved names"
status: draft
updated: 2026-09-27
rfc: "0164-actiondispatch-http-parity"
cluster: null
packages: ["actionpack"]
deps: ["headers-include-alias-and-merge-dups-request"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:extra --package actiondispatch`, for files under
`packages/actionpack/src/action-dispatch/http/`:

- `content-security-policy.ts`: novel `getDirectives`, `hasDirective`,
  `navigateTo`, `reportTo`; moved `getHeader`, `setHeader`. Rails'
  `ContentSecurityPolicy`
  (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/content_security_policy.rb`)
  exposes `directives` (an `attr_reader`) and one `define_method` per
  `DIRECTIVES` key (`:149`), plus `report_uri` (`:238`); `navigate_to` and
  `report_to` appear nowhere in Rails 8's file.
- `mime-negotiation.ts`: 9 moved (`constructor`, `instance`, `NullType`,
  `parameters`, `ref`, `setHeader`, `string`, `symbol`, `toString`)
- `cache.ts`: 3 moved (`getHeader`, `hasHeader`, `setHeader`)
- `headers.ts`: 2 moved (`get`, `set`)
- `parameters.ts`: 2 moved (`deleteHeader`, `setHeader`)
- `param-error.ts`: novel `[Symbol.hasInstance]` — the JS mechanism CLAUDE.md
  § "Ruby protocol methods with a different JS mechanism" ratifies for `is_a?`,
  so it takes a `@noRailsEquivalent PERMANENT` receipt, not a deletion

Two call baseline rows sit in `actiondispatch/http/content-security-policy.json`.

## Acceptance criteria

- The CSP readers are removed (callers use `directives`); `navigateTo` /
  `reportTo` are removed unless a Rails 8 source names them.
- Each moved name is removed or relocated to the file mirroring the `.rb` that
  defines it.
- `[Symbol.hasInstance]` carries its receipt.
- `content-security-policy.json` is empty.
