---
title: "Delete the TokenDefinition instance-method stubs declared on Base"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6117
claim: "2026-08-05T03:14:59Z"
assignee: "converge-context-set-defaults-remaining-three"
blocked-by: null
closed-reason: null
---

## Context

`Base` carries five `declare`d instance-method stubs that belong to
`TokenFor::TokenDefinition`, not to the model:

```ts
/** @internal */
declare fullPurpose: () => string;
/** @internal */
declare messageVerifier: () => unknown;
/** @internal */
declare payloadFor: (model: Base) => unknown[];
/** @internal */
declare generateToken: (model: Base) => string;
/** @internal */
declare resolveToken: (token: string, finder: (id: unknown) => Promise<Base | null>) => Promise<Base | null>;
```

In Rails these are the body of the `TokenDefinition` Struct —
`vendor/rails/activerecord/lib/active_record/token_for.rb:14-36`
(`full_purpose` :15, `message_verifier` :19, `payload_for` :23,
`generate_token` :27, `resolve_token` :31). Nothing in Rails puts them on
`ActiveRecord::Base`; a model instance has exactly one `TokenFor` instance
method, `generate_token_for` (:119).

They are also redundant. `token-for.ts`'s real `TokenDefinition` class already
implements all five faithfully (`fullPurpose` :121, `messageVerifier` :125,
`payloadFor` :138, `generateToken` :147, `resolveToken` :157). The `declare`s
carry no implementation and are never dispatched through a `Base` instance —
they were left behind by the old lazy-`defineProperty` wiring that PR #6106
deleted when it moved `TokenFor::ClassMethods` onto `Base` and made
`generateTokenFor` a real instance method.

## Converged shape

Delete all five `declare` lines from `base.ts`. `TokenDefinition` keeps the
methods, `Base` keeps only `generateTokenFor` — which is exactly Rails'
split.

Confirm the api-compare accounting after: these names are presumably being
credited to `base.ts` today, so removing them should move the `TokenDefinition`
members' match onto `token-for.ts` where the Ruby counterparts live, rather
than losing matches. Check with `pnpm parity:api` and
`pnpm parity:api:extra --package activerecord` before and after.

## Acceptance criteria

- [ ] `base.ts` declares none of `fullPurpose`, `messageVerifier`, `payloadFor`,
      `generateToken`, `resolveToken`; `generateTokenFor` (token_for.rb:119)
      remains the only `TokenFor` instance method on `Base`.
- [ ] `token-for.ts`'s `TokenDefinition` is unchanged.
- [ ] `pnpm parity:api` delta is non-negative and
      `pnpm parity:api:extra --package activerecord` does not regress `token-for.ts`
      or `base.ts`.
- [ ] `token-for.test.ts` and `token-for.trails.test.ts` stay green, no test
      name changes.
