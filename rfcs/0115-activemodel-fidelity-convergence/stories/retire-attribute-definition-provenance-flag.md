---
title: "Retire AttributeDefinition's stored provenance flag in favour of Rails' Attribute subclass distinction"
status: in-progress
updated: 2026-08-20
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 320
priority: null
pr: 6789
claim: "2026-08-20T20:05:07Z"
assignee: "class-attribute-names-must-read-attribute-types"
blocked-by: null
closed-reason: null
---

## Context

PR #6783 collapsed `AttributeDefinition.userProvided` + `.source` onto a single
field named for the Rails kwarg, `userProvidedDefault`, taking
`packages/activemodel/src/attributes.ts` from 3 novel to 1 on
`pnpm parity:api:extra --package activemodel`. The remaining novel row is that
field itself, and it is still a deviation: **Rails stores no such flag on any
definition record.**

In Rails the distinction is carried by _which `Attribute` subclass gets built_,
at the moment the default is applied:

- `activerecord/lib/active_record/attributes.rb:229-238` —
  `define_attribute(..., user_provided_default: true)` forwards the kwarg
  straight to `define_default_attribute(name, default, cast_type,
from_user: user_provided_default)`; nothing is persisted.
- `activerecord/lib/active_record/attributes.rb` `define_default_attribute`
  builds `Attribute::UserProvidedDefault` when `from_user:` is true and
  `Attribute.from_database` otherwise.
- `activemodel/lib/active_model/attribute_registration.rb:60-63` — the
  `PendingDefault` struct replays `attribute_set[name].with_user_default(default)`;
  the provenance lives in the resulting attribute object, not in a registry row.
- `activemodel/lib/active_model/attribute/user_provided_default.rb` is that
  subclass (ported at `packages/activemodel/src/attribute/user-provided-default.ts`).

trails persists the flag because schema reflection **re-registers** definitions
into `_attributeDefinitions` and must not overwrite a user-declared one. That
re-registration is itself the trails-specific shape; Rails' `load_schema!` seeds
`_default_attributes` from `type_for_column` and then replays the pending
modification queue on top, so a user declaration wins by _replay order_ rather
than by a stored precedence bit.

Current readers of the flag (all would go away or change shape):

- `packages/activerecord/src/model-schema.ts` — `scrubSchemaSourcedDefinitions`,
  `applyColumnsHash` (two guards + the write), `reconcileVirtualAttributes`
- `packages/activerecord/src/attributes.ts` — `defineAttribute`, `_defaultAttributes`
- `packages/activerecord/src/base.ts` — the foreign-table and virtual-reconcile branches
- `packages/activerecord/src/enum.ts` — `installEnumAttribute`'s `explicitlyTyped`
- `packages/activerecord/src/encryption/encryptable-record.ts`

## Converged shape

Drop `userProvidedDefault` from `AttributeDefinition` entirely. Let the
pending-modification replay carry provenance, exactly as
`attribute_registration.rb:53-72` does: a user `attribute(...)` pushes
`PendingType` / `PendingDefault` (already ported as `pushPendingType` /
`pushPendingDefault`), schema reflection seeds the column attributes, and the
replay order — seed first, pending second — makes the user declaration win
without a stored bit. Where a guard genuinely needs "was this attribute declared
by user code", read it off the pending queue or off the built `Attribute`
subclass (`instanceof UserProvidedDefault`), which is where Rails reads it.

Depends on the `_attributeDefinitions` registry converging toward
`_default_attributes` + the pending queue; sequence after
`converge-attribute-registration-pending-modification-helpers` and
`converge-attribute-registration-inherited-hook-and-decorator-replay`.

## Acceptance criteria

- `AttributeDefinition` carries no provenance field in either package.
- `pnpm parity:api:extra --package activemodel` shows `attributes.ts` at 0 novel.
- The AR precedence rule still holds: a user-declared attribute is never
  overwritten by `load_schema` (covered by `model-schema-load.test.ts`,
  `model-schema-sync-load.test.ts`, `sti-attribute-routing.trails.test.ts`).
- Three trails-only test names in `model-schema-load.test.ts` still spell the
  retired field (`"treats externally-constructed defs without userProvided..."`,
  `"defaults to userProvided=true (source=user)"`, `"sets userProvided=false
when userProvidedDefault:false is passed"`). They were deliberately left alone
  in #6783 under the never-reword-a-test-name rule; when the field goes, retire
  or rename them as part of the same change so the names stop naming a field
  that does not exist.
- Parity deltas non-negative; `pnpm parity:api:calls` / `:args` clean.
