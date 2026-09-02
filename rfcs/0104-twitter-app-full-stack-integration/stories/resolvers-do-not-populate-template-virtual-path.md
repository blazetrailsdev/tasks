---
title: "Resolvers do not populate Template#virtualPath, so the compiled method falls back to the identifier"
status: in-progress
updated: 2026-09-02
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["actionview"]
deps: ["helper-methods-not-in-tse-scope"]
deps-rfc: []
est-loc: 90
priority: null
pr: 7376
claim: "2026-09-02T01:16:08Z"
assignee: "authentication-generator-emits-comment-stubs"
blocked-by: null
closed-reason: null
---

## Context

`Template#virtual_path` is what Rails bakes into a compiled template method —
`compiled_source` emits `@virtual_path = #{@virtual_path.inspect};`
(`vendor/rails/actionview/lib/action_view/template.rb:461`) — and resolvers
always populate it: `Resolver#build_template` passes
`virtual_path: template_path.virtual` (`actionview/lib/action_view/template/resolver.rb`),
derived from the `TemplatePath` the lookup produced.

trails' resolvers do not. `FileSystemResolver#find`
(`packages/actionview/src/resolver/file-system-resolver.ts`) and the test
resolvers construct `Template` with `identifier` and no `virtualPath`, so
`Template#virtualPath` is usually `null`. PR #7285 therefore had to fall back:

```ts
// packages/actionview/src/template/handlers/tse.ts
const virtualPath = context.template?.virtualPath ?? context.template?.identifier ?? null;
```

The identifier is an absolute or resolver-relative path, not the virtual path,
so `Base#virtualPathPrefix` (`packages/actionview/src/base.ts`) — which derives
a nested partial's default prefix from it — can compute a prefix off the wrong
string whenever the two differ. They happen to coincide for the in-memory
resolvers used in tests, which is why nothing fails today.

## Converged shape

Have the resolvers set `virtualPath` when they build a `Template`, from the
template path they already matched on (`TemplatePath#virtual`,
`template/resolver.rb`), and drop the `?? identifier` fallback in `tse.ts` so
the compiled method emits exactly what Rails emits.

## Acceptance criteria

- `FileSystemResolver` (and any sibling resolver that builds a `Template`) sets
  `virtualPath`.
- The `?? context.template?.identifier` fallback in
  `template/handlers/tse.ts` is deleted.
- A template resolved from disk whose identifier differs from its virtual path
  compiles with the virtual path, and a nested bare partial inside it resolves
  against the virtual path's prefix.
