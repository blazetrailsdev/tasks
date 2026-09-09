---
title: "Template::Types is a frozen list, not the Mime registry"
status: ready
updated: 2026-09-09
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/actionview/src/template/types.ts` exposes `Types.symbols()` and
`Types.isValidSymbols()` over a hardcoded array, which carried this note:

> until `Mime::Type` is ported the set is Rails' default registrations, in the
> order `actionpack/lib/action_dispatch/http/mime_types.rb:8-56` registers them.

Rails has two layers. `Template::SimpleType`
(`vendor/rails/actionview/lib/action_view/template/types.rb:7-47`) is the
stub used when Action View runs without Action Dispatch. **Its instance side —
`initialize`, `symbol`, `to_s`/`to_str`, `ref`, `to_sym`, `==` and the `[]`
constructor — was ported by PR #7636**, which needed `Types[extname].symbol` for
`RawFile#initialize` (`template/raw_file.rb:12-13`); `template/types.rb` now
scores 9/9. What remains is the registry half below. `Template::Types` is then
swapped for `Mime` once actionpack loads
(`types.rb:49-52`, `mime_types_implementation`), so `Types.symbols` becomes
`Mime::SET.symbols` (`actionpack/lib/action_dispatch/http/mime_type.rb:56-62`)
— a live registry, not a frozen list.

The frozen list means a `Mime::Type.register` call cannot affect template
lookup: `PathParser`'s format group
(`packages/actionview/src/template/resolver.ts`) and `LookupContext#formats=`
(`packages/actionview/src/lookup-context.ts`) both read it.

Since PR #7487 the registry side also carries the colon convention:
`Mime::Type#symbol` is `":html"` rather than a bare `"html"`, per CLAUDE.md's
"a Ruby Symbol is a JS string, never a JS `Symbol`". That makes this story's
convergence the one that closes the colon gap on the actionview side too —
`Types.symbols` backed by `Mime::SET.symbols` is colon-spelled by construction,
which is what `types.rb:10`'s `@symbols = [ :html, ... ]` says. Two consequences
travel with it, both currently deviations:

- `PathParser`'s format group (`packages/actionview/src/template/resolver.ts`)
  must map through `symbolToS`, the way `resolver.rb:17` maps through `to_s`
  (`Regexp.union(Template::Types.symbols.map(&:to_s))`) — a template file
  extension is the symbol's name, not the symbol.
- `packages/actionpack/src/action-controller/metal/rendering.ts`'s
  `processAction` currently flattens the Symbol back to a bare name
  (`out.push(isSymbol(v) ? symbolToS(v) : v)`) precisely because this side is
  not converged, where Rails hands `request.formats.filter_map(&:ref)` — Symbols
  — straight to `formats=` (`rendering.rb:191-194`). That flattening is deleted
  by this story. It carries no call-site comment saying so and cannot:
  `no-freeform-comments` keeps only the four repo JSDoc flags with their reason
  arguments and tool directives, and none of the four describes an EXTRA call
  the TS body makes.

Every seat that turns a format into a template-file extension or an
`?? "html"` default moves with them — `lookup-context.ts`, `resolver.ts`,
`base.ts:267`, `renderer/template-renderer.ts`, `renderer/partial-renderer.ts`,
`renderer/streaming-template-renderer.ts`, `renderer/abstract-renderer.ts`.

## Converged shape

Back `Types.symbols` with the Mime registry — `packages/actionpack/src/action-dispatch/mime-type.ts` already
exists — through Rails' `mime_types_implementation` swap rather than a copy of
the default list.

## Acceptance criteria

- `Types.symbols()` reflects registrations made through `Mime::Type.register`,
  and is colon-spelled, mirroring `types.rb:10`.
- `PathParser.buildPathRegex` maps them through `symbolToS`, mirroring
  `resolver.rb:17`'s `.map(&:to_s)`.
- The `symbolToS` flattening in
  `packages/actionpack/src/action-controller/metal/rendering.ts`'s
  `processAction` is gone.
- `packages/actionview/src/template/html.test.ts`'s `it.todo` for
  `html_test.rb:10-14`'s "formats returns string for recognized MIME type when
  MIME does not have symbol" becomes a real test — it needs `Mime::Type.lookup`,
  which is exactly what this story wires up.
- actionview and actionpack suites green.
- `template/types.rb` stays at 100% in `pnpm parity:api --package actionview`.
