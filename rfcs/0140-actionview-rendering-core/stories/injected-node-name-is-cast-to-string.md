---
title: "Injected#name is cast to string though a nested dependency reaches it at runtime"
status: draft
updated: 2026-09-08
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of PR 7628 and left in deliberately, non-blocking.

`Digestor.digest` iterates `dependencies` at the TOP LEVEL only — no flatten —
and pushes each element into an `Injected` node
(`vendor/rails/actionview/lib/action_view/digestor.rb:30-32`). `Injected#digest`
returns `name` itself (`digestor.rb:125-127`). Ruby types nothing, so a nested
array element becomes an array-valued `Injected#name`, is used as a
`digest_cache` Hash key, and is flattened by `Array#join` at
`dependency_digest` (`digestor.rb:97-107`).

trails types `Node#name` as `readonly name: string`
(`packages/actionview/src/digestor.ts`), so the push site needs a cast:

    root.children.push(new Injected(injectedDep as string, null, null));

and `finder.digestCache()` is `Map<string, string>`
(`packages/actionview/src/lookup-context.ts:320`), so a nested-array name used
as a key relies on `Map`'s reference-identity semantics rather than the declared
key type.

The RUNTIME behaviour is correct and matches Ruby — a JS `Map` accepts any key
as Ruby's `Hash` does, and the nested value is flattened at the join (fixed in
7628 with `.flat(Infinity)`). Only the declared type is narrower than the values
that can flow through it. `Digestor.digest`'s one production caller,
`CacheHelper#digest_path_from_template`
(`vendor/rails/actionview/lib/action_view/helpers/cache_helper.rb:257`), passes a
flat `view_cache_dependencies` array, so nothing exercises it today.

## Converged shape

Decide between the two honest options and take one; the current `as string` is
neither.

1. Widen `Node#name` to the union the Ruby field actually holds and absorb the
    consequences at the two readers — the `digestCache()` key and `to_dep_map`'s
    computed object key. Note `to_dep_map` is safe by construction: only a node
    WITH children uses `name` as a key, and an `Injected` never has children.
2. Keep `name: string` and narrow `DigestorOptions["dependencies"]` back to a
    flat list — but only with evidence that Rails' own callers cannot nest,
    which `digestor.rb:20`'s `dependencies.flatten` argues against, since a
    recursive flatten exists precisely because nesting is expected.

Option 1 is the one that keeps the port faithful. Whichever is taken, no
`@noRailsEquivalent` receipt fits — that tag marks extra surface, and
`Node#name` has a Ruby counterpart at `digestor.rb:81`.

## Acceptance criteria

- [ ] No `as string` cast at the `Injected` construction site.
- [ ] A test pins a nested dependency end to end: same digest as the flattened
      equivalent, and distinct from an unrelated set (the existing
      `packages/actionview/src/template/digestor.trails.test.ts` cases).
- [ ] `pnpm typecheck` and `pnpm parity:api --package actionview` unchanged.
