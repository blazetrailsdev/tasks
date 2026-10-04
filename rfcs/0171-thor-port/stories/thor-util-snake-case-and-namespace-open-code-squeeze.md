---
title: "Thor::Util snake_case and namespace_from_thor_class call a ruby-compat squeeze and to_s, not regex and a typeof arm"
status: draft
updated: 2026-10-04
rfc: "0171-thor-port"
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

`vendor/thor/v1.3.2/lib/thor/util.rb:43-47`:

    constant = constant.to_s.gsub(/^Thor::Sandbox::/, "")
    constant = snake_case(constant).squeeze(":")

and `util.rb:90-94` uses `.squeeze("_")`.

`packages/trailties/src/thor/util.ts` (trails#8469) deviates twice:

- `String#squeeze` is written `.replace(/:+/g, ":")` and `.replace(/_+/g, "_")`, because ruby-compat has no
  `squeeze` (`rb_str_squeeze`, `vendor/ruby/v3.3.11/string.c`).
- `constant.to_s` is `typeof constant === "function" ? rbModToS(constant) : rbObjAsString(constant)`, an arm Ruby
  does not have, because `rbObjAsString` (`packages/ruby-compat/src/object.ts`) falls to `String(value)` for a JS
  class and returns its source text instead of dispatching `Module#to_s`.

Also `util_spec.rb:41-44` "accepts class and module objects" is unported: it passes `Thor::Util` itself, which
needs the module object `port-thor-util` adds.

## Acceptance criteria

- [ ] ruby-compat exports `squeeze` with its MRI citation and `@noRailsEquivalent PERMANENT` receipt, and both
      `util.ts` sites call it.
- [ ] `rbObjAsString` renders a class through `rbModToS`, and `namespaceFromThorClass` is
      `rbObjAsString(constant).gsub(...)` with no `typeof` arm.
- [ ] "accepts class and module objects" is ported in `util.test.ts`.
