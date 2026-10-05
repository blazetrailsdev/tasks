---
title: "activerecord: TokenDefinition#resolve_token compares payloads with =="
status: draft
updated: 2026-10-05
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`TokenDefinition#resolveToken` (`packages/activerecord/src/token-for.ts:67`)
ends with
`model && JSON.stringify(this.payloadFor(model)) === JSON.stringify(payload)`.
Rails compares the two arrays with `==`:
`model if model && payload_for(model) == payload`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/token_for.rb:31-35`).

The string comparison is key-order sensitive for a block that returns a hash,
and native `JSON.stringify` throws on a bigint id, which `payloadFor` passes
through unchanged since trails PR 8536. `rbEqual` from
`@blazetrails/ruby-compat` is the port of `==`.

`findSigned` and `findSignedBang` in `packages/activerecord/src/signed-id.ts`
carry a related leftover: `purpose: this.combineSignedIdPurposes(...) || undefined`,
where Rails passes `purpose: combine_signed_id_purposes(purpose)`
(`signed_id.rb:54,73`). `combine_signed_id_purposes` never answers a blank
string, so the `||` is dead.

## Acceptance criteria

- [ ] `resolveToken` compares with `rbEqual(this.payloadFor(model), payload)`.
- [ ] `findSigned` and `findSignedBang` pass `combineSignedIdPurposes(purpose)` with no `|| undefined`.
- [ ] `token-for.test.ts`, `token-for.trails.test.ts` and `signed-id.test.ts` pass unchanged.
