---
title: "ruby-compat: PP::ObjectMixin#pretty_print takes pp_object for an object with Kernel's inspect"
status: draft
updated: 2026-10-08
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

Surfaced by the review of trails PR 8684, which moved the pretty printer into ruby-compat as
`packages/ruby-compat/src/pp.ts` (the port of `vendor/ruby/v3.3.11/lib/pp.rb`).

`PP::ObjectMixin#pretty_print` (`vendor/ruby/v3.3.11/lib/pp.rb:321-334`) has two outcomes. When the
receiver's `inspect` is not `Kernel`'s (its owner differs, or `method` cannot find it and
`respond_to?(:inspect)` answers), it is `q.text self.inspect`. Otherwise it is `q.pp_object(self)`
(`pp.rb:269-282`), which opens an `object_address_group` and lists
`pretty_print_instance_variables` (`pp.rb:349-351`, `instance_variables.sort`) as
`@name=value` pairs, each in its own `group(1)` so a wide object breaks one ivar per line.

trails' `prettyPrint(obj, q)` in `pp.ts` ends in `q.text(rbInspect(obj))` for every value that is
not an Array, a Hash or a `prettyPrint` receiver. For an object with ivars and no `inspect` of its
own, `rbInspect` reaches `rbObjInspect` (`packages/ruby-compat/src/object.ts`), which renders
`#<Class:0x… @a=1, @b=2>` as one unbreakable text. So that object never line-breaks, where
`PP.pp` in Ruby breaks it.

No call site reaches the arm today: every `PP.pp` in the ported activerecord tests prints a record,
a relation or a collection proxy, all of which define `pretty_print`.

What the port needs:

- The two-arm check. "`inspect` is Kernel's" is exactly the case in which `rbInspect`'s
  `inspectValue` falls through to `rbObjInspect`: an object that is not a core value, has no
  `inspect` of its own, and whose `rbObjAsString` is not a String. That condition lives inside
  `inspectValue` and has to be readable from `pp.ts` without being restated there.
- `pp_object` at `pp.rb:269-282` and `pretty_print_instance_variables` at `pp.rb:349-351`, a
  receiver's own `prettyPrintInstanceVariables` taking precedence as Ruby dispatch gives it.
- The ivar spelling `rbObjInspect` already applies (`fooBar` / `_fooBar` is `@foo_bar`), shared
  rather than copied.

## Acceptance criteria

- [ ] `PP#ppObject` is ported from `pp.rb:269-282`, cited and receipted, and `prettyPrint` in `pp.ts` takes it for an object whose `inspect` is `Kernel`'s, in the branch order of `pp.rb:321-334`.
- [ ] `pretty_print_instance_variables` (`pp.rb:349-351`) is ported, sorted, and overridable by the receiver.
- [ ] The class JSDoc in `pp.ts` no longer says `pp_object` is not ported.
- [ ] `pp.trails.test.ts` covers an ivar object printed narrow and wide, with expected strings checked against `ruby`.
- [ ] `pnpm parity:api:extra:gate` stays green (ruby-compat receipted).
