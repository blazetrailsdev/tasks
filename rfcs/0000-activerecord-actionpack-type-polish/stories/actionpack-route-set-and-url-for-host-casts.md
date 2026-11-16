---
title: "Route set and url_for without double casts"
status: draft
updated: 2026-11-16
rfc: "0000-activerecord-actionpack-type-polish"
cluster: type-polish-actionpack
packages: [actionpack]
deps: [type-polish-count-double-casts]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`action-dispatch/routing/` has 32 `as unknown as`. `lib/action-dispatch/routing/route-set.ts` holds 22 `as unknown as` / `any`
hits and `routing/url-for.ts` 5; casts onto `UrlForHost` (5) and
`PolymorphicHost` (7) recur across routing. Rails:
`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/route_set.rb`,
`url_for.rb`, `polymorphic_routes.rb`.

## Acceptance criteria

- [ ] `as unknown as` in `action-dispatch/routing/` falls from 32 to ≤ 10
      (at least 70%).
- [ ] `UrlForHost` / `PolymorphicHost` are reached through a `this`-typed
      function or `Included<>`, not a cast, wherever the module is already a
      plain module.
- [ ] `ActionDispatch::Routing::UrlFor` stays a `Module` carrier until
      `routing-url-for-and-collector-plain-modules` (RFC 0123, blocked on the
      live-include decision) lands. Casts on it are typed through its
      existing host interface, and its shape is not changed here.
- [ ] Named-route helper modules keep the late-definition shape ratified
      in CLAUDE.md § "Module mixins" (`RoutesHelpers.with`).

## Verification

Count `as unknown as` from `packages/actionpack/lib`, before and after, and record both in
the PR body:

```sh
grep -Po 'as unknown as' -r --include=*.ts action-dispatch/routing | wc -l
```

This is the RFC's Motivation command, which counts matches, not lines.
`pnpm typecheck`, `pnpm parity:lint:counts`, `pnpm test:types`,
`pnpm parity:api` and `pnpm parity:test` are green, with non-negative parity
deltas.

## Definition of done

Renaming a Rails method, parameter or local, reordering control flow, or
adding a wrapper to avoid a cast does not close this story.
