---
title: "Template owns the strict-locals check, not the tse compiler"
status: draft
updated: 2026-09-01
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Template#compiled_source`
(`vendor/rails/actionview/lib/action_view/template.rb:443-485`) splats the
strict-locals signature into the compiled method's parameter list:

```ruby
method_arguments =
  if set_strict_locals
    if set_strict_locals.include?("&")
      "local_assigns, output_buffer, #{set_strict_locals}"
    else
      "local_assigns, output_buffer, #{set_strict_locals}, &_"
    end
  else
    "local_assigns, output_buffer, &_"
  end
```

`Template#compile` (`:509-537`) then reads those parameters back off the
defined method to audit them and to populate `@strict_local_keys`, and
`Base#_run` (`base.rb:261-282`) splats the locals as kwargs under
`has_strict_locals:` and converts the resulting `ArgumentError` into a
`StrictLocalsError`.

trails has none of that machinery, because a JS function has no keyword
parameters. Instead `@blazetrails/tse-compiler` reads the
`<%# locals: (...) %>` magic comment itself and emits a
`StrictLocalsMismatch` throw into the template body
(`packages/tse-compiler/src/emit-js.ts:96,113`). Three consequences, all
currently documented in place:

- `packages/actionview/src/template.ts` `compiledSource` has no
  `method_arguments` branch, and hands the handler the source BEFORE
  `strict_locals!` strips the magic comment — inverting `template.rb:444-446`
  — because the compiler is what reads the signature.
- `compile` has no parameter audit, and so no `to_sentence`d `ArgumentError`
  for `locals: (foo, *foo)`; it carries `@missingRailsCall to_sentence —
  PERMANENT`.
- `_strictLocalKeys` is never written, so `Template#render`'s
  `implicit_locals` branch (`:275-278`) is dead code by construction, and
  `Base#_run` does not accept `has_strict_locals:`.

## Converged shape

Move the strict-locals contract off the compiler and onto `Template`, which is
where Rails keeps it. `compiledSource` emits the check from
`strict_locals!`'s own signature (so the handler can go back to receiving the
stripped source, per `template.rb:444-446`), `compile` audits that signature
for non-keyword entries and raises the `ArgumentError` of `:529-533`, and
`@strict_local_keys` gets populated so `render`'s `implicit_locals` branch
becomes live. `Tse` then stops emitting `StrictLocalsMismatch` and
`raiseOnStrictLocalsMismatch` retires.

## Acceptance criteria

- `Template#compiledSource` calls `strictLocalsBang()` before reading
  `source`, matching `template.rb:444-446`'s order.
- `Template#compile` raises on a non-keyword strict-locals entry with the
  message of `template.rb:529-533`; the `@missingRailsCall to_sentence` receipt
  is gone.
- `Template#_strictLocalKeys` is populated per `template.rb:534-537`, and
  `render`'s `implicit_locals` branch is exercised by a test.
- `@blazetrails/tse-compiler` no longer emits the `StrictLocalsMismatch` throw.
