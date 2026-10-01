---
title: "trails-tsc: read a per-render layout from non-literal render options and layout.call(this, ...)"
status: done
updated: 2026-10-01
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8339
claim: "2026-10-01T16:56:27Z"
assignee: "red-fcbc702b"
blocked-by: null
closed-reason: null
---

## Context

`layoutsOf` (`packages/trails-tsc/src/build-views.ts`, PR trails#8315) reads a per-render layout only from an options OBJECT LITERAL: `this.render("show", { layout: "admin" })`. Two reachable forms are skipped, and the controller is then typed only into its class-level or implied layout:

- options held in a variable or built by a call: `const options = { layout: "admin" }; this.render("show", options)`;
- a literal with a spread: `this.render({ ...options, action: "show" })`.

Rails resolves whatever `options[:layout]` holds at run time (`_layout_for_option`, `vendor/rails/v8.0.2/actionview/lib/action_view/layouts.rb:388-413`), so those renders can use any layout.

The class-level scan has the matching gap: `classMacros` matches `this.layout(...)` / `Klass.layout(...)`, not `layout.call(this, ...)`, which is how a `this`-typed function is called outside a class that carries the static.

## Converged shape

- For a non-literal options argument, read the `layout` property from its checker type: a string-literal type names the layout, `false` contributes nothing, and a wider type (or an argument typed `any` / `unknown`) makes the controller contribute to every layout, as a non-literal `layout:` value already does.
- A spread in the options literal is resolved the same way.
- `classMacros` treats `<macro>.call(<self>, ...)` as a call on `<self>`.

## Acceptance criteria

- [ ] `const options = { layout: "admin" } as const; this.render("show", options)` adds the controller to `layouts/admin`.
- [ ] `this.render("show", options)` with `options: Record<string, unknown>` makes the controller contribute to every layout.
- [ ] `layout.call(this, "application")` in a static block is read as a class-level layout.
- [ ] Tests in `packages/trails-tsc/src/build-views.test.ts`.
