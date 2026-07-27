---
title: "converge-http-parameters-writers-onto-accessors"
status: in-progress
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5407
claim: "2026-07-27T14:05:08Z"
assignee: "converge-http-parameters-writers-onto-accessors"
blocked-by: null
closed-reason: null
---

## Context

From the `audit-set-prefixed-writers-for-accessor-convergence` inventory.
`scripts/api-compare/conventions.ts` maps a Ruby writer `foo=` onto the SAME
camelCase name as its reader, so an `export function setFoo` sibling is TS
surface Rails does not have.

`packages/actionpack/src/action-dispatch/http/parameters.ts` exports two such
writers, both with readers in the same TS file and matching Ruby pairs in
`vendor/rails/actionpack/lib/action_dispatch/http/parameters.rb`:

- `setParameterParsers` (line 84) / `parameterParsers` — Rails
  `parameter_parsers=` is a class-level `mattr_accessor`-style writer on
  `Parameters::ClassMethods`.
- `setPathParameters` (line 146) / `pathParameters` — Rails
  `path_parameters=` writes the `action_dispatch.request.path_parameters`
  header slot.

The converged shape is an exported class module holding `get`/`set` accessor
pairs under the Rails name (a plain assignable static property covers the
class-level `parameter_parsers` pair), mixed into hosts via `include()` from
`@blazetrails/activesupport` or by deriving the mixin host from the class
prototype. Exemplar:
`packages/actionpack/src/action-dispatch/http/mime-negotiation.ts`.

## Acceptance criteria

- Both `set`-prefixed exports replaced by the accessor shape under the Rails
  name.
- `Request` / `Parameters` call sites updated.
- No new extra-surface allowlist entries or `@noRailsEquivalent` tags.
- Existing actionpack tests stay green.
