---
title: "PathSet#find raises MissingTemplate so find_template callers need no re-raise"
status: ready
updated: 2026-09-06
rfc: "0111-error-class-message-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 50
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionView::PathSet#find` raises `ActionView::MissingTemplate` when no
template matches — that is the whole reason `find` exists beside `find_all`
(`vendor/rails/actionview/lib/action_view/path_set.rb`, reached from
`LookupContext#find` at `lookup_context.rb:128-132`), and every caller of
`find_template` relies on it.

`packages/actionview/src/path-set.ts:108-120` throws a plain
`new Error("Missing template ...")` instead:

```ts
const found = this.findAll(path, prefixes, partial, details, detailsKey, locals);
if (found.length > 0) return found[0];
throw new Error(`Missing template ${String(path)} with prefixes [...]`);
```

so the error carries neither the `MissingTemplate` class nor its `paths` /
`partial` / `details` fields, and a `catch (e) { e instanceof MissingTemplate }`
misses it.

The visible cost is at the call site. `PartialRenderer#find_template`
(`partial_renderer.rb:262-265`) is two lines in Rails because `find_template`
raises for it; the trails port has to call `findAll` and re-raise
`MissingTemplate` itself:

```ts
const template = this.lookupContext.findAll(path, prefixes, true, locals, this.details)[0];
if (!template) {
  const { name, prefix } = this.parsePartialPath(path);
  throw new MissingTemplate(prefix, `_${name}`, format, [], []);
}
```

which is also why that throw passes empty resolver-name and candidate-path
arrays where `LookupContext`'s own missing-template path
(`lookup-context.ts:634-642`) passes `resolverNames()` and
`allCandidatePaths()`. Surfaced in PR #7373.

## Converged shape

`PathSet#find` raises `MissingTemplate` with the resolver names and candidate
paths, as Rails does, and `PartialRenderer#find_template` collapses back to
Rails' two lines calling `lookupContext.find(path, prefixes, true, locals,
this.details)`. `parsePartialPath` loses its only remaining caller there.

## Acceptance criteria

- `PathSet#find` raises `MissingTemplate` (not a plain `Error`), carrying the
  same resolver/candidate detail `lookup-context.ts:634-642` already builds.
- `PartialRenderer#find_template` is `lookupContext.find(...)` with no
  re-raise, mirroring `partial_renderer.rb:262-265`.
- `partial-renderer.test.ts`'s "raises MissingTemplate when partial cannot be
  found" still passes, unrenamed.
- `parity:api:calls` / `parity:api:calls:args` report no new row.
