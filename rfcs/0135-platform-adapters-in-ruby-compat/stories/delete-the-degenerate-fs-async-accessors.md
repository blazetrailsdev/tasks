---
title: "getFsAsync/getPathAsync and their activesupport priming seat are deleted once the async bootstrap is gone"
status: draft
updated: 2026-09-03
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0135's `move-fs-adapter-into-ruby-compat-as-a-backend-contract` (#7422)
deleted `tryAutoRegisterNodeAsync`, because its `await import("node:fs")` is a
dynamic specifier the narrowed leaf guard (`scripts/ruby-compat-leaf.ts`) still
counts as a violation. `getFsAsync` / `getPathAsync`
(`packages/ruby-compat/src/fs-adapter.ts:296-305`) survived the move only as
call-site compatibility: both are now `async` wrappers that return
`resolve().fs` / `resolve().path`, i.e. exactly what the sync `getFs()` /
`getPath()` already return. Roughly 50 call sites `await` them for nothing.

Three loose ends follow, and they retire together once
`unexempt-file-and-dir-from-core-class-receivers` has deleted `getFs()` and
`getPath()`:

1. **The async pair itself.** With no async bootstrap behind it there is no
   shape left for it to have; the `File` / `Dir` surface
   (`port-file-and-dir-classes-onto-the-fs-backend`) is what call sites should
   be reaching for by then.
2. **`packages/activesupport/src/node.ts:23-30`** still lists `getFsAsync()`
   and `getPathAsync()` in its `Promise.all` priming block. The file's own
   docstring (amended in #7422) already records that priming buys the fs/path
   seat nothing post-move; the two lines go when the functions do.
3. **`resolve()`'s error message** (`fs-adapter.ts:281-283`) tells the caller to
   `import '@blazetrails/activesupport/node'`. That is correct only while
   `node.ts` lives in activesupport. Once `move-crypto-adapter-into-ruby-compat`
   and `move-os-http-child-process-and-async-context-adapters` have emptied it,
   the message names a module that registers nothing this adapter needs, and it
   should name whatever the leaf's own registration entry point is by then.

No Rails counterpart is at stake — `fs-adapter.ts` is the platform backend
contract, not a ported class — so this is dead-surface removal, not a fidelity
convergence.

## Acceptance criteria

- `getFsAsync` and `getPathAsync` are gone from `packages/ruby-compat/src/fs-adapter.ts`
  and from `packages/ruby-compat/src/index.ts`, with every call site converged
  onto the sync accessor or the `File` / `Dir` surface — not onto a new async
  wrapper.
- `packages/activesupport/src/node.ts` no longer primes the fs/path pair, and
  its docstring loses the paragraph explaining why it did.
- `resolve()`'s "No filesystem adapter configured" message names a module that
  still exists and still registers an fs backend.
- `pnpm parity:api:extra:gate` green with no mark change (`ruby-compat` total
  falls or holds; it never rises), and `pnpm build` / `typecheck` / `lint` green.
