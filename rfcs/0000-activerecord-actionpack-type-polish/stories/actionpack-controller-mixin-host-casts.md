---
title: "Controller and middleware mixins without double casts"
status: draft
updated: 2026-11-16
rfc: "0000-activerecord-actionpack-type-polish"
cluster: type-polish-actionpack
packages: [actionpack]
deps: [type-polish-count-double-casts]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Outside routing, actionpack `lib/` casts onto host interfaces in
`abstract-controller/base.ts` (8), `middleware/cookies.ts` (6),
`action-controller/test-case.ts` (6), `middleware/flash.ts` (5) and
`middleware/session/cookie-store.ts` (4): `CachingClassMethods`,
`RackishResponse`, `FlashRequestHost`, `CookieJar`, `ConfigReceiver`, and 11
casts to `Record`.

## Acceptance criteria

- [ ] actionpack `lib/` `as unknown as` outside `routing/` falls by at least
      60%.
- [ ] A `Record<string, unknown>` cast on a plain options hash becomes a
      typed options interface or a narrowing guard.
- [ ] Each remaining double cast is a cross-package boundary, listed in the
      PR body with its reason.

## Verification

Before and after counts, recorded in the PR body, from the trails root:
`grep -rPc ': any\b|as any\b|as unknown as' packages/actionpack/lib --include=*.ts`
over the files named above. `pnpm typecheck`, `pnpm parity:lint:counts`,
`pnpm test:types`, `pnpm parity:api` and `pnpm parity:test` are green, with
non-negative parity deltas.

## Definition of done

Renaming a Rails method, parameter or local, reordering control flow, or
adding a wrapper to avoid a cast does not close this story.
