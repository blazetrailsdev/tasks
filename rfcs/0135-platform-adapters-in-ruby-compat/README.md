---
rfc: "0135-platform-adapters-in-ruby-compat"
title: "The platform adapters move into ruby-compat: one home for the fs/crypto/os/process/http/child-process/async-context seams, registration included, so a leaf is the only thing rack depends on"
status: draft
created: 2026-09-02
updated: 2026-09-02
owner: "@deanmarano"
packages:
  - ruby-compat
  - activesupport
  - rack
  - rack-session
  - actionpack
  - actionview
  - activerecord
  - trailties
clusters:
  - fidelity
  - tooling
related-rfcs:
  - "0129-ruby-compat"
  - "0133-rack-session-gem-port"
  - "0089-corelib-primitives"
priority: 2
---

# RFC 0135 — the platform adapters live in `@blazetrails/ruby-compat`

## Summary

Seven `*-adapter.ts` files in `packages/activesupport/src` (1887 LOC) are the
seam through which trails reaches `node:fs`, `node:crypto`, `node:os`,
`process`, `node:http`, `node:child_process` and `AsyncLocalStorage` without any
package statically importing them. **They move into `ruby-compat`, registration
and Node bootstrap included.**

This RFC reverses RFC 0129 **non-goal 2**, which ruled the `*-adapter.ts` family
out of `ruby-compat` on the grounds that it is "the Node platform adapter, which
is not Ruby semantics". That reasoning is sound about what the adapters _are_
and wrong about what follows from it, because RFC 0129's own ledger records the
cost: two of its stories are `blocked` on exactly this question, and the story
meant to settle it was closed without shipping.

## Motivation

### 1. The deferral has a measured price, paid in three places

- `move-tempfile-to-ruby-compat` — **blocked**. Its reason: "Tempfile imports
  `getFs`/`getPath` (fs-adapter, 483 LOC), `getOs` (os-adapter, 158) and
  `getCrypto` (crypto-adapter, 393) from activesupport. ruby-compat is a leaf …
  The move needs a home for the fs/os/crypto seat decided first."
- `move-monitor-mixin-to-ruby-compat` — **blocked** on
  `async-context-adapter.ts`, the same wall.
- `packages/rack` and `packages/rack-session` both declare
  `@blazetrails/activesupport` in `dependencies`. The **Ruby `rack` gem has no
  runtime dependencies at all**, so this is a fidelity deviation with nothing
  tracking it. Its remaining content, once RFC 0129's re-export shims are gone,
  is _entirely_ adapter symbols: `getFs` (5 files), `getPath` (5), `getCrypto`
  (2), `FsStatResult`, `cwd`, `platform`, `stderr`, `HttpRequest` /
  `HttpResponse` / `HttpServer` / `getHttpAsync`.

`ruby-named-file-dir-fileutils-facade` was to decide this and was **closed, not
shipped**; its closure note states that "the platform-adapter/leaf-rule question
(RFC 0129 non-goal 2) stays open and unsettled". So the question is not deferred
to an owner — it has no owner.

### 2. The registry/backend split this needs is already built, seven times

`move-monitor-mixin-to-ruby-compat`'s blocker note claims "no
`registerFsBackend()`-shaped precedent exists to copy". That is wrong on the
facts. Every adapter already exposes a registration seam:

| adapter                    | LOC | registration                                |
| -------------------------- | --- | ------------------------------------------- |
| `fs-adapter.ts`            | 483 | `registerFsAdapter(name, fs, path)` :161    |
| `crypto-adapter.ts`        | 393 | `registerCryptoAdapter(name, adapter)` :282 |
| `process-adapter.ts`       | 393 | `registerProcessAdapter(adapter)` :170      |
| `child-process-adapter.ts` | 212 | `registerChildProcessAdapter(...)` :54      |
| `os-adapter.ts`            | 158 | `registerOsAdapter(name, adapter)` :31      |
| `async-context-adapter.ts` | 140 | `registerAsyncContextAdapter(...)` :71      |
| `http-adapter.ts`          | 108 | `registerHttpAdapter(name, adapter)` :44    |

There is no architecture to invent. This is a file move plus an import rewrite.

### 3. The browser property survives the move — the guard's wording does not

The reason the adapters look un-leaf-like is `tryAutoRegisterNode()`, which
lazily resolves the Node backend so callers never have to register one. It never
names a builtin in a bundler-visible position (`fs-adapter.ts:250-276`):

```ts
if (typeof globalThis.process === "undefined" || !globalThis.process.versions?.node) return false;
const req = syncBuiltinLoader(); // process.getBuiltinModule, else createRequire()
const nodeFs = req("node:fs");
```

