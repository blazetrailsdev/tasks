---
title: "rbModConstGet raises for a non-constant name and reads later segments through ancestors"
status: draft
updated: 2026-10-03
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails PR 8448, which added `rbModConstGet`
(`packages/ruby-compat/src/variable.ts`), the port of `rb_mod_const_get`
(`vendor/ruby/v3.3.11/object.c:2423`), and widened `rbConstGet` (`rb_const_get`,
`vendor/ruby/v3.3.11/variable.c:3210`) to walk included modules and the
top-level table.

Two arms of the MRI bodies are still missing:

- `rb_mod_const_get` raises `NameError` "wrong constant name …" for a segment
  that is not constant-shaped (`rb_is_const_name` / `wrong_constant`,
  `object.c:2423-2540`). `rbModConstGet` checks no segment, and `rbConstGet`
  opens with `id in klass`, which is true for any inherited JS property. So
  `rbModConstGet(Object, "constructor")` or `"toString"` returns a function
  where Ruby raises. Live callers: `Extensions#loadClass`
  (`packages/activesupport/src/message-pack/extensions.ts`,
  `active_support/message_pack/extensions.rb:258-266`) and `validates`
  (`packages/activemodel/src/validations/validates.ts`,
  `active_model/validations/validates.rb:120-124`). `rbModConstSet` and
  `rbModConstDefined` (`packages/ruby-compat/src/include.ts`) already apply the
  constant-name regexp.
- A later segment is read with `hasOwnProperty`, where `rb_const_get_0` with
  `exclude` still walks the namespace's ancestors (superclass chain and
  included modules), only skipping `Object`.

Related: `constantize-open-codes-rb-mod-const-get` (same RFC) wants
`constantize` to be this one call; this story makes the call faithful first.

## Acceptance criteria

- [ ] `rbModConstGet` raises `NameError` `wrong constant name <name>` for a
      segment that is not a constant name, with the regexp `rbModConstSet` uses,
      before any lookup; `rbConstGet` does not answer a non-constant-shaped
      inherited JS property.
- [ ] A later `::` segment is found on the namespace's ancestors, not only as
      an own property, and a top-level constant is not found through a
      non-`Object` namespace.
- [ ] `variable.trails.test.ts` covers both, and `Extensions.loadClass("constructor")`
      raises.
