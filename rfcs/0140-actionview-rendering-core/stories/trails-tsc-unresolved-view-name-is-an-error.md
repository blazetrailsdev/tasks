---
title: "trails-tsc: a bare name no local, helper or global answers is an error once every render site is resolved"
status: done
updated: 2026-10-01
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: 1
pr: trails#8308
claim: "2026-09-30T23:10:30Z"
assignee: "strong-parameters-expect-returns-unknown"
blocked-by: null
closed-reason: null
---

## Context

A compiled view resolves each bare name through `Scope<K>` (`scopeTypes` in `packages/trails-tsc/src/plugins/tse.ts`, PR #8296): the object locals, then the view, then `globalThis`. Anything else falls back to `never` in a strict-locals template and to `any` otherwise. So `<%= psot.title %>` in a non-strict template type-checks.

In Rails, a non-strict template binds only the locals its render passed (`Template#locals_code`, `vendor/rails/v8.0.2/actionview/lib/action_view/template.rb:561-571`). The template is compiled once per distinct locals set (`UnboundTemplate#bind_locals`, `vendor/rails/v8.0.2/actionview/lib/action_view/unbound_template.rb:20-38`). Any other bare name is a method call on the view and raises `NameError`.

## Converged shape

`any` stands in only for locals that can't be analysed. The fallback is `never`, as for strict locals, whenever `bindCheckedTypes` (`packages/trails-tsc/src/build-views.ts`) resolved every render site of the template:

- the template is a partial, and every `render(...)` that reaches it names it with a string literal and passes a typeable hash (or none), or
- the template is a non-partial action template (it receives no implicit locals).

The fallback stays `any` only for a partial that some unresolved render site may reach, such as a non-literal partial name.

## Acceptance criteria

- [ ] `<%= psot.title %>` in the scaffold's `_post` / `_form` / `index` fails `pnpm build` with an error at the `.tse` line.
- [ ] A partial rendered with `render(someVariable)` still falls back to `any`.
- [ ] Tests in `packages/trails-tsc/src/build-views.test.ts` and `plugins/tse.test.ts`.
