---
title: "FileSystemResolver#path is a method where Rails has attr_reader :path"
status: done
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8132
claim: "2026-09-26T03:02:03Z"
assignee: "journey-extra-surface-residue"
blocked-by: null
closed-reason: null
---

## Context

`FileSystemResolver#path` is ported as a zero-arg **method**
(`packages/actionview/src/template/resolver.ts:221-224`):

```ts
/** Rails' `attr_reader :path`. */
path(): string {
  return this._path;
}
```

Rails declares it `attr_reader :path`
(`vendor/rails/actionview/lib/action_view/template/resolver.rb`, on
`FileSystemResolver`), and CLAUDE.md's "Generated attribute readers are
properties" section settles that a zero-arg Ruby reader ports as an accessor
property, never as a method the caller has to invoke.

Surfaced by review on #7353: `RouteInfo#template_missing?`
(`railties/lib/rails/commands/unused_routes/unused_routes_command.rb:33`) is
`File.join(root.path, ...)` in Ruby, and the port read `root.path` as a field —
which silently yielded a function reference. The port was corrected to
`root.path()`, but every call site now spells a reader as a call, which is the
deviation this story converges.

## Converged shape

- `FileSystemResolver#path` is a `get path(): string` accessor.
- Every reader call site drops the parens — including
  `packages/trailties/src/commands/unused-routes.ts` (`viewPath`, and the
  `ViewPathRoot` structural type it declares, which becomes `{ path: string }`).
- `packages/trailties/src/commands/unused-routes.trails.test.ts`'s
  "template covers the missing action" case keeps building a real
  `ActionView.PathSet` / `FileSystemResolver`, so the shape stays checked.
