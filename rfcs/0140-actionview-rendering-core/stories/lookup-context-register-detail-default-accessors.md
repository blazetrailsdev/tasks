---
title: "lookup-context-register-detail-default-accessors"
status: draft
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`LookupContext.register_detail` (`vendor/rails/v8.0.2/actionview/lib/action_view/lookup_context.rb:21-35`)
defines `default_#{name}` for every registered detail: `default_locale`,
`default_formats`, `default_variants` and `default_handlers`. Each generated
`#{name}=` setter falls back to its own `default_#{name}`.

trails (`packages/actionview/src/lookup-context.ts`) has `defaultFormats()`
only. The `locale`, `variants` and `handlers` setters read `DEFAULT_PROCS.x()`
directly. `findTemplate` is also a delegating method; Rails has it as
`alias :find_template :find` (`:133`), which is
`LookupContext.prototype.findTemplate = LookupContext.prototype.find` with a
`declare`.

## Acceptance criteria

- [ ] `defaultLocale()`, `defaultVariants()` and `defaultHandlers()` exist, and
      each setter falls back through its own accessor.
- [ ] `findTemplate` is the prototype alias of `find`, not a wrapper method.
