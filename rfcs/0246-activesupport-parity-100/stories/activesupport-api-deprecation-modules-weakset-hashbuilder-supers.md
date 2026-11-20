---
title: "activesupport-api-deprecation-modules-weakset-hashbuilder-supers"
status: claimed
updated: 2026-11-20
rfc: "0246-activesupport-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-20T20:58:47Z"
assignee: "activesupport-api-deprecation-modules-weakset-hashbuilder-supers"
blocked-by: null
closed-reason: null
---

## Context

Split out of `activesupport-api-structure-misplaced-inheritance-arity`, whose
PR closed the core-class inheritance rows, the four arity rows and the
`core_ext/date/acts_like.rb` misplacement. Three structure rows remain in
`pnpm parity:api -- --package activesupport --inheritance`:

- **Misplaced:** `deprecation/behaviors.rb` and `deprecation/reporting.rb`
  match in `packages/activesupport/lib/deprecation.ts` (`class Deprecation`,
  ~200 lines). Rails `class Deprecation` includes `Behavior`
  (`vendor/rails/v8.0.2/activesupport/lib/active_support/deprecation/behaviors.rb:69-140`)
  and `Reporting` (`deprecation/reporting.rb:7-160`) as modules. Move the
  members into plain-object modules in `lib/deprecation/behaviors.ts` and
  `lib/deprecation/reporting.ts` and `include()` them into `Deprecation`
  (root CLAUDE.md § "Module mixins"). `debug`, `behavior`,
  `disallowed_behavior`, `silenced`, `gem_name` are accessors.
- **`descendants-tracker.ts:WeakSet`:** Rails' `WeakSet < ObjectSpace::WeakMap`
  (`descendants_tracker.rb:20-26`, `to_a` aliased to `keys`, `<<` is
  `self[object] = true`). ruby-compat's `WeakMap`
  (`packages/ruby-compat/lib/object-space.ts:17`) has only `set` and an async
  `eachKey`; it needs `[]`, `key?`, `keys`, `delete` (`weakmap.c`) and an
  export on `ObjectSpace` before `WeakSet` can extend it. Callers in
  `descendants-tracker.ts` then use the Rails spellings.
- **`xml-mini/nokogirisax.ts:HashBuilder`:** Rails' `< Nokogiri::XML::SAX::Document`
  (`xml_mini/nokogirisax.rb:16`). `@blazetrails/nokogiri` is an optional peer
  loaded by dynamic import in `nokogirisax.ts`, and its class is spelled
  `SaxDocument` (`packages/nokogiri/lib/xml/sax/document.ts:3`), so the
  superclass edge needs the module-eval read reshaped (Rails requires
  nokogiri at the top of the file and raises `LoadError` there).

## Acceptance criteria

- [ ] `deprecation/behaviors.rb` and `deprecation/reporting.rb` map to
      `deprecation/behaviors.ts` / `deprecation/reporting.ts`; misplaced is 0.
- [ ] `WeakSet extends ObjectSpace.WeakMap`, with the Rails `to_a` / `<<`.
- [ ] `HashBuilder` extends nokogiri's SAX `Document`.
- [ ] `parity:api` shows inheritance 100% for activesupport.
