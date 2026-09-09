---
rfc: "0104-twitter-app-full-stack-integration"
title: "First full-stack trails application: route to rendered HTML"
status: active
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
  - rack
clusters: []
---

## Sunset (2026-09-08)

**This RFC's charter is met and it is being retired.** It set out to make one
application boot route -> controller -> view -> HTML; `execute-tse-templates`
(#7281) and `wire-implicit-render-into-controller-dispatch` (#7305) closed the
two bottlenecks the sections below name, the `server/application.ts` split is
gone, and 102 of its 188 stories are done.

What kept it growing was not its charter. Of its 77 open stories at sunset, 3
concerned an example application; the other 74 were per-member fidelity
convergences against `packages/actionpack/**` and `packages/trailties/**` that
landed here because **neither package had a `<package>-surfaced-deviations`
bucket** — the destination CLAUDE.md names for exactly that kind of finding.
0104 became one by default, and reached a size no single active RFC can be
scheduled as.

Every open story was verified against `main` (`9c54a7962f`) before rehoming.
**None had a falsified premise**: `resweep-rfc-0104-story-context-against-main`
(#7437) had already swept the set on 2026-09-03. So the sunset rehomes rather
than drops.

| Destination                             | Stories | Theme                                                                          |
| --------------------------------------- | ------- | ------------------------------------------------------------------------------ |
| **0141-actionpack-surfaced-deviations** | 27      | ActionController runtime, the test harness, http + middleware                  |
| **0142-trailties-surfaced-deviations**  | 25      | boot / engine / railties, generators + CLI                                     |
| **0139-actiondispatch-journey-parity**  | 8       | routing: mapper, route-set, url helpers, the invented `Routing::Route`         |
| **0140-actionview-rendering-core**      | 4       | controller-side `render_to_body`, partial prefixes, the two asset-helper seeds |
| **0123-blocked-convergence-holding**    | 6       | blocked on Zeitwerk / ActionMailer / `I18n::Railtie` / `TestFixtures`          |
| **0023-surfaced-deviations**            | 3       | example-app and CI hygiene                                                     |
| closed as duplicates                    | 4       | see below                                                                      |

Closed rather than carried, each a duplicate of a better-sited survivor whose
unique acceptance criteria were folded in first:

- `journey-route-verb-carries-all-sentinel` -> 0139's `route-verb-all-sentinel-vs-empty-string`
- `port-application-env-config` -> `port-application-env-config-for-action-dispatch-keys`
- `mime-type-register-collapses-lookup-and-extension-lookup` -> `mime-registry-splits-into-lookup-and-extension-lookup`
- `journey-route-app-seated-after-construction` -> `routing-route-class-has-no-rails-counterpart`

Everything below this section is the original 2026-08-13 charter and its
2026-08-30 re-ranking, kept as the record of what the RFC set out to do.

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

### The foundation is not on `main` (2026-08-30)

"What booted" above describes the tree of branch
`twitter-app-full-stack-11518d` (commit `5fbfe1886`, PR #6470 — **closed
without merging**), not `main`. On `main`, `Tse#render` still throws
"execution lands in Phase 2c", `metal/implicit-render.ts` is still imported by
nothing, and there is no `examples/twitter-app`. Two stories now carry that
work — `execute-tse-templates` (priority 5) and
`wire-implicit-render-into-controller-dispatch` (6) — and they come before
everything else, because every story about template scope, helpers or layouts
is unreachable until a `.tse` template can execute at all. `5fbfe1886` is a
working reference for both; it is not authoritative on fidelity.

### Ranked order (2026-08-30)

`priority:` is now set on every open story (lower N first), in five bands:

- **5–6 — make a template execute.** See the section above.
- **10s — serve a real request.** The Rack/Node handler, helpers in `.tse`
  scope, a TypeScript loader for app code, session/flash, `has_secure_password`,
  static files. Without these an app boots but cannot render a page a user
  would recognise, log in, or load its own stylesheet.
- **20s — boot completeness and correct output.** The remaining `Engine` /
  `Finisher` initializers, `CollectionProxy#length`, the date helpers'
  `Temporal.Instant` gap, `ViewPaths` on `ActionController::Base`, the
  `LookupContext` resolver unification, `db migrate`.
- **30s — `trails new` output that runs.** Generator fidelity: model base
  class, generator lookup, the authentication generator's stubs, the sqlite
  `storage/` path, `--name`, `load_defaults` / `autoload_lib` / `load_server`.
- **40s — convergences on paths that already work.** `Metal.dispatch`, the
  per-route dispatcher, `Engine.endpoint`, `draw_paths`,
  `railties_initializers`, `Configuration#root`, `Static`'s positional path,
  `require_application!`, the two Rack request/input gaps.
- **50s — large or peripheral.** `ExecutionWrapper`/`Reloader` and the routes
  reloader hook that depends on it, ESM adapter priming, scope typing,
  `trails-tsc`, the unused-routes command.
