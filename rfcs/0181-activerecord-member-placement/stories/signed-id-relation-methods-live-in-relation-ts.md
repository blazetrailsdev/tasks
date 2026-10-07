---
title: "activerecord: SignedId::RelationMethods lives in signed-id.ts, not the Relation class body"
status: done
updated: 2026-10-07
rfc: "0181-activerecord-member-placement"
cluster: placement
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8585
claim: "2026-10-07T18:03:15Z"
assignee: "signed-id-relation-methods-live-in-relation-ts"
blocked-by: null
closed-reason: null
---

## Context

`Relation` includes two modules at `vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb:69`:
`include SignedId::RelationMethods, TokenFor::RelationMethods`.

`TokenFor::RelationMethods` (`token_for.rb:38-54`) now lives in `packages/activerecord/src/token-for.ts`
as a class-shaped module `Relation` includes (trails#8319). Its sibling does not:
`SignedId::RelationMethods` (`vendor/rails/v8.0.2/activerecord/lib/active_record/signed_id.rb:16-24`) defines
`find_signed` and `find_signed!`, and trails declares both as methods in the `Relation` class body
(`packages/activerecord/src/relation.ts`, `findSigned` / `findSignedBang`, directly above where the token
finders used to sit) rather than in `signed-id.ts`.

`parity:api` credits them through include resolution, and `parity:api:deps` does not flag them (the Ruby bodies
name no sibling-package constant), so no gate reports the misplacement.

## Acceptance criteria

- [ ] `packages/activerecord/src/signed-id.ts` exports `RelationMethods` holding `findSigned` / `findSignedBang`
      with the bodies of `signed_id.rb:17-23`, and `relation.ts` includes it beside `TokenFor::RelationMethods`
      in Rails' order.
- [ ] The two methods are gone from the `Relation` class body; their types stay on `interface Relation`.
- [ ] `pnpm parity:api:calls`, `:calls:args`, `:extra:gate` and `:receipts:gate` stay green, and a plain-node
      import of `dist/relation.js` and `dist/signed-id.js` as entry modules succeeds.

## Verification

```bash
pnpm build && pnpm parity:api && pnpm parity:api:calls && pnpm parity:api:calls:args
```
