---
title: "registerDetail defines default_<name> readers, as lookup_context.rb:24 does"
status: in-progress
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
cluster: null
packages: ["actionview"]
deps: []
deps-rfc: []
est-loc: 60
priority: 10
pr: trails#8155
claim: "2026-09-26T18:02:02Z"
assignee: "mapper-root-ships-only-one-of-two-arms"
blocked-by: null
closed-reason: null
---

## Context

`LookupContext.register_detail(name, &block)` (`vendor/rails/actionview/lib/action_view/lookup_context.rb:20-34`) does three things for every registered detail (`locale`, `formats`, `variants`, `handlers`, `:47-51`):

- records the default proc in `Accessors::DEFAULT_PROCS`;
- defines `default_#{name}` from that proc (`Accessors.define_method(:"default_#{name}", &block)`, `:24`);
- `module_eval`s the `#{name}` reader and a `#{name}=` writer that falls back to `default_#{name}` (`:25-33`).

trails' `registerDetail` (`packages/actionview/src/lookup-context.ts:19-22`) only records the proc. The readers and writers are hand-written per detail, and their fallbacks read `DEFAULT_PROCS.x()` directly. trails#8140 hand-ported `LookupContext#defaultFormats` alone, because `TemplateRenderer#resolveLayout` calls `@lookup_context.default_formats` (`vendor/rails/actionview/lib/action_view/renderer/template_renderer.rb:105`). `defaultLocale`, `defaultVariants` and `defaultHandlers` do not exist, and a detail registered later gets no `default_*` at all.

`parity:api` cannot see these, because they are `define_method`-generated. It scores `defaultFormats` as "moved".

## Converged shape

`registerDetail` defines `default<Name>` on `LookupContext.prototype` from the proc, as `lookup_context.rb:24` does. The four registered details' setters fall back through `this.default<Name>()` (`:30-31`), not `DEFAULT_PROCS[name]()`. The hand-written `defaultFormats` becomes the generated one.

## Acceptance criteria

- `ctx.defaultLocale()`, `defaultFormats()`, `defaultVariants()` and `defaultHandlers()` exist and return the registered default.
- `LookupContext.registerDetail("foo", ...)` gives `ctx.defaultFoo()`.
- Each detail setter's blank-value fallback calls its `default*` method.