No static `import`, no dynamic `import()`. A browser bundle resolves zero Node
modules and bails at the `process.versions.node` guard at runtime. The property
RFC 0129's leaf rule protects is therefore **preserved** by the move.

What is not preserved is the _current wording_ of the guard.
`scripts/ruby-compat-leaf.ts:36-64` walks the built output's AST and records
`require()` and `import()` argument strings alongside static specifiers, so
`require("node:module")` counts as a violation today. The guard must narrow to
**"takes no static Node import"**.

**This is the part of this RFC that most deserves review.** A guard is being
weakened, and `enforce-ruby-compat-leaf-and-browser-freedom` (#7383) exists
precisely because the leaf property previously "held by luck". The narrowing is
defensible only because the runtime `process.versions.node` guard is what
actually delivers browser-safety and the AST check was a proxy for it — but it
is a narrowing, and it should be argued in the PR, not assumed.

## Design

### The lanes

1. **The guard first.** Narrow `ruby-compat-leaf.ts` to static imports, and
   settle the ambient-global question: `eslint.config.mjs:253-269` bans the bare
   `Buffer` and `process` identifiers in `ruby-compat/src/**`. The adapters read
   `globalThis.process` throughout (a property access, not the banned global),
   but `syncBuiltinLoader` also touches `typeof require` and `__filename`. Audit
   before moving, not after.
2. **One adapter per story, smallest first.** `http-adapter` (108) and
   `os-adapter` (158) prove the shape; `fs-adapter` (483) and
   `crypto-adapter` (393) are the load-bearing ones and come last.
3. **Each move leaves a re-export shim in activesupport**, and each move's own
   acceptance criteria delete the shims of the moves _before_ it. RFC 0129
   learned this the expensive way — see below.
4. **`no-node-builtins.mjs` retargets.** Its replacement table
   (`eslint/no-node-builtins.mjs:9-28`) hard-codes `@blazetrails/activesupport`
   as the fix for `fs` / `path` / `crypto`. After the move that advice is wrong
   everywhere, not just inside ruby-compat — the per-package exception
   `enforce-ruby-compat-leaf-and-browser-freedom` had to carve out disappears.
5. **rack and rack-session drop the dependency**, which is the acceptance test
   for the whole RFC.

### Shim deletion is part of each move, not a trailing sweep

RFC 0129 ran this sweep twice and is owed a third.
`delete-ruby-compat-reexport-shims` (done, #7300) named only the five files it
touched; every later move orphaned a fresh shim pointing at an already-closed
story, which is why `delete-second-round-ruby-compat-reexport-shims` exists —
and that story's list is _already_ stale. Uncovered on main today:
`activesupport/src/include.ts`, `prepend.ts`, `method-missing-proxy.ts` (whole
files), and `index.ts:2` (`KeyError`), `:3` (`regexpEscape`), `:709` (`Range`).

This RFC does not repeat the pattern: **no story here may defer its shim
deletion to a later story.**

## Blast radius

~120 files import an adapter symbol, across every package but `arel` and `date`:

| symbol            | actionpack | activerecord | activesupport | rack | rack-session | trailties | other |
| ----------------- | ---------- | ------------ | ------------- | ---- | ------------ | --------- | ----- |
| `getFs`           | 9          | 16           | 12            | 5    | —            | 5         | 2     |
| `getCrypto`       | 12         | 6            | 18            | 1    | 1            | 1         | 1     |
| `getOs`           | 1          | 5            | 3             | —    | —            | —         | —     |
| `getChildProcess` | 1          | 3            | 2             | —    | —            | 2         | —     |
| `getHttpAsync`    | —          | —            | 3             | 1    | —            | —         | —     |
| `getAsyncContext` | —          | —            | 4             | —    | —            | —         | —     |

Import-specifier rewrites only — no call site changes shape.

## Non-goals

- **Changing any adapter's semantics.** This is a relocation. A behavioural fix
  found en route is a separate story.
- **A `ruby-compat-node` package.** Considered and rejected: it keeps the AST
  guard verbatim, but a ninth package earns its keep only if something must
  statically import Node, and nothing does.
- **Registration from outside `ruby-compat`.** Every `register*Adapter` call and
  every Node bootstrap lands in the leaf. A consumer that wants a non-Node
  backend still calls the registration function; no package re-registers on
  another's behalf.

## Acceptance criteria for the RFC

- `packages/rack/package.json` and `packages/rack-session/package.json` declare
  no `@blazetrails/activesupport` dependency.
- `move-tempfile-to-ruby-compat` and `move-monitor-mixin-to-ruby-compat` are
  unblocked.
- No `*-adapter.ts` remains in `packages/activesupport/src`, and no re-export
  shim for one remains either.
- `scripts/ruby-compat-leaf.test.ts` still passes, over the narrowed rule, with
  the adapters in the package.
