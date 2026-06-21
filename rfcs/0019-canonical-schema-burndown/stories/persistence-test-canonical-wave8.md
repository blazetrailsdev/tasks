---
title: "persistence-test-canonical-wave8"
status: claimed
updated: 2026-06-21
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-21T19:34:44Z"
assignee: "persistence-test-canonical-wave8"
blocked-by: null
---

## Context

Continuation of `persistence-test-canonical-wave7` (PR #3819), which removed the
leftover invented `Item` blocks and the bespoke `users` duplicate block from
`packages/activerecord/src/persistence.test.ts`.

The file still contains **8 bespoke `defineSchema(...)` describe blocks** plus a
large invented-name block to audit against
`vendor/rails/activerecord/test/cases/persistence_test.rb`:

- Remaining `defineSchema` blocks around lines 479, 633, 867, 917, 1463 (Post/
  requireds/trackeds), 1591 (update-all Post), 1631 (Article/validateds/
  requireds/trackeds/posts/users — the big one). Re-audit; line numbers shift.
- The large bespoke `Article` block (`class Article extends Base` ~line 1633 to
  EOF) is ALL invented descriptive-BDD names (`inserts a new record and assigns
an id`, `marks the record as destroyed`, `freezes the record after destroy`,
  `increment increases attribute value`, `readonlyBang marks record as
readonly`, `find_or_create`/`finds existing record`, `suppress`/`prevents
persistence during block`, `to_param`, `inspect`, etc.). None match Rails
  verbatim. Audit each behavior: delete pure deviations whose behavior is
  already covered by a Rails-named test; port genuine gaps to canonical models +
  fixtures with verbatim Rails names.

Remaining duplicate test names to consolidate: `create through factory with
block`, `finds existing record`, `throws on validation failure`.

Carry-forward constraints: canonical models imported under alias
(`CanonicalPost`/`CanonicalTopic`/`CanonicalItem`) until ALL blocks convert;
canonical `posts` has no `created_at`/`updated_at`; fixtures are loaded so write
counts fixture-aware; `.changed` is a boolean.

## Acceptance criteria

- [ ] Convert/delete the next coherent slice (one PR, <=500 LOC). Real Rails
      tests -> canonical models + fixtures, names verbatim; pure deviations deleted.
- [ ] No new duplicate test names; consolidate duplicated families.
- [ ] `pnpm vitest run packages/activerecord/src/persistence.test.ts` passes;
      `pnpm lint` and `node scripts/typecheck.mjs` clean; test:compare delta non-negative.
- [ ] Register a further wave story if more than one PR of work remains; remove
      `persistence.test.ts` from `eslint/require-canonical-schema-exclude.json`
      only once FULLY converted (no `defineSchema`, no `eslint-disable`).
