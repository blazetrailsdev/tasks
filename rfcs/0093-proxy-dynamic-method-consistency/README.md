---
rfc: "0093-proxy-dynamic-method-consistency"
title: "Proxy dynamic-method consistency"
status: draft
created: 2026-08-07
updated: 2026-08-10
owner: "@deanmarano"
packages:
  - "activerecord"
  - "activemodel"
clusters: []
priority: 3
---

# Proxy dynamic-method consistency

## Motivation

The `proxy-dynamic-methods` audit
(`~/.btwhooks/data/github/blazetrailsdev/trails/audits/proxy-dynamic-methods-20260807T184253Z.md`,
2026-08-07) inventoried all 13 non-test `new Proxy` sites in
`packages/activerecord/src` and `packages/activemodel/src` — the JS stand-ins
for Ruby `method_missing` / `respond_to_missing?` / `hash.default` /
`DelegateClass`. Findings that warrant work:

1. **`respond_to_missing?` gaps.** `wrapWithScopeProxy`
   (`activerecord/src/relation/delegation.ts:750`) and `wrapCollectionProxy`
   (`activerecord/src/associations.ts:1846`) have no `has` trap, so
   `"someScope" in relation` answers false for names their `get` trap serves.
   Rails defines `respond_to_missing?` at `delegation.rb:136-138`. Both also
   use `value !== undefined` as the "do we own this?" test, which mis-routes an
   own property whose value is `undefined` (a declared-but-unset class field).
2. **Near-verbatim duplicate forwarding tails.** Five sites share the
   "own → `Reflect.get`; else read delegate; `.bind()` functions" method_missing
   tail with accidental spelling divergence:
   `migration/command-recorder.ts:25`, `connection-management.ts:73`
   (`BodyProxy.wrap`), `activemodel/src/type/normalized-value.ts:118`, and the
   two byte-identical Map-default traps at `activemodel/src/errors.ts:171` and
   `:200`.
3. **`withOptions` fidelity gap** (`activemodel/src/model.ts:534`): Rails'
   `ActiveSupport::OptionMerger` merges options into **every** forwarded
   method via `method_missing`; the trails proxy intercepts only `validates`
   and forwards other functions unbound.

Sites judged correct and out of scope: `stripThenable`, `thenableHash`,
`ProtectedParams`, `attributeTypes`, both error-Map defaults' absence of `has`
(Ruby `hash.default` doesn't make `key?` true), and `_getAdapterProxy` (a
ledgered consequence of the pool/adapter async split, tracked elsewhere).

parity:api exposure was checked and is a negative result: no compared surface
is trap-fabricated today.

## Scope

- Add `has` traps (Ruby `respond_to_missing?`) and fix ownership tests in the
  two relation/association dispatch proxies.
- Fold the duplicate errors.ts Map-default traps into one helper.
- Extract a shared `method_missing` forwarding helper
  (`@noRailsEquivalent` — the settled trails idiom for `method_missing`,
  analogous to `include()`) and adopt it at the three delegate-forwarding
  sites.
- Converge `withOptions` onto full `OptionMerger` semantics.

## Non-goals

- No changes to `stripThenable`, `thenableHash`, `ProtectedParams`,
  `attributeTypes`, `_getAdapterProxy`.
- No trap-skeleton merge of `wrapWithScopeProxy` / `wrapCollectionProxy` —
  their differences (loaded-sync-record preference, numeric indexing,
  strict-loading) are principled; revisit only after story
  `delegation-remaining-delegate-class-prototype-carriers` lands.
