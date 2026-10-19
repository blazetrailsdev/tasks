---
title: "Delete ruby-compat's Module class and carrier machinery"
status: draft
updated: 2026-10-19
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat"]
deps:
  [
    "actionpack-drop-ruby-compat-module-class",
    "actionview-drop-ruby-compat-module-class",
    "activemodel-drop-ruby-compat-module-class",
    "activerecord-drop-ruby-compat-module-class",
    "activesupport-drop-ruby-compat-module-class",
    "trailties-drop-ruby-compat-module-class",
    "did-you-mean-drop-ruby-compat-module-class",
    "i18n-drop-ruby-compat-module-class",
    "msgpack-drop-ruby-compat-module-class",
    "ruby-compat-module-super-and-live-include-owner-decision",
  ]
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Last step of `remove-ruby-compat-module-class` (RFC 0154), after every
package has dropped `new Module(...)`. What is left in ruby-compat itself:

- `packages/ruby-compat/src/include.ts:183` `export class Module` and its
  carrier machinery (`carriers`, `carrierOf`, `nestedModules`,
  `includerCarriers`, `singletonCarriers`, `relinkIncluders`, `isLinkOf`,
  `linksOf`), plus every `instanceof Module` arm in `include()`,
  `prepend()`, `extendObject()`, `featureHook`, `publicInstanceMethods`,
  `entryOwner` and `rbModConstSet`.
- `include.ts` `Object.setPrototypeOf(rbCClass, Module)` (Ruby's
  `Class < Module`).
- `packages/ruby-compat/src/marshal.ts:372,647,1065-1066,1112,1128,1151,1228-1232`:
  dumping/loading a module and `extmod` lists are typed on `Module`.
- `rbModConstSet` paths only a `Module` or class value, so a plain-object
  namespace (`psych-to-yaml.test.ts:12` `YAMLSpecs`,
  `marshal.trails.test.ts:42` `Geo::Kind`) gets no classpath; how a
  plain-object module is recognised needs an owner decision.
- Tests of the class itself: `packages/ruby-compat/src/include.test.ts`
  (about 40 `new Module()` sites).
- CLAUDE.md § "`singleton_class` is a per-object subclass" (the "ruby-compat
  `Module` instance is a plain object with a real singleton class" sentence)
  and § "Ruby protocol methods…" lazy_route_set bullet describe a `Module`
  instance.

## Acceptance criteria

- `export class Module` and the carrier machinery are deleted.
- Marshal, `rbModConstSet` and `rbCClass` no longer reference `Module`.
- The two CLAUDE.md passages are updated.
- No carrier-like replacement is introduced.
