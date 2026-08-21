---
title: "The ID_ATTRIBUTE_METHODS readers are methods where the ratified rule makes them properties"
status: claimed
updated: 2026-08-21
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: "2026-08-21T14:50:39Z"
assignee: "add-leading-underscore-call-candidate-to-conventions"
blocked-by: null
closed-reason: null
---

# The ID_ATTRIBUTE_METHODS readers are methods where the ratified rule makes them properties

## Context

`ActiveRecord::AttributeMethods::PrimaryKey` defines `id`, `id?`,
`id_before_type_cast`, `id_was`, `id_in_database` and `id_for_database`
(`activerecord/lib/active_record/attribute_methods/primary_key.rb:29-64`).
Every one is a zero-arg Ruby reader, so CLAUDE.md's "Generated attribute readers
are properties" makes each an accessor property in trails. `id` and `id?` are;
`idWas`, `idBeforeTypeCast`, `idInDatabase` and `idForDatabase` are still
methods (packages/activerecord/src/attribute-methods/primary-key.ts:67 and
siblings, listed in `ID_ATTRIBUTE_METHODS` at :296-304).

That split is not cosmetic. `ID_ATTRIBUTE_METHODS` only guards generation when
`primary_key` is non-nil (`primary_key.rb:69-71`), so a pk-less model — a
PostgreSQL foreign table, `packages/activerecord/src/adapters/postgresql/foreign-table.test.ts`
— generates the same names from the `_in_database` / `_was` / `_before_type_cast`
suffix patterns. In Ruby both halves are methods and the generated one harmlessly
delegates; in trails the generated half is a property and silently replaced the
method, which broke `_query_constraints_hash` on the PostgreSQL lane during
PR #6814. #6814 papered over it with a guard in
`defineAttributeMethodPattern` that refuses to emit a property over a name the
class answers with a method — correct as a safety net, but the underlying
mismatch is that these four should have been properties all along.

## Converged shape

`idWas`, `idBeforeTypeCast`, `idInDatabase` and `idForDatabase` become accessor
properties, matching `id` / `id?` and the repo-wide rule. The generated and
hand-written halves then agree in shape, and the pk-less-model case degrades the
way Rails' does — either definition answers the same way.

Known call sites to convert: `packages/activerecord/src/persistence.ts:1658`
(`_query_constraints_hash`), `packages/activerecord/src/timestamp.ts:179`,
`packages/activerecord/src/base.ts`'s `include` map, and the
`declare id*` members on `Base`.

Once converged, re-check whether the `defineAttributeMethodPattern` guard added
in #6814 still has a live case; keep it if another method/property pair exists,
and note it here if it does.

## Acceptance criteria

- [ ] The four readers are accessor properties, and `ID_ATTRIBUTE_METHODS`
      still lists them under the same names.
- [ ] `foreign-table.test.ts` passes on PostgreSQL with the
      `defineAttributeMethodPattern` property guard temporarily disabled,
      proving the shapes now agree rather than the guard hiding the clash.
- [ ] `parity:api` / `parity:test` deltas non-negative; `parity:api:calls` /
      `:args` add zero rows.
