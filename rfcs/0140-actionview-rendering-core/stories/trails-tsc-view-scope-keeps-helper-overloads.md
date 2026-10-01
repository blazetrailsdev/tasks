---
title: "trails-tsc: a bare helper in a .tse view keeps every overload, not OmitThisParameter's last"
status: ready
updated: 2026-10-01
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

A compiled view declares each bare name as `let name!: Scope<"name">` (`scopeTypes` in `packages/trails-tsc/src/plugins/tse.ts`, PR #8296). `Scope` resolves a view member through `OmitThisParameter<View[K]>`, because ActionView helpers are `this`-typed functions and the runtime calls them with the view as `this` (`with (this)` in `Template#compiled_source`, `packages/actionview/src/template.ts`).

For an overloaded `this`-typed helper, `OmitThisParameter` keeps only the last overload. Calls matching an earlier overload then report a false error, and calls matching only the last one lose that overload's typing.

Rails resolves the helper as the view's method, with its full signature: `ActionView::Base` includes the helper modules (`vendor/rails/v8.0.2/actionview/lib/action_view/base.rb:158`).

## Converged shape

Scope a view member without erasing overloads. Declare the view scope as a `this` binding the body reads through, e.g. emit `const { formWith, … } = this as unknown as View` where each helper's `this` parameter is satisfied by the view itself. Alternatively, map each overload's `this` away with a distributive overload-preserving helper type. Every overload of a helper is then callable bare.

## Acceptance criteria

- [ ] A helper with two `this`-typed overloads accepts both call shapes bare in a `.tse` template.
- [ ] Test in `packages/trails-tsc/src/plugins/tse.test.ts`.
