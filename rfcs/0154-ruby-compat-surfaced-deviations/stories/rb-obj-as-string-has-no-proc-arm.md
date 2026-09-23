---
title: "rbObjAsString renders a function as its source instead of Proc#to_s"
status: draft
updated: 2026-09-23
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#7998. `rbObjAsString` (`packages/ruby-compat/src/object.ts`)
ports `rb_obj_as_string` (`vendor/ruby/string.c:1653`), but a JS function (Ruby
`Proc`) falls through to `String(value)`, which answers the function's SOURCE
text. Ruby's `Proc#to_s` is `proc_to_s` → `rb_block_to_s`
(`vendor/ruby/proc.c:1555-1600`): `#<Proc:0x… path:line>` plus a `(lambda)` suffix for
a lambda.

trails#7998 added `rbAnyToS` (`object.c:693-701`), which already answers
`#<Proc:0x…>` for a function, and worked around the missing arm by calling it
directly in `_callableToSourceString`.

## Converged shape

`rbObjAsString` gains a `typeof value === "function"` arm rendering
`proc_to_s`'s shape via the shared object-address table (`#<Proc:0x…>`; the
`path:line` part is not recoverable from a JS function and is the only
residual).

## Acceptance criteria

- [ ] `rbObjAsString(() => 1)` matches `/^#<Proc:0x[0-9a-f]{16}/`.
- [ ] A trails test pins it.
