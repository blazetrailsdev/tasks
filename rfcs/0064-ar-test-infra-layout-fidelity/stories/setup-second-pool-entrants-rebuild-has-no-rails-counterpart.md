---
title: "Drop setupSecondPool's primary entrants rebuild"
status: done
updated: 2026-08-04
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 7
pr: 6091
claim: "2026-08-04T20:44:04Z"
assignee: "i18n-date-parse-have-elem-gates"
blocked-by: null
closed-reason: null
---

## Context

After PR #5685 removed `setupSecondPool`'s primary-database drops and
`teardownSecondPool`, one non-Rails move remains in
`packages/activerecord/src/support/setup-second-pool.ts`:

```ts
await rebuildCanonicalTables(primary, ["entrants"]);
```

Rails' `MultipleDbTest` (`vendor/rails/activerecord/test/cases/multiple_db_test.rb`)
does nothing of the kind — `entrants` is an ordinary primary-database table
(`schema.rb:590`) laid once by `schema.rb` and reset by transactional fixtures.
The rebuild exists only because trails' vitest workers share one per-worker
primary database, so a sibling suite can leave `entrants` in a reduced shape.

That is the same class of shield as
[[remove-global-reset-and-skip-shield-after-canonical-burndown]], but scoped to
this one call site, and it is now the only remaining deviation in this file.

## Acceptance criteria

- Determine whether any sibling suite still reshapes `entrants` on the shared
  primary database (the shield's only justification).
- If none does, drop the `rebuildCanonicalTables(primary, ["entrants"])` call so
  `setupSecondPool` only touches the arunit2 pool, matching Rails.
- If one does, either fix that suite to stop reshaping a canonical table, or
  record the justification at the call site per the
  justify-deviations-at-call-site rule.
- `multiple-db.test.ts` stays green on all three lanes.
