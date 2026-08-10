---
title: "Install SecureToken::ClassMethods on Base instead of from hasSecureToken"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6100
claim: "2026-08-04T22:59:07Z"
assignee: "i18n-date-numeric-parser-patterns"
blocked-by: null
closed-reason: null
---

## Context

`secure_token.rb:11` declares `module ClassMethods` and
`extend ActiveSupport::Concern`, so `has_secure_token` and
`generate_unique_secure_token` are class methods on every `ActiveRecord::Base`
subclass (`base.rb:326` `include SecureToken`).

trails keeps `hasSecureToken` behind the `@blazetrails/activerecord/secure-token`
subpath because it needs crypto, which the package entry cannot pull in
(`packages/activerecord/src/index.ts:280` says so explicitly). PR #6096 routed
both generation sites through `self.class` as Rails does
(secure_token.rb:51,54), but had to INSTALL the class method from inside
`hasSecureToken`:

```ts
if (!("generateUniqueSecureToken" in modelClass)) {
  (modelClass as typeof Base & ClassMethods).generateUniqueSecureToken = generateUniqueSecureToken;
}
```

That is a trails-only wiring step with no Rails counterpart, and it means a model
that never calls `hasSecureToken` has no `generateUniqueSecureToken` at all —
where Rails puts it on every model.

## Converged shape

Make the crypto dependency lazy (or move it behind the already-existing
`getCrypto()` adapter seam in `@blazetrails/activesupport`) so
`packages/activerecord/src/secure-token.ts` can be wired onto `Base` the way
every other `ClassMethods` module is — `static hasSecureToken = hasSecureToken;
static generateUniqueSecureToken = generateUniqueSecureToken;` in `base.ts` —
and delete the conditional install. `secureRandomBase58`
(`SecureRandom.base58`, secure_token.rb:58) already goes through `getCrypto()`,
so the blocker is the subpath split, not the algorithm.

## Acceptance criteria

- `Base.generateUniqueSecureToken` exists without calling `hasSecureToken` first.
- The conditional install in `hasSecureToken` is deleted along with the
  file-local `ClassMethods` interface.
- The override cover in `packages/activerecord/src/secure-token.trails.test.ts`
  still passes (a model-level override wins over the inherited static).
- `pnpm parity:api:extra --package activerecord` does not regress `secure-token.ts`.
