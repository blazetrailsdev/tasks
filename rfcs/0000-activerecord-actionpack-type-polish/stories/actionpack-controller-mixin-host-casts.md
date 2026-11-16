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

Outside `action-dispatch/routing/`, actionpack `lib/` has 85
`as unknown as`. The largest groups are `action-controller/test-case.ts` (7),
`abstract-controller/base.ts` (6), `action-dispatch/middleware/cookies.ts`
(5) and `action-dispatch/middleware/flash.ts` (4), 22 together. The rest sit
one to three per file. The targets are host interfaces (`CachingClassMethods`,
`RackishResponse`, `FlashRequestHost`, `CookieJar`, `ConfigReceiver`) and,
11 times, `Record`.

## Acceptance criteria

- [ ] actionpack `lib/` `as unknown as` outside `action-dispatch/routing/`
      falls from 85 to ≤ 34 (at least 60%).
- [ ] A `Record<string, unknown>` cast on a plain options hash becomes a
      typed options interface or a narrowing guard.
- [ ] Each remaining double cast is a cross-package boundary, listed in the
      PR body with its reason.

## Verification

Count `as unknown as` from `packages/actionpack/lib`, before and after, and record both in
the PR body:

```sh
grep -Po 'as unknown as' -r --include=*.ts --exclude-dir=routing . | wc -l
```

This is the RFC's Motivation command, which counts matches, not lines.
`pnpm typecheck`, `pnpm parity:lint:counts`, `pnpm test:types`,
`pnpm parity:api` and `pnpm parity:test` are green, with non-negative parity
deltas.

## Definition of done

Renaming a Rails method, parameter or local, reordering control flow, or
adding a wrapper to avoid a cast does not close this story.
