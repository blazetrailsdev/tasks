---
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
title: "Ruby modules are plain objects or class modules: retire ruby-compat's Module class, inline module super"
status: active
created: 2026-10-19
updated: 2026-10-20
owner: "@deanmarano"
packages:
  - "ruby-compat"
  - "activesupport"
  - "actionview"
  - "actionpack"
  - "activemodel"
  - "activerecord"
  - "trailties"
  - "did-you-mean"
  - "i18n"
  - "msgpack"
  - "scripts"
clusters:
  - design
  - tooling
  - conversion
  - retire
related-rfcs:
  - "0154-ruby-compat-surfaced-deviations"
  - "0188-module-initialize-inlined-into-constructors"
priority: 3
---

# RFC 0197 — Ruby modules are plain objects or class modules: retire ruby-compat's Module class, inline module super

## Summary

ruby-compat's `export class Module` (`packages/ruby-compat/src/include.ts`) ports
Ruby's `Module.new` as a live object. When it is included, a separate carrier
object is spliced into the including class's prototype chain. The repo owner
does not want that class or any carrier shape like it (2026-10-18). This RFC
finishes the conversion that RFC 0154's `remove-ruby-compat-module-class`
started (trails#9048, trails#9050):

1. It fixes the two module shapes that replace `Module` (plain object and class
   module) and the three conventions they rest on.
2. It settles what a module method's Ruby `super` becomes. The answer is the
   one RFC 0188 gave for a module's `initialize`: **inline the next body up the
   chain at the `super` position, in each including class, and mark it
   `@inlinedFrom`.**
3. It settles the two remaining carrier-dependent behaviours: naming a plain
   module bound to a constant, and methods defined on a module after it is
   included.
4. It schedules the per-package conversions, then deletes `Module`.

## Motivation

### Baseline

Measured 2026-10-19 on trails `concern-actionview-plain-modules` (trails#9050),
non-test `.ts` only.

| Package       | `new Module(...)` | `.superMethod(` calls |
| ------------- | ----------------- | --------------------- |
| actionpack    | 79                | 38                    |
| activerecord  | 78                | 79                    |
| activesupport | 18                | 1                     |
| actionview    | 16                | 14                    |
| activemodel   | 9                 | 11                    |
| trailties     | 7                 | 4                     |
| did-you-mean  | 1                 | 1                     |
| i18n          | 1                 | 0                     |
| msgpack       | 1                 | 0                     |
| **Total**     | **210**           | **148**               |

The 148 `superMethod` calls sit in 68 distinct modules.

Already converted: ruby-compat's `Kernel` and `Comparable`, nokogiri's
`Searchable` (trails#9048); ActiveSupport `Concern`, and 22 actionview modules
(trails#9050).

### Why `super` is the blocker

`Module#superMethod(receiver, name)` resumes the method search at the link the
module contributed to `receiver`'s prototype chain (`vm_search_super_method`,
`vendor/ruby/v3.3.11/vm_insnhelper.c:4648`). Plain-object `include()` copies a
module's methods onto the class prototype, so there is no link to resume from.

The two cannot be mixed either. A plain module's copied methods land on the
class itself and outrank every carrier link beneath it, whatever the include
order. In trails#9050, converting `Context`, `TagHelper` and `UrlHelper` failed
18 tests, because carrier modules reach them through `super`:

- `RenderingHelper#_layout_for` reaches `Context#_layout_for`
  (`actionview/lib/action_view/helpers/rendering_helper.rb:207-215`).
- `ActiveModelInstanceTag#content_tag` / `#tag` reach `TagHelper`'s
  (`helpers/active_model_helper.rb:20-26`, included into `Tags::Base` at
  `helpers/tags/base.rb:7`).
- `RoutingUrlFor#url_for` reaches `UrlHelper#url_for`.

## Design

### Module shapes

1. **Plain-object module.** Its own enumerable members are its instance
   methods. Its own non-enumerable members are its singleton methods: what
   `extend()` installs (for example the `Concern` hooks) and module state (for
   example `Concern`'s `@_dependencies`, `@_included_block` and
   `@_prepended_block`). `include()` copies the enumerable members.
   `featureHook` answers a non-enumerable own `appendFeatures`,
   `prependFeatures`, `included` or `extended`.
2. **Class module.** This is a TS class used as a module, a spelling `include()`
   already took. The prototype holds the instance methods, whether enumerable
   or not, and the statics hold the singleton methods. Use it when a module has
   a singleton and an instance member of the same name (`mattr_accessor`
   defines both: `SanitizeHelper.sanitizer_vendor` and `#sanitizer_vendor`), or
   when a definer writes instance members non-enumerably (`attr_internal`,
   `delegate`, accessor `defineProperties`).
3. **Module includes module.** `include(plainModule, other)` records `other`.
   When a class later includes `plainModule`, `rbModAppendFeatures` appends the
   recorded modules first, as `include_modules_at`
   (`vendor/ruby/v3.3.11/class.c:1253`) walks the included module's ancestry, so
   the outer module's own methods win. A `Concern` dependency still goes
   through `Concern#append_features`. Class modules need the same record:
   `FormHelper` includes the non-Concern `ModelNaming` and `RecordIdentifier`.

`rbModAppendFeatures` and `rbModPrependFeatures` (trails#9050) are ruby-compat's
`Module#append_features` and `#prepend_features`. They are what `Concern` calls
as `super`.

### Module `super` is inlined

This is RFC 0188's rule, widened from `initialize` to every module method that
calls `super`.

- A module method `M#foo` whose Rails body calls `super` is not a member that
  can reach the next `foo` at run time. For each class `C` that includes `M`,
  `C#foo` is written as `M#foo`'s body, with the next `foo` in `C`'s Rails
  ancestry inlined at the `super` position, line for line. The chain is walked
  until a body makes no `super` call, or until it reaches `C`'s JS superclass,
  where the `super` stays a real JS `super.foo()`.
- `C#foo` carries one `@inlinedFrom <Module>#foo <citation>` tag per inlined
  segment from another Ruby file, in ancestor order. The citation has the same
  shape as RFC 0188's: `<source>/<version>/<file>:<first>-<last>`, derived from
  `rails-api.json` and autofixed. A segment from the Ruby file `C`'s TS file
  mirrors is inlined untagged.
- `M#foo` itself is not kept as a separate copy of its body. `M` keeps every
  member that does not call `super`. A member that does call `super` lives only
  in the includers' inlined methods.
- Example. `Tags::Base` includes `ActiveModelInstanceTag`, `TagHelper` and
  `FormTagHelper` (`tags/base.rb:7`). `Tags::Base#contentTag` is
  `ActiveModelInstanceTag#content_tag`'s ternary with `TagHelper#content_tag`'s
  body at each `super`, tagged `@inlinedFrom
ActionView::Helpers::ActiveModelInstanceTag#content_tag
rails/v8.0.2/actionview/lib/action_view/helpers/active_model_helper.rb:20-22`.
  `TagHelper` then becomes a plain module, because nothing reaches it through a
  carrier.
- **Ordering constraint.** A module that is a `super` target converts in the
  same PR as the module whose `super` reaches it, because a plain module
  outranks carrier links.

The gates need the same three changes RFC 0188 made for constructors, now for
methods: the extractor and lint admit `@inlinedFrom` on a method, naming a
module method; `parity:api` credits the inlined module method to the includer's
method; and `parity:api:calls` / `:args` compare the includer's method against
the union of the tagged bodies, with each `super` consumed by the next segment.
The closed list in `eslint/inlined-from-only-on-constructors.mjs` widens to
module methods reached by `super`. arel's `inlined-from` bucket, the general
case of a module member whose body sits on an includer, stays pinned at 0.

### A module included by an open set of classes binds `super` at include time

Inlining needs a list of the classes that include a module. A concern that
application code includes directly (`ActiveModel::Dirty`, `Validations`,
`Validations::Callbacks`, `Attributes`; `callbacks.trails.test.ts` includes
`Validations::Callbacks` into its own classes) has no such list, so the rule
above cannot reach every includer. For such a module, `include()` records the
`super` instead (owner, 2026-10-20):

- When `include()` copies a plain-object module's method `foo` onto
  `klass.prototype` over a `foo` the prototype already answers (an earlier
  module's copy, or the superclass's), it seats that earlier `foo` on
  `klass.prototype` under a symbol private to the copied function. This is the
  next `foo` in `klass`'s ancestry at the moment of the include, which is
  where `include_modules_at` (`vendor/ruby/v3.3.11/class.c:1253`) puts the
  module: a later include sits above an earlier one, and the superclass sits
  beneath both.
- The module method's Rails `super` is written `rbCallSuper(this, foo, ...args)`
  (MRI `rb_call_super`, `vendor/ruby/v3.3.11/vm_eval.c:366`), which reads that
  symbol off the receiver: one property read, no walk of a recorded ancestry,
  no carrier link. With nothing seated, it falls through to `Kernel`, as every
  Ruby ancestry ends in `Object`.
- The body stays in the module's own file under its Rails name, so the call
  gates pair it with its Rails body directly, and no includer carries
  `@inlinedFrom` for it.
- Limits: the seat is a snapshot, so a `foo` redefined on the superclass after
  the include is not seen; and a method a class defines itself still is not
  overwritten by the copy, so its own JS `super.foo()` skips the module, as for
  every plain module.

Inlining stays the rule for a module whose includers are a closed set of
framework classes; this binding is for the open-set concerns.

### Naming a plain module

`rb_mod_const_set` (`vendor/ruby/v3.3.11/object.c:2545`,
`variable.c:3648-3668`) names a module bound to a constant. `rbModConstSet`
paths only a `Module` or a class, so a plain-object namespace gets no classpath,
and Marshal and YAML cannot name it (`ruby-compat/src/marshal.trails.test.ts:42`
`Geo::Kind`, `psych-to-yaml.test.ts:12` `YAMLSpecs`). `defineModule` already
stamps `moduleVisibility` on what it returns. That stamp becomes the mark of a
module: `rbModConstSet` paths a value carrying it, and `rbModName` / `rbModToS`
read the path as they do a class's. A plain namespace that needs a name is built
with `defineModule`.

### Methods defined after inclusion

Ruby's include shares the module's method table (`rb_include_module`,
`class.c:1179`), so a later `define_method` reaches classes that already
include it. There is no carrier-free form of that sharing, so each site is
ported so that the definitions exist before the include, or the define writes
to the includers directly. Each site is its own story:

- `actionpack/src/abstract-controller/helpers.ts:164,192`: `_helpers` /
  `HelperMethods`, Rails `abstract_controller/helpers.rb`.
- `activesupport/src/code-generator.ts:23`: `MethodSet` caches.
- `activesupport/src/current-attributes.ts:229` and
  `activemodel/src/attribute-methods.ts:360`: `generated_attribute_methods`.
- `LazyRouteSet#generateUrlHelpers`' splice (CLAUDE.md § "Ruby protocol methods…").

## Non-goals

- A live carrier of any shape, including an includer registry that re-splices.
  The owner ruled this out.
- Class factories (`const M = (Base) => class extends Base`) to get a real
  `super`. RFC 0188 already rejects these.
- Changing how `included` / `extended` hooks run, beyond `featureHook` reading
  them off plain objects and class modules.

## Alternatives considered

- **Keep `Module#superMethod` for the `super` sites only.** That keeps the
  carrier, which the owner ruled out.
- **A shared `super` resolver that walks a recorded ancestry and calls the next
  copy.** This is a carrier in all but name: per-call indirection, and a body
  the gates cannot pair. Binding `super` at include time (§ "A module included
  by an open set of classes binds `super` at include time") differs on both
  counts: nothing is walked at call time, and the body stays where it pairs.
- **Copy the module's methods under mangled names and call those as `super`.**
  This is invented surface on every includer, and `parity:api:extra` counts it.

## Rollout

1. Design and docs: `claude-md-section-for-plain-object-and-class-modules`.
2. ruby-compat: `class-modules-record-module-includes`,
   `rbmodconstset-names-define-module-branded-plain-modules`.
3. Gates: `inlined-from-admits-module-super-segments-on-methods`.
4. Package conversions, which inline module `super` and convert modules. After
   this RFC merges, RFC 0154's story files are moved here and given a dependency
   on step 3: `actionview-drop-ruby-compat-module-class`,
   `actionpack-drop-ruby-compat-module-class`,
   `activemodel-drop-ruby-compat-module-class`,
   `activerecord-drop-ruby-compat-module-class`,
   `activesupport-drop-ruby-compat-module-class`,
   `trailties-drop-ruby-compat-module-class`,
   `did-you-mean-drop-ruby-compat-module-class`,
   `i18n-drop-ruby-compat-module-class`,
   `msgpack-drop-ruby-compat-module-class`.
5. Methods defined after inclusion, one story per site:
   `actionpack-helpers-module-defined-before-include`,
   `activesupport-code-generator-method-sets-without-live-include`,
   `generated-attribute-methods-without-live-include`,
   `lazy-route-set-url-helpers-without-splice`.
6. Retire: `delete-ruby-compat-module-class-final`, moved here from RFC 0154.
   `ruby-compat-module-super-and-live-include-owner-decision` closes, answered
   by this RFC once it is active.

## Verification

- `new Module(` in non-test package source: 210 → 0.
- `.superMethod(` calls: 148 → 0.
- `export class Module` deleted from `include.ts`, along with `carrierOf`,
  `includerCarriers`, `singletonCarriers` and `relinkIncluders`.
- `parity:api:extra:gate`, `parity:api:calls` and `parity:api:calls:args` green
  on every conversion PR. `parity:api` coverage does not drop, because each
  inlined module method is credited through its tag.

## Open questions

1. **A module method with `super` included into many classes** is duplicated
   in each, like RFC 0188's Open question 1. Deferred: each conversion story's
   PR body states the count for its modules, and
   `delete-ruby-compat-module-class-final` totals them.
2. **Widening `@inlinedFrom` from constructors to methods.** Resolved: the
   owner approved the widening on 2026-10-19, on the grounds that the tag keeps
   an inlined body in sync with its Rails source. Implemented by
   `inlined-from-admits-module-super-segments-on-methods`.
3. **Methods defined after inclusion.** Recommendation per site: reorder so the
   definitions exist before the include where Rails' own flow allows it (for
   example, the view class is built from `_helpers` on demand), else file the
   site back to the owner. Deferred to the four site stories.

## Changelog

- 2026-10-19: drafted from the trails#9048 / trails#9050 sessions, with the
  `super` strategy taken from RFC 0188.
- 2026-10-19: owner approved widening `@inlinedFrom` to module methods reached
  by `super` (Open question 2); status `active`.
- 2026-10-20: owner approved binding a module method's `super` at include time
  for modules that application code includes (§ "A module included by an open
  set of classes binds `super` at include time"); activemodel converts first.
