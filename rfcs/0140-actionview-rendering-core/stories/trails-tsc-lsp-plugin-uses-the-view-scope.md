---
title: "trails-tsc: the tsserver plugin virtualizes .tse with the same view scope as pnpm build"
status: done
updated: 2026-10-01
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8341
claim: "2026-10-01T17:10:27Z"
assignee: "active-support-test-case-carries-setup-and-teardown-instance-side"
blocked-by: null
closed-reason: null
---

## Context

PR #8296 gave compiled views a typed scope: `virtualizeTseWithDeltas(source, scope)` in `packages/trails-tsc/src/plugins/tse.ts`, fed by `templateScope` / `bindCheckedTypes` in `packages/trails-tsc/src/build-views.ts`. Only `trails-tsc-views build` and the `trails-tsc` CLI pass that scope.

The tsserver plugin (`packages/trails-tsc/src/lsp-plugin.ts`, the `./ts-plugin` export the generated tsconfig enables) and `createTsePlugin` still call `virtualizeTse(source)` with no scope. The editor therefore shows the old unscoped shim: helpers, locals and ivars are unknown there, and `pnpm build`'s TS2345 on `readingTime(post.title)` never appears in the editor.

Rails resolves the same names in both places, because a template is only ever compiled one way (`ActionView::Template#compile`, `vendor/rails/v8.0.2/actionview/lib/action_view/template.rb`).

## Converged shape

The editor host virtualizes a `.tse` file with the same scope `buildViews` computes: the view type, object and passed locals, and controller members.

Either the plugin reads the scope from the last `.trails/views/<path>.tse.ts` shim, or it calls the pass-1 `templateScope` directly, with the checker-pass results cached by `trails-tsc-views dev`. One virtualization path serves both hosts.

## Acceptance criteria

- [ ] In an editor with the ts-plugin, `<%= readingTime(post.title) %>` in the scaffold's `_post.html.tse` shows TS2345 at the same line and column `pnpm build` reports.
- [ ] Helper names, `this.<ivar>` and `form.` completions come from the typed scope.
- [ ] Test in `packages/trails-tsc/src/lsp-plugin.test.ts`.
