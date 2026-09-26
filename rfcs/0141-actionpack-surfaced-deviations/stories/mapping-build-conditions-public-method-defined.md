---
title: "Mapping#build_conditions tests public_method_defined?, not prototype membership"
status: draft
updated: 2026-09-26
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Mapping#build_conditions` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb:196-202`)
keeps a condition only when `request_class.public_method_defined?(k)`. The
trails port (`packages/actionpack/src/action-dispatch/routing/mapper.ts`,
`Mapping#buildConditions`, trails#8162) tests `k in requestClass.prototype`.
That test differs from Rails in two ways:

- A TS `private` / `protected` member, and any name `rbModPrivate` /
  `rbModProtected` records in ruby-compat's visibility side table (CLAUDE.md
  § "Method visibility is a side table"), is kept as a condition. Rails drops it.
- Any string-named property on the prototype chain counts, including accessors
  and `Object.prototype` members, whether or not a public method answers it.

ruby-compat already records visibility (`packages/ruby-compat/src/object.ts`,
`rbModPrivate` / `rbModProtected`, the ports of `vm_method.c:2482-2516`), and
`basicObjRespondTo` reads that table. Nothing ports
`rb_mod_public_method_defined` (`vendor/ruby/v3.3.11/vm_method.c`,
`Module#public_method_defined?`).

## Acceptance criteria

- [ ] ruby-compat ports `Module#public_method_defined?` as
      `rbModPublicMethodDefined(klass, mid)` over the visibility side table,
      with a `@noRailsEquivalent PERMANENT` receipt and trails tests.
- [ ] `Mapping#buildConditions` calls it where Rails calls
      `public_method_defined?`.
- [ ] A test draws a route whose constraint names a private `Request` member
      and asserts the member is dropped from `conditions`.
