---
rfc: "0104-twitter-app-full-stack-integration"
title: "First full-stack trails application: route to rendered HTML"
status: draft
created: 2026-08-13
updated: 2026-08-13
owner: "@deanmarano"
packages:
  - actionpack
  - actionview
  - trailties
  - tse-compiler
  - activerecord
  - activerecord-cli
clusters: []
---

## State of play

`examples/twitter-app` is the first application in this repo to boot the
trails stack end to end: an HTTP request enters, the router matches, a
controller dispatches, a `.tse` template renders inside a layout, and HTML
comes back. Before this work, **nothing in the repo had ever done that**.
Outside `packages/trailties/src/application.ts` itself, no file referenced
`Trailties.Application`; there was no example app and no test anywhere that
went route → controller → view → HTTP.

### What booted

Route matching, controller dispatch, filters, strong params, `redirectTo`,
cookies/session/flash middleware, and — after the fixes below — `.tse`
template execution with layouts and partials. The pieces were mostly ported
and mostly correct in isolation.

### What didn't

The failures were almost entirely **integration** failures, not porting
failures. Individually-correct modules had never been connected:

1. **`Tse#render` threw unconditionally.** `.tse` compiled to a JS module
   string and nothing ever executed it. This was the hard wall — no trails
   app could render a single template.
2. **`ImplicitRender` was dead code.** `metal/implicit-render.ts` was
   imported by nothing, so a Rails-shaped `def index; end` returned an empty 200.
3. **The `trailties` package had no `build` script**, so `bin/trails.js`
   imported a `dist/` that nothing produced. The CLI could not run at all.
4. **The generated app never touches `Trailties.Application`.** `trails new`
   emits a `config/application.ts` that exports a plain object literal.
   `Bootstrap`, `Finisher`, `Initializable`, and the middleware stack are
   not in the boot path of a generated app.
5. **`Application#initializers` never splices `Finisher`.** The comment says
   "Finisher splicing lands in PR 2.5b". So even an app that did subclass
   `Trailties.Application` would not build a middleware stack or load routes.

### The real bottleneck

**It is not ActionView's parity percentage — it is that trails has two
disconnected application stacks, and the Rails-faithful one is not the one
that serves requests.**

- `packages/trailties/src/application.ts` is the faithful `Rails::Application`
  port: `Engine`, `Trailtie`, `Bootstrap`, `Finisher`, `Initializable`. It has
  tests. Nothing routes an HTTP request through it.
- `packages/trailties/src/server/application.ts` is a bespoke class with the
  same name and no Rails counterpart: a hand-rolled dispatcher, controller
  resolution by filename glob, its own `LookupContext` wiring. It is what
  `trails server` actually runs, and it is what this example app runs.

ActionView has the same split: an AOT path (`trails-tsc-views build` →
`.trails/views/*.tse.js` + a lazy-thunk manifest) and a runtime path
(`LookupContext` + resolvers + handlers). Nothing at runtime consumes the AOT
manifest; `TemplateRegistry` is types-only. The controller render path goes
through the runtime side, which is why `Tse#render` was the blocker.

So ActionView's 9.6% API parity overstates the problem in one direction and
understates it in another. The template layer needed one real fix
(execution) to become usable. The _application_ layer needs a convergence:
one `Application`, the ported one, actually serving requests.

### Priorities

The story set below is ordered around that. The highest-value work is not
porting more ActionView surface — it is deleting
`trailties/src/server/application.ts` in favour of booting
`Trailties.Application`, which means splicing `Finisher`, making
`trails new` generate an app that subclasses `Application`, and moving
controller/route loading into initializers where Rails puts it.
