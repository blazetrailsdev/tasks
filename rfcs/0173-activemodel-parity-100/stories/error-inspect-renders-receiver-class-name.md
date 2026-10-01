---
title: "error-inspect-renders-receiver-class-name"
status: done
updated: 2026-10-01
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8313
claim: "2026-10-01T01:20:28Z"
assignee: "error-inspect-renders-receiver-class-name"
blocked-by: null
closed-reason: null
---

## Context

Rails renders the receiver's own class name in both `inspect` bodies:

- `vendor/rails/v8.0.2/activemodel/lib/active_model/error.rb:199-201` — `"#<#{self.class.name} attribute=#{@attribute}, type=#{@type}, options=#{@options.inspect}>"`
- `vendor/rails/v8.0.2/activemodel/lib/active_model/errors.rb:483-487` — `"#<#{self.class.name} #{inspection}>"`

trails hardcodes the literal instead: `packages/activemodel/src/error.ts` `Error#inspect` emits
`#<ActiveModel::Error …>` and `packages/activemodel/src/errors.ts` `Errors#inspect` emits
`#<ActiveModel::Errors …>`. So a subclass inspects under its parent's name:
`ActiveModel::NestedError` (`nested_error.rb:7`, `packages/activemodel/src/nested-error.ts:11`)
renders `#<ActiveModel::Error …>` where Ruby renders `#<ActiveModel::NestedError …>`, and so does
any user subclass of either class.

The blocker is that a JS class's `name` is unqualified (`Error`, `Errors`, `NestedError`), so
`rbModToS(this.constructor)` (`packages/ruby-compat/src/object.ts`) would answer `Error`. Other
packages carry the qualified name in an invented `static _railsClassName`
(`activerecord/src/relation.ts:274`, `date/src/date.ts:50`), and `ActiveRecord::Core.inspect`
hardcodes `"ActiveRecord::Base"` (`activerecord/src/core.ts:100-104`). The activemodel classes are
already seated on the `ActiveModel` Autoload namespace (`packages/activemodel/src/namespaces.ts`),
whose own `name` is `"ActiveModel"` — the classpath Ruby's `const_set` would give them
(`rb_mod_name`, see `ruby-compat/src/include.ts:115`) is derivable from that seat.

Surfaced while verifying the body pins for `error.rb#inspect` / `errors.rb#inspect`
(`activemodel-verify-and-pin-protocol-bodies`), which converged the interpolated values
(`@type` through `to_s`, `@options.inspect`, `@errors.inspect`) but left the class name literal.

## Acceptance criteria

- [ ] `Error#inspect` and `Errors#inspect` render `self.class.name` from the receiver's class, with no hardcoded `ActiveModel::Error` / `ActiveModel::Errors` literal and no new `_railsClassName`-style static.
- [ ] `new NestedError(base, innerError).inspect()` starts with `#<ActiveModel::NestedError`.
- [ ] `pnpm parity:api:calls` stays green (the bodies call `class` / `name` as Rails does).
