---
title: "Delete ruby-compat's Module class and carrier machinery"
status: blocked
updated: 2026-10-21
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
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
priority: 17
pr: null
claim: null
assignee: null
blocked-by: "Capstone: 123 non-test new Module( and 146 .superMethod( lines remain outside ruby-compat on origin/main 2026-10-21, plus 81 test-file sites and Module imports; gated by deps on every open RFC 0197 conversion/live-include/retire story"
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
