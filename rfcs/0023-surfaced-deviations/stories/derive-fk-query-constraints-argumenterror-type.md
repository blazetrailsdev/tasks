---
title: "derive-fk-query-constraints-argumenterror-type"
status: done
updated: 2026-06-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3725
claim: "2026-06-20T16:37:30Z"
assignee: "derive-fk-query-constraints-argumenterror-type"
blocked-by: null
---

## Context

Surfaced during review of PR #3723 (hasmany-fk-derivation-eager-at-proxy-construction).

`HasManyReflection#deriveFkQueryConstraints` raises the wrong error _class_ vs
Rails. The three underivable-FK guards in
`packages/activerecord/src/reflection.ts:824,834,851` throw `ConfigurationError`,
but Rails raises `ArgumentError` for all three at
`vendor/rails/activerecord/lib/active_record/reflection.rb:844,855,872`
(`derive_fk_query_constraints`).

The message text already matches Rails verbatim (only the owner class name
differs); only the thrown class diverges. Callers that
`catch (e) { if (e instanceof ArgumentError) ... }` would miss the trails
variant. PR #3723 converged the _timing_ (the error now surfaces at load, like
Rails) but deliberately left the type mismatch as out of scope — it predates
that story.

trails: `packages/activerecord/src/reflection.ts:824,834,851`
Rails: `vendor/rails/activerecord/lib/active_record/reflection.rb:844,855,872`

## Acceptance criteria

- [ ] Converge `deriveFkQueryConstraints`'s three throws from
      `ConfigurationError` to `ArgumentError` to match Rails
      `derive_fk_query_constraints`.
- [ ] Verify message text stays verbatim-matched to Rails (only owner class
      name differs).
- [ ] Update any test/catch sites that depend on the `ConfigurationError` type
      (e.g. the wave-5 `query constraints over three ...` test asserts on the
      message via regex, so it should be unaffected — confirm).
- [ ] api:compare / test:compare delta non-negative.
