---
title: "The virtualized .tse TypeScript emits a bare yield, so a layout's file does not parse"
status: draft
updated: 2026-09-06
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`trails-tsc-views build` emits a `.ts` file per template under `.trails/views`
— the file an editor and a type-check pass read — and the one it writes for a
layout does not parse. `<%= yield %>` becomes a bare `yield` expression inside
an ordinary (non-generator) function:

```ts
// .trails/views/layouts/application.html.tse.ts:33, from trailmap's layout
export default function render(context: RenderContext, locals: Record<string, unknown>): SafeString {
  const _ob = context.outputBuffer;
  _ob.safeAppend("...<main class=\"site-main\">...");
  _ob.append(yield);
  ...
}
```

```text
$ npx tsc --noEmit .trails/views/layouts/application.html.tse.ts
error TS1214: Identifier expected. 'yield' is a reserved word in strict mode.
error TS2304: Cannot find name 'yield'.
```

Every other identifier the emitter binds resolves — `render`, `_ob`,
`context` — and the emitted `RenderContext` interface in the same file even
declares the member it should have used:

```ts
// .trails/views/layouts/application.html.tse.ts:14
yield(section?: string): SafeString;
```

so the fix is to emit `context.yield()` (or `_ob.append(context.yield())`) for
`<%= yield %>`, the way `context.render({...})` is emitted for `<%= render
... %>`.

Runtime is unaffected — the RUNTIME path is `Handlers::Tse#call`, which wraps
the compiled body in `with (this)` where a `yield` getter is in scope
(`packages/actionview/src/template/handlers/tse.ts`). This is the
virtualized-for-TypeScript emitter only, which is why it has gone unnoticed:
`.trails` is gitignored and outside the app's `tsconfig.json` `include`, so
`pnpm build` never reads it.

Found writing trailmap's application layout (trailmap PR #7) — the first
layout in the proving ground with a `<%= yield %>` in it.

## Acceptance criteria

- The emitted `.trails/views/**/*.tse.ts` for a template containing `<%= yield
%>` type-checks clean under the app's own `tsconfig.json`.
- `<%= yield "sidebar" %>` emits the section argument through the same
  `yield(section?)` member.
- A test compiles an emitted layout with `tsc` and asserts zero diagnostics, so
  a future emitter change cannot regress the file back to an unbound
  identifier.
