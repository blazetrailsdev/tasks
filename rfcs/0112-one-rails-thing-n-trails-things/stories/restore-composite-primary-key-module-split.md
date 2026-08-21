---
title: "Restore Rails' PrimaryKey / CompositePrimaryKey module split"
status: in-progress
updated: 2026-08-21
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6840
claim: "2026-08-21T21:20:33Z"
assignee: "port-relation-create-for-build-scope"
blocked-by: null
closed-reason: null
---

# `primary-key.ts` folds the composite arms inline where Rails splits them into `CompositePrimaryKey`

## Context

Surfaced by `delete-callerless-composite-primary-key-duplicate` (PR #6832),
whose story premise — "Rails has no `composite_primary_key.rb` under
`attribute_methods/`" — is wrong for the vendored tree. It exists:
`vendor/rails/activerecord/lib/active_record/attribute_methods/composite_primary_key.rb`.

Rails splits the readers across two modules:

- `attribute_methods/primary_key.rb:11-58` — `to_key`, `id`,
  `primary_key_values_present?`, `id=`, `id?`, `id_before_type_cast`, `id_was`,
  `id_in_database`, `id_for_database`, each written against the scalar
  `@primary_key`.
- `attribute_methods/composite_primary_key.rb:6-78` — the same eight names, each
  `if self.class.composite_primary_key?` → map over `@primary_key`, `else super`.

trails has one file, `packages/activerecord/src/attribute-methods/primary-key.ts`,
whose readers carry both arms inline (`readId`, `writeId`, `readPkWith`,
`readIdForDatabase` each branch on `Array.isArray(pk)`). PR #6832 deleted the
callerless duplicate that had drifted out of sync; the remaining fold is
untouched and is the actual layout deviation.

## Converged shape

Restore Rails' split: `PrimaryKey` carries the scalar bodies, and a
`CompositePrimaryKey` class in
`packages/activerecord/src/attribute-methods/composite-primary-key.ts` extends it
with the composite arm plus `super`, mixed into `Base` after `PrimaryKey` the way
Rails includes it. Every reader stays an accessor property (CLAUDE.md,
"Generated attribute readers are properties"), so the split has to keep one
descriptor per generated name.

Check `parity:api` before and after: `composite_primary_key.rb` currently scores
0/8 with no paired TS file, so this should be a visible AR-closure gain.

## Acceptance criteria

- [ ] `attribute-methods/composite-primary-key.ts` exists again, paired with
      `composite_primary_key.rb`, carrying the eight Rails names with the
      `composite_primary_key?` / `super` shape.
- [ ] `primary-key.ts` readers carry only the scalar arm.
- [ ] `parity:api` AR-closure rollup gains; `parity:api:extra --package
activerecord` does not gain names.
- [ ] `primary-keys.test.ts` and the composite-PK suites pass on all three adapters.
