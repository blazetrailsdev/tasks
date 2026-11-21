---
title: "activesupport-deprecation-modules-and-hashbuilder-super"
status: ready
updated: 2026-11-21
rfc: "0246-activesupport-parity-100"
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

Remainder of `activesupport-api-deprecation-modules-weakset-hashbuilder-supers`,
whose PR shipped `DescendantsTracker::WeakSet < ObjectSpace::WeakMap`. Two
structure rows remain in `pnpm parity:api --package activesupport` (2 misplaced,
inheritance 91/93):

- **Misplaced:** `deprecation/behaviors.rb` and `deprecation/reporting.rb`
  match in `packages/activesupport/lib/deprecation.ts` (`class Deprecation`).
  Rails `class Deprecation` includes `Behavior`
  (`vendor/rails/v8.0.2/activesupport/lib/active_support/deprecation/behaviors.rb:69-140`),
  `Reporting` (`deprecation/reporting.rb:7-160`) and `Disallowed`
  (`deprecation/disallowed.rb`). Move the members into modules in
  `lib/deprecation/behaviors.ts`, `lib/deprecation/reporting.ts` and
  `lib/deprecation/disallowed.ts` and `include()` them into `Deprecation`
  (root CLAUDE.md § "Module mixins"). `behavior`, `disallowed_behavior`,
  `silenced` are accessors, so `Behavior` is a class module
  (`static readonly [classModule] = true`).
- **`xml-mini/nokogirisax.ts:HashBuilder`:** Rails' `< Nokogiri::XML::SAX::Document`
  (`xml_mini/nokogirisax.rb:16`). `@blazetrails/nokogiri` is an optional peer
  loaded by dynamic `import()` in `_require`, and its class is
  `SaxDocument` (`packages/nokogiri/lib/xml/sax/document.ts:3`, seated as
  `SAX.Document`). The `extends` is a module-eval read, so the file needs the
  nokogiri load awaited before `HashBuilder` is defined (Rails requires nokogiri
  at the top of the file and raises `LoadError` there).

## Acceptance criteria

- [ ] `deprecation/behaviors.rb` and `deprecation/reporting.rb` map to
      `deprecation/behaviors.ts` / `deprecation/reporting.ts`; misplaced is 0.
- [ ] `HashBuilder` extends nokogiri's SAX `Document`.
- [ ] `parity:api` shows inheritance 100% for activesupport.
