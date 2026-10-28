---
title: "Helpers' anonymous? and default_helper_module! read the JS name, not Module#name"
status: done
updated: 2026-10-28
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-10-28T16:19:26Z"
assignee: "call-gate-credits-typed-fetch-on-plain-object-config-receivers"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8570 after trails#8571. `AbstractController::Helpers::ClassMethods`
(`packages/actionpack/src/abstract-controller/helpers.ts`) reads a class's JS `name`:

- `clearHelpers` and the inherited body guard on `isAnonymous(this)`
  (`packages/activesupport/src/module-ext.ts`, `!klass.name`), and
- `defaultHelperModuleBang` builds `helperPrefix` from `this.name`.

Rails reads `Module#name` in both (`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/helpers.rb`,
`inherited` / `default_helper_module!`; `anonymous?` is `name.nil?`,
`activesupport/lib/active_support/core_ext/module/anonymous.rb`). JS infers a `name` for
`const klass = class extends Base {}` (`"klass"`), so a class that is anonymous in Ruby is named in
trails: `default_helper_module!` then looks up `KlassHelper`, and the `rescue NameError` arm does not
swallow it because `e.isMissingName("klassHelper")` compares a differently-cased name.
`ControllerInstanceTests#test_temporary_anonymous_controllers` (`test/controller/base_test.rb:132-139`)
had to build its class as `(() => class extends Base {})()` to stay anonymous.

A class seated later with `rbModConstSet` has an `rbModName` its JS `name` never reflects.

## Acceptance criteria

- [ ] `isAnonymous` answers from `rbModName(klass) == null`, as `Module#anonymous?` does.
- [ ] `defaultHelperModuleBang` derives `helper_prefix` from `rbModName`, and its `missing_name?`
      check names the constant the lookup actually raised for.
- [ ] `temporary anonymous controllers` in `controller/base.test.ts` builds its class as
      `class extends Base {}` assigned to a local, with no IIFE.

## RFC 0205 note

Do not add a namespace seat to give a class its Ruby path. Since
`derive-class-path-from-registered-namespaces`, `rbModName` / `rbModToS` /
`rbObjClassname` answer a class's path from its package's generated table,
`packages/<pkg>/src/class-paths.generated.ts` (`pnpm parity:class-paths`, gated
in CI), whenever the package entry is loaded. A class missing from it is fixed
by pairing it in `parity:api` (or exporting it), not by a seat. Reach a class
from a method body with a plain ES import; the seat helper is kept only at the
Rails bodies that call `const_set` (CLAUDE.md § "Call-time constant
resolution"). Acceptance criteria below that ask for a seat are read through
this note.
