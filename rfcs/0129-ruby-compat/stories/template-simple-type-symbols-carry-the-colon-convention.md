---
title: "template-simple-type-symbols-carry-the-colon-convention"
status: draft
updated: 2026-09-04
rfc: "0129-ruby-compat"
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

## Context

`ActionView::Template::SimpleType`'s symbol list is Ruby Symbols
(`vendor/rails/actionview/lib/action_view/template/types.rb:10`):

```ruby
@symbols = [ :html, :text, :js, :css, :xml, :json ]
```

and `SimpleType#symbol` is `symbol.to_sym` (`types.rb:31`), `#ref` returns it
(`types.rb:37`), `#to_s` is `@symbol.to_s` (`types.rb:33`). The resolver
interpolates them into a regex through an explicit `to_s`
(`vendor/rails/actionview/lib/action_view/template/resolver.rb:17`):

```ruby
formats = Regexp.union(Template::Types.symbols.map(&:to_s))
```

trails spells all of them BARE — `packages/actionview/src/template/types.ts`'s
`SYMBOLS` is `["html", "text", ...]`, and the `formats` detail carried through
`lookup-context.ts`, `template-details.ts`, `resolver.ts` and the three
renderers is bare throughout — against CLAUDE.md's "A Ruby Symbol is a JS
string, never a JS `Symbol`" convention (`":html"`).

That bare spelling became load-bearing when PR #<this one> converged
`Mime::Type#symbol` onto the colon convention under
[[restore-instrumentation-process-action-seat]]: Rails feeds
`self.formats = request.formats.filter_map(&:ref)`
(`vendor/rails/actionpack/lib/action_controller/metal/rendering.rb:192`) —
Symbols — straight into `LookupContext#formats=`, whose
`Template::Types.valid_symbols?` (`lookup_context.rb:269`) compares them
against `Types.symbols`. With one side converged and the other not, the
comparison fails, so that PR flattens the Symbol back to a bare name at
`packages/actionpack/src/action-controller/metal/rendering.ts`'s
`processAction` with a comment pointing here. That flattening is the deviation
this story removes.

## Converged shape

`Types.symbols()` returns the colon spellings (`":html"`, `":text"`, …);
`Types.isValidSymbols` compares against them; `resolver.ts`'s `PathParser`
maps them through `symbolToS` the way `resolver.rb:17` maps them through
`to_s`; every seat that turns a format into a template-file extension or an
`?? "html"` default (`lookup-context.ts`, `resolver.ts`, `base.ts:267`,
`renderer/template-renderer.ts`, `renderer/partial-renderer.ts`,
`renderer/streaming-template-renderer.ts`, `renderer/abstract-renderer.ts`)
does the same; and the `symbolToS` in actionpack's `processAction` is deleted
so `request.formats.filter_map(&:ref)` reaches `formats=` verbatim.

## Acceptance criteria

- [ ] `packages/actionview/src/template/types.ts`'s `SYMBOLS` carry the colon
      convention, mirroring `types.rb:10`.
- [ ] `PathParser.buildPathRegex` maps them through `symbolToS`, mirroring
      `resolver.rb:17`'s `.map(&:to_s)`.
- [ ] The `symbolToS` flattening and its comment in
      `packages/actionpack/src/action-controller/metal/rendering.ts`'s
      `processAction` are gone.
- [ ] actionview and actionpack suites green.
