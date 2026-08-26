---
title: "configAccessor is ported into module-ext.ts, but Rails declares it private on Configurable::ClassMethods"
status: draft
updated: 2026-08-26
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #7084 while enrolling `activesupport` in
`unbacked-internal-needs-receipt` (RFC 0121).

`configAccessor` lives in `packages/activesupport/src/module-ext.ts`, whose Rails
counterpart is `activesupport/lib/active_support/core_ext/module.rb`. Rails does
not define it there. It is a private method on
`ActiveSupport::Configurable::ClassMethods`:

```ruby
# activesupport/lib/active_support/configurable.rb:111
def config_accessor(*names, instance_reader: true, instance_writer: true, instance_accessor: true, default: nil) # :doc:
  ...
end                       # :128
private :config_accessor  # :129
```

Because the port sits in the wrong file, the privates manifest — which keys a
private name by the `.rb` it is declared in — cannot back the `@internal` on it,
and PR #7084 had to write a `@noRailsEquivalent CONVERGEABLE` receipt saying
exactly that. The receipt is the debt; this story is the convergence.

Rails' `Configurable` is otherwise unported: there is no
`packages/activesupport/src/configurable.ts` today. Check
`scripts/api-compare/unported-files/` before assuming the whole module is in
scope — the minimum this story needs is the one method to live at its Rails
address.

Note the current body also just delegates to `mattrAccessor`, where Rails'
`config_accessor` reads and writes `config.<name>` through `Configurable`'s own
config object (`configurable.rb:112-127`). Moving the file without porting the
body would leave a second, silent deviation — port the body from the Ruby while
the file is open.

## Converged shape

- Add `packages/activesupport/src/configurable.ts` mirroring
  `activesupport/lib/active_support/configurable.rb`, with `configAccessor` on
  the `ClassMethods` half, ported from `configurable.rb:111-128` rather than
  delegated to `mattrAccessor`.
- Re-export or re-point every current caller of `configAccessor`.
- Delete the `@noRailsEquivalent CONVERGEABLE` receipt in `module-ext.ts`; the
  manifest then backs the bare `@internal` at the new address.

## Acceptance criteria

- [ ] `configAccessor` is declared in the TS file that maps to
      `active_support/configurable.rb`, and `eslint/rails-private-methods.json`
      backs it there.
- [ ] The `module-ext.ts` receipt citing `configurable.rb:111-128` is deleted and
      `pnpm exec eslint --no-inline-config -c eslint/rails-private-jsdoc.config.mjs
    "packages/activesupport/src/**/*.ts"` is clean.
- [ ] The body mirrors `configurable.rb:111-128` — same names, same kwargs and
      defaults, same `NameError` message on an invalid attribute name.
- [ ] `pnpm exec tsx scripts/api-compare/extra-surface.ts` exits 0 and
      `pnpm parity:api` deltas are non-negative.
