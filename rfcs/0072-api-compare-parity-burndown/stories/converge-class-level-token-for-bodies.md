---
title: "Converge class-level TokenFor bodies onto Rails' all-delegation"
status: done
updated: 2026-08-02
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 5912
claim: "2026-08-02T19:25:25Z"
assignee: "converge-class-level-token-for-bodies"
blocked-by: null
closed-reason: null
---

## Context

Sibling cluster to `converge-relation-token-and-signed-id-finder-bodies`
(PR 5905), which converged the four `Relation` finder bodies. The class-level
`TokenFor::ClassMethods` / `TokenFor` instance bodies in
`packages/activerecord/src/token-for.ts` are still unconverged: 8 entries remain
in `scripts/api-compare/call-mismatches-wide-exclude/activerecord/token-for.json`.

Anchor: `vendor/rails/activerecord/lib/active_record/token_for.rb`.

- `find_by_token_for` / `find_by_token_for!` drop `all` — Rails
  (token_for.rb:105-111) is a pure delegation, `all.find_by_token_for(purpose,
token)`. Trails reimplements the lookup (its own `requirePrimaryKey` +
  `getDefinition` + `resolveToken`) instead of routing through `all()`. Since
  PR 5905 the Relation body IS the Rails body, so the class methods can now
  collapse to the delegation and the duplicated primary-key/composite handling
  in token-for.ts can go.
- `generate_token_for` drops `fetch` and `token_definitions` (token_for.rb:118)
  — should read `tokenDefinitions(this.constructor).fetch(purpose)`; PR 5905 added
  the Ruby `Hash#fetch` (raising a KeyError-shaped error) to what
  `tokenDefinitions()` returns, so the verb already exists.
- `generates_token_for` drops `merge` and `token_definitions` (token_for.rb:99).
- `message_verifier` drops `generated_token_verifier`; `payload_for` drops
  `as_json`.

## Acceptance criteria

- Class-level `findByTokenFor` / `findByTokenForBang` delegate through `all()`
  to the converged Relation bodies; the duplicated PK/composite lookup in
  token-for.ts is deleted.
- `generateTokenFor` / `generatesTokenFor` go through the `tokenDefinitions`
  reader (and its `fetch`) rather than the private registry helpers.
- Entries drop out of `call-mismatches-wide-exclude/activerecord/token-for.json`;
  `pnpm parity:api:calls` passes with a strictly smaller baseline.
- `token-for.test.ts` (port of `token_for_test.rb`) stays green with names
  unchanged.
