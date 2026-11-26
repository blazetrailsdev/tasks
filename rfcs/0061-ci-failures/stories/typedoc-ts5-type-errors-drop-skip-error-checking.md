---
title: "Make the workspace typecheck under typescript-5 so typedoc can drop skipErrorChecking"
status: done
updated: 2026-11-26
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#10783
claim: "2026-11-26T03:14:44Z"
assignee: "ci-ar-adapter-shards-dynamic-work-queue"
blocked-by: null
closed-reason: null
---

## Context

trails#10348 made `docs:typedoc` pass by setting `skipErrorChecking` in `packages/website/typedoc.config.mjs`, both at the top level and in `packageOptions`. TypeDoc runs on the `typescript-5` (5.9) toolchain, and 5.9 rejects code that TS 7.1 accepts. It reported 19 errors across activemodel, activesupport and actionpack. An example is `Hash<string, unknown>` not assignable to `AnyObject | Hash<unknown, unknown>` at `packages/actionpack/lib/action-controller/metal/strong-parameters.ts:183,636`, through `withIndifferentAccess` and the return type of `Hash#toH`. Another is `packages/activesupport/lib/hash-with-indifferent-access.ts:638`.

## Acceptance criteria

- Running `typedoc --tsconfig ../../tsconfig.json` from `packages/website` with `skipErrorChecking` removed reports no type errors. Fix the types so both compilers accept them, with no casts added just to quiet 5.9.
- Remove `skipErrorChecking` from `typedoc.config.mjs`.
