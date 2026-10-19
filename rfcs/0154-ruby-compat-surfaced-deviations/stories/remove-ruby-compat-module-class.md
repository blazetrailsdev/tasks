---
title: "First step off ruby-compat's Module class: Kernel, Comparable and one package"
status: draft
updated: 2026-10-19
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages:
  [
    "ruby-compat",
    "actionpack",
    "actionview",
    "activerecord",
    "activesupport",
    "activemodel",
    "trailties",
  ]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/ruby-compat/src/include.ts:160-830` defines `export class Module`, a
port of Ruby's `Module.new` (`vendor/ruby/v3.3.11/object.c:1950`
`rb_mod_initialize`): a live module object whose `include()` splices a
separate carrier object into the including class's prototype chain, with a
Ruby-named API (`moduleEval`, `name`, `inspect`, `toS`, `include`, …) operating
on that carrier. `include.ts:2020` (`Kernel`) and `:2047` (`rbMComparable`)
build instances of it too.

The repo owner does not want this pattern (2026-10-18): modules are not to be
modelled as `Module` instances with a carrier spliced into the prototype
chain. The Rails module shapes already sanctioned in CLAUDE.md § "Module
mixins" are plain-object modules with `include()` / `Included<>`,
`extend()` / `Extended<>`, `defineModule` for visibility sections, and
`this`-typed functions assigned to the class.

Current users of `new Module(...)` outside tests: about 180 files.

| package                                            | files  |
| -------------------------------------------------- | ------ |
| actionpack                                         | 59     |
| activerecord                                       | 55     |
| actionview                                         | 35     |
| activesupport                                      | 13     |
| activemodel                                        | 8      |
| trailties                                          | 5      |
| did-you-mean, i18n, msgpack, nokogiri, ruby-compat | 1 each |

Examples: `actionpack/src/abstract-controller/callbacks.ts:304,334`,
`abstract-controller/helpers.ts:164,192` (`_helpers = new Module()`, Rails'
`Module.new` helpers module), `action-controller/metal/testing.ts:25`.

Code that depends on the live-carrier semantics needs a per-site look:
`AbstractController::Helpers`' `_helpers` module (methods added after
include), `rbClassAttachedObject` / `ClassAttribute.redefine`'s
`attached_object.is_a?(Module)` arm (CLAUDE.md § "`singleton_class` is a
per-object subclass"), `LazyRouteSet#generateUrlHelpers`' splice beneath the
url-helpers module (CLAUDE.md § "Ruby protocol methods…"), and
`rbModConstSet` classpaths on module instances.

## Acceptance criteria

This story is the first step only (rescoped on trails#9048).

- `Kernel` and `Comparable` in `include.ts` are plain-object modules.
- One package is converted to plain-object modules (nokogiri's
  `Nokogiri::XML::Searchable`).
- One story per remaining package is filed, each depending on this one,
  plus `delete-ruby-compat-module-class-final`, which deletes the class,
  its carrier machinery, the marshal arms and the CLAUDE.md passages, and
  depends on every package story.
- Sites with no carrier-free port are filed for the repo owner
  (`ruby-compat-module-super-and-live-include-owner-decision`).
