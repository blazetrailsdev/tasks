---
title: "Remove ruby-compat's Module class; modules are plain objects"
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
est-loc: 700
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

- `export class Module` is deleted from `packages/ruby-compat/src/include.ts`,
  along with the carrier machinery (`carrierOf` and friends) that only it uses.
- Every `new Module(...)` site is rewritten to the sanctioned plain-object
  module shape (`include()` / `extend()` / `defineModule`), keeping the Rails
  module name, members and include order.
- `Kernel` and `Comparable` in `include.ts` are plain-object modules.
- The sites that relied on live include (methods defined after inclusion)
  are ported without a carrier; any that cannot be are listed back to the
  repo owner rather than kept on a new carrier-like shape.
- CLAUDE.md passages that describe a `Module` instance (§ "`singleton_class`
  is a per-object subclass", § "Ruby protocol methods…" lazy_route_set
  bullet) are updated.
- This is far over one PR: the first PR converts ruby-compat itself plus one
  package, and files one story per remaining package (deps on this one), with
  the class deleted in the last.
