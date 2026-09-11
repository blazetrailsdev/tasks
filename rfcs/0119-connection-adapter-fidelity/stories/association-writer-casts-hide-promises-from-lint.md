---
title: "as-any casts in front of association writer() hide the promise from no-floating-promises"
status: in-progress
updated: 2026-09-11
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 20
pr: trails#7685
claim: "2026-09-11T01:02:41Z"
assignee: "delete-deprecated-base-adapter-getter"
blocked-by: null
closed-reason: null
---

## Context

`sweep-unawaited-async-association-mutators-in-tests` (#7670) found that `@typescript-eslint/no-floating-promises` already covers `packages/activerecord/src/**/*.ts` (`eslint.config.mjs:1061-1086`). Every unawaited `writer` it missed was called through a cast that erases the promise type:

- `(record.association("x") as any).writer(y)` in `associations.test.ts`, `autosave-association.test.ts`, `strict-loading.test.ts` and `strict-loading-sync-reader.trails.test.ts`.
- `as unknown as { writer(target: unknown): void }` in `associations/belongs-to-inverse-seed-composite-pk.trails.test.ts`, now retyped to `void | Promise<void>`.

PR 7670 awaited all 13, but the cast is the hole the next one slips through. The casts exist because `Base#association` (`base.ts:2707`) returns the base `Association` (`associations/association.ts:13`), which declares no `writer`. That matches Rails: `writer` is defined on `SingularAssociation` (`vendor/rails/activerecord/lib/active_record/associations/singular_association.rb`) and `CollectionAssociation` (`associations/collection_association.rb`), not on `Association`. The fix is therefore not a new member on the base class. It is the call sites: give the test-side `association(name)` result a type that carries `writer` (for example a narrowing to the concrete association class the reflection declares), so the casts can go.

Trails side: `SingularAssociation#writer` returns `void | Promise<void>` (`associations/singular-association.ts:39`), and `CollectionAssociation#writer` returns `Promise<Base[] | undefined> | Base[]` (`associations/collection-association.ts:57`).

## Acceptance criteria

- [ ] No `as any` / `as unknown as { writer(...): void }` casts remain in front of `.writer(` in `packages/activerecord/src/**/*.test.ts`. Each call site reaches a type that declares `writer` with its real return type.
- [ ] Removing an `await` from any of those call sites makes `pnpm lint` fail with `no-floating-promises`.
- [ ] No new public member on `Association`, and `pnpm parity:api:extra:gate` is unchanged.
