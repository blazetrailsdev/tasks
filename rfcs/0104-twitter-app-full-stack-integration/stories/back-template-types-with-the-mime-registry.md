---
title: "Template::Types is a frozen list, not the Mime registry, and SimpleType's instance side is unported"
status: ready
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 130
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/actionview/src/template/types.ts` scores 2/8 in
`pnpm parity:api --package actionview`. It exposes `Types.symbols()` and
`Types.isValidSymbols()` over a hardcoded array, with this note in the file:

> until `Mime::Type` is ported the set is Rails' default registrations, in the
> order `actionpack/lib/action_dispatch/http/mime_types.rb:8-56` registers them.

Rails has two layers. `Template::SimpleType`
(`vendor/rails/actionview/lib/action_view/template/types.rb:7-47`) is the
stub used when Action View runs without Action Dispatch, and it carries an
instance side trails has none of: `initialize`, `symbol`, `to_s`, `to_str`,
`ref`, `to_sym`, `==`, and the `[]` constructor. `Template::Types` is then
swapped for `Mime` once actionpack loads
(`types.rb:49-52`, `mime_types_implementation`), so `Types.symbols` becomes
`Mime::SET.symbols` (`actionpack/lib/action_dispatch/http/mime_type.rb:56-62`)
— a live registry, not a frozen list.

The frozen list means a `Mime::Type.register` call cannot affect template
lookup: `PathParser`'s format group
(`packages/actionview/src/template/resolver.ts`) and `LookupContext#formats=`
(`packages/actionview/src/lookup-context.ts`) both read it.

## Converged shape

Port `SimpleType`'s instance side, and back `Types.symbols` with the Mime
registry — `packages/actionpack/src/action-dispatch/mime-type.ts` already
exists — through Rails' `mime_types_implementation` swap rather than a copy of
the default list.

## Acceptance criteria

- `SimpleType`'s `symbol` / `toString` / `ref` / `toSym` / `[]` are ported.
- `Types.symbols()` reflects registrations made through `Mime::Type.register`.
- `template/types.rb` improves on 25% in `pnpm parity:api --package actionview`.
