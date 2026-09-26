---
title: "register_detail module_evals the <name> / <name>= accessors (lookup_context.rb:25-33)"
status: draft
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`LookupContext.register_detail`
(`vendor/rails/v8.0.2/actionview/lib/action_view/lookup_context.rb:20-34`) does
three things. trails#8155 ported the first two, recording the proc and
`Accessors.define_method(:"default_#{name}", &block)` (`:24`). The third,
the `module_eval` at `:25-33`, is still missing:

```ruby
def #{name}
  @details[:#{name}] || []
end

def #{name}=(value)
  value = value.present? ? Array(value) : default_#{name}
  _set_detail(:#{name}, value) if value != @details[:#{name}]
end
```

trails (`packages/actionview/src/lookup-context.ts`) hand-writes the `variants` /
`handlers` getter and setter pairs. The `formats=` / `locale` / `locale=` overrides
(`:261-297`) are hand-written in Rails too, because they sit on `LookupContext`
itself above the `Accessors` module. A detail registered later
(`LookupContext.registerDetail("foo", ...)`) gets `defaultFoo()` but no `foo` /
`foo=` accessor.

## Acceptance criteria

- `registerDetail` defines the `<name>` getter (`this._details[name] ?? []`) and
  the `<name>` setter (`isPresent(value) ? Array(value) : this.default<Name>()`,
  `_setDetail` only when the value changed) on an `Accessors` layer beneath
  `LookupContext.prototype`. That lets the class's own `formats` / `locale`
  overrides shadow the generated ones, as Rails' method lookup does.
- The hand-written `variants` / `handlers` accessors are deleted.
- `LookupContext.registerDetail("foo", ...)` gives `ctx.foo` / `ctx.foo = …`.
