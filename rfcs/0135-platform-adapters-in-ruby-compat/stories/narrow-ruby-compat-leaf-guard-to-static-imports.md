---
title: "The leaf guard narrows from 'names no Node builtin' to 'takes no static Node import', and the __filename ban is settled, before any adapter moves"
status: draft
updated: 2026-09-02
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 200
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0135 moves the seven `*-adapter.ts` files into `ruby-compat`. They cannot
land while the leaf guard is worded as it is, so this story goes first and
moves no adapter.

`scripts/ruby-compat-leaf.ts:36-64` (`moduleSpecifiers`) walks the BUILT output
with the TypeScript AST and records the argument of `require()` and `import()`
alongside static import specifiers, then `nodeBuiltinNamed` flags any that names
a Node builtin. The adapters' Node bootstrap trips it: `fs-adapter.ts:258`
`require("node:module")`, `:276` `req("node:fs")`, `crypto-adapter.ts:301`
`getBuiltinModule("node:crypto")`, `async-context-adapter.ts:90`.

That bootstrap is nonetheless browser-safe, and the guard is checking a proxy
for the property rather than the property. `fs-adapter.ts:265-276`:

```ts
if (typeof globalThis.process === "undefined" || !globalThis.process.versions?.node) return false;
const req = syncBuiltinLoader();   // process.getBuiltinModule, else createRequire()
const nodeFs = req("node:fs");
```

No static `import` and no dynamic `import()` — nothing a bundler resolves. A
browser bundle bails at the `process.versions.node` guard at runtime.

**This story narrows a guard, which is the single most review-sensitive change
in RFC 0135.** `enforce-ruby-compat-leaf-and-browser-freedom` (#7383) exists
because the leaf property previously "held by luck", and this makes its check
weaker. Argue it in the PR body on the merits above; do not present it as
mechanical.

Second half, and it is a hard blocker rather than a judgement call:
`eslint.config.mjs:253-269` bans the bare identifiers `Buffer`, `process`,
`__dirname` and `__filename` in `packages/ruby-compat/src/**`. The adapters read
`globalThis.process` throughout (a property access, which the rule does not
catch), but `syncBuiltinLoader` (`fs-adapter.ts:250-263`) uses **`__filename`**,
which is banned outright. Settle it here — a narrowly-scoped override for the
adapter files, or a rewrite of `syncBuiltinLoader` that does not need it —
rather than discovering it mid-move.

## Acceptance criteria

- `moduleSpecifiers` / the leaf check distinguishes a **static** Node import
  (violation) from a `require()` / `getBuiltinModule()` reached behind a runtime
  guard (allowed), and the JSDoc at `ruby-compat-leaf.ts:1-20` says why in those
  terms.
- A test asserts the new boundary in both directions: a static
  `import "node:fs"` still fails; a guarded `require("node:fs")` passes.
- The `__filename` question is resolved with the chosen shape, and the PR body
  states which and why.
- `scripts/ruby-compat-leaf.test.ts` and `pnpm lint` are green with no adapter
  moved yet.
