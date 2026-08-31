---
title: "activesupport adapters do not self-register under ESM; every entry point primes them by hand"
status: ready
updated: 2026-08-31
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: null
priority: 11
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

activesupport's pluggable adapters only self-register synchronously under
CommonJS, so every pure-ESM entry point must prime each one by hand through
its async getter before anything reaches the sync accessor — and the failure
mode is a runtime throw deep inside unrelated code.

`packages/activesupport/src/child-process-adapter.ts:120-128` documents it:

> Works under CommonJS (where `require` is a global). In pure Node ESM the
> sync path cannot synchronously pull in `node:child_process` without a
> top-level static import of `node:module` (which would break browser
> bundles that consume this package). Consumers running under ESM should
> call `getChildProcessAsync` instead.

Three instances hit while building `examples/twitter-app`, all with errors
that name an adapter rather than the thing that broke:

1. `trails new` — `Error: No child-process adapter configured` from
   `packageManagerInstall` (`packages/trailties/src/package-manager.ts:82`),
   after the whole app tree had already been written.
2. `trails db migrate` — `Error: No crypto adapter configured` from
   `foreignKeyName` (`connection-adapters/abstract/schema-statements.ts`), so
   any migration using `t.references(name, { foreignKey: true })` died.
3. The example app's signed session cookie — same crypto error, from
   `MessageVerifier.generateDigest`
   (`packages/activesupport/src/message-verifier.ts:133`).

Fixed for the CLI by priming both in `packages/trailties/src/bin.ts`. The
example app primes crypto in `src/config/application.ts#connect`. Neither is
a general answer: the next adapter, or the next ESM entry point, repeats it.

Rails has no counterpart — `require` is uniform, so there is no split between
a sync and an async path.

## Acceptance criteria

- An ESM entry point gets working adapters without enumerating them, e.g. a
  single `@blazetrails/activesupport/node` side-effect import that registers
  every node-backed adapter.
- The sync getters' error messages name that entry point.
- `bin.ts` and `examples/twitter-app/src/config/application.ts` use it, and
  the app's `TODO` is removed.
- Browser bundles still exclude the node adapters.
