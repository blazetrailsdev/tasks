---
title: "Burn down the 47 naming call-argument rows in the model core, associations, encryption and database tasks"
status: done
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: api-compare
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 190
pr: 6540
claim: "2026-08-14T19:45:16Z"
assignee: "naming-burndown-3-ar-model-encryption-tasks"
blocked-by: null
closed-reason: null
---

## Context

RFC 0096 wave 3. Measured on `origin/main` at **059bfe688** (2026-08-12) with
`API_COMPARE_ALLOW_STALE_BUILD=1 API_COMPARE_FORCE=1 pnpm parity:api --calls`
followed by `API_COMPARE_ALLOW_STALE_BUILD=1 pnpm parity:api:calls:args:report`
(the freshness guard reports `OutOfDateWithSelf` for activerecord/activesupport
even after a clean `pnpm build`, so the stale-build escape hatch is required).

That run reports **344 `naming` rows** repo-wide, of which **167** are in RFC
0096's scope (the RFC's `## Scope` drops actiondispatch/rack/actionview/
actioncontroller — 177 rows). Wave 3 cuts the 167 into six slots; this is the
model-core / associations / encryption / tasks residue slot: **47 rows across 28
files**. It is the largest wave-3 slot and is the direct successor to the
wave-2 `naming-burndown-2-ar-model-core` (50 rows, #6386) — the rows below are
what that PR and its siblings left standing.

Files excluded on purpose: `associations/has-many-through-association.ts` (3)
and `associations/join-dependency/join-association.ts` (1) are owned by the
already-ready story `naming-burndown-2-ar-associations-a1a3-residue`.

| Rows | File                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|    5 | `packages/activerecord/src/autosave-association.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
|    3 | `packages/activerecord/src/connection-handling.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
|    3 | `packages/activerecord/src/encryption/extended-deterministic-queries.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
|    3 | `packages/activerecord/src/enum.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
|    3 | `packages/activerecord/src/store.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
|    2 | `packages/activerecord/src/associations/collection-association.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
|    2 | `packages/activerecord/src/attribute-methods.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
|    2 | `packages/activerecord/src/database-configurations.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
|    2 | `packages/activerecord/src/encryption/encryptable-record.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
|    2 | `packages/activerecord/src/model-schema.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
|    2 | `packages/activerecord/src/tasks/mysql-database-tasks.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
|    2 | `packages/activerecord/src/token-for.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
|    1 | each: `associations/belongs-to-association.ts`, `associations/belongs-to-polymorphic-association.ts`, `associations/has-one-association.ts`, `encryption/cipher/aes256-gcm.ts`, `encryption/encrypted-attribute-type.ts`, `encryption/message-pack-message-serializer.ts`, `internal-metadata.ts`, `middleware/database-selector/resolver/session.ts`, `migration.ts`, `nested-attributes.ts`, `normalization.ts`, `query-logs.ts`, `scoping/named.ts`, `signed-id.ts`, `tasks/sqlite-database-tasks.ts`, `validations/uniqueness.ts` |

### Representative rows, with both sides

- **`store.ts#storeAccessor`** — TS passes `(attribute, accessor, value)` to
  `writeStoreAttribute` / `readStoreAttribute`; Rails
  (`vendor/rails/activerecord/lib/active_record/store.rb`, `store_accessor`)
  passes `(store_attribute, key, value)`. Two plain renames:
  `attribute`→`storeAttribute`, `accessor`→`key`.
- **`enum.ts#_enum`** — TS `(attrName, fullName, value, scopesEnabled,
instanceMethodsEnabled)` into `defineEnumMethods`; Rails (`enum.rb`,
  `_enum`) is `(name, value_method_name, value, scopes, instance_methods)`.
  Four renames across two call sites.
- **`connection-handling.ts#connectionPool` / `#retrieveConnection`** — TS
  passes `ref:call` (an inline call) where Rails
  (`connection_handling.rb`) passes the local
  `connection_specification_name`. Recorded as naming; likely an a3
  (the trails body calls a getter inline) — check before renaming.
- **`encryption/extended-deterministic-queries.ts`** — TS passes `relation` /
  `klass` into `process_arguments`; Rails
  (`encryption/extended_deterministic_queries.rb`) passes `self` in all three
  arms (`where`, `exists?`, `find_by`). Three rows, one shape.
- **`tasks/mysql-database-tasks.ts#create` / `#drop`** — TS passes
  `requireDatabaseName()`; Rails
  (`tasks/mysql_database_tasks.rb`) passes the `database` reader. A trails-only
  guard helper stands where Rails reads an attribute — a3, not a rename.
- **`attribute-methods.ts#generateAliasAttributeMethods`** — TS `host`, Rails
  `code_generator` (`attribute_methods.rb`,
  `alias_attribute_method_definition(code_generator, pattern, new_name, old_name)`).
  Mirrors the identical activemodel row in
  `naming-burndown-3-arel-activemodel`; keep the two PRs' file sets disjoint.
- **`validations/uniqueness.ts#validateEach`** — TS `mapped`, Rails `value`
  (`validations/uniqueness.rb`, `build_relation(finder_class, attribute, value)`).

### Tooling residue / structural rows in this slot

Sampled: **~11 of the 47** will not close with a rename.

- **`autosave-association.ts` (5 rows)** are the biggest block and are all one
  shape: `packages/activerecord/src/autosave-association.ts:899,902,917,920,935`
  call `afterCreate(model, cb)` / `afterUpdate(model, cb)` /
  `beforeSave(model, cb)`, where Rails
  (`autosave_association.rb#add_autosave_association_callbacks`) writes
  `after_create save_method`. The extra leading `model` argument is the trails
  module-mixin idiom for Rails' `include`, not a renamed local. These are
  baseline-at-the-gate-flip rows, not renames — say so explicitly in the PR
  body rather than trying to converge them.
- `collection-association.ts` (2) — `.size`→`.length` recordings.
- `model-schema.ts#columns`, `encryption/encryptable-record.ts#encryptAttributes`
  — `ref:call` against a Ruby method name (nested call recorded as a `ref:`).
- `internal-metadata.ts#selectEntry`, `belongs-to-polymorphic-association.ts`
  — `ref:constructor` against Ruby `class`.

### How to converge

Rename the locals and parameters to the Rails identifiers, camelCased per
`docs/ruby-ts-conventions.md`. Rename to the Rails identifier, not to a better
one. No behavior changes and no public surface changes — these are body-local
identifiers.

A row that turns out to be an a1 (argument order) or a3 (invented helper /
conversion) finding is **not** renamed away: file it against the RFC owning that
file and leave the row standing.

**Sizing note:** at ~47 rows this slot is at the top of the PR LOC band. If the
diff runs past the ceiling, ship the model-core + store/enum half and file the
encryption + tasks half as a follow-up story with
`pnpm tasks new 0096-naming-identifier-burndown <slug> --body-file <path>`,
carrying the table rows it did not cover. Do not fan out into sibling PRs.

The counts above are a snapshot; re-measure before claiming.

## Acceptance criteria

- [ ] Locals and parameters in the files listed above carry the Rails
      identifier, camelCased.
- [ ] `API_COMPARE_ALLOW_STALE_BUILD=1 pnpm parity:api:calls:args:report` shows
      the `naming` class down by **at least 30 of these 47 rows** (47 minus the
      ~11 residue rows and the `mysql-database-tasks` a3 pair), and no new
      `shape` rows.
- [ ] The five `autosave-association.ts` rows are documented in the PR body as
      the module-mixin recording shape, for `naming-gate-flip` to baseline.
- [ ] No baseline row is added, widened or reseeded by this PR.
- [ ] Any row deliberately left standing is an a1/a3 finding, called out in the
      PR body with the follow-up story or RFC it belongs to.
- [ ] `pnpm lint` passes and the touched packages' tests pass on all three
      adapters; no public API change.

## Progress — PR #6459 (partial; story NOT closed)

PR #6459 converged **9 of this slot's 47 rows** (47 -> 38), well short of the >=30
in the acceptance criteria. Converged: `store.ts` 3 -> 0 (`store_accessor`'s
full local set; `dump` passes `as_regular_hash(obj)` inline),
`connection-handling.ts` 3 -> 2 (`config` -> `config_or_env`),
`encryption/encryptable-record.ts` 2 -> 1, `database-configurations.ts` 2 -> 1
(`url`), `normalization.ts` 1 -> 0, `query-logs.ts` 1 -> 0,
`validations/uniqueness.ts` 1 -> 0.

`uniqueness.ts` was also a behavior convergence: rebinding `value` from
`map_enum_attribute` (`uniqueness.rb:22`) puts the _mapped_ value into
`error_options` as Rails does (`:47-48`), which the `mapped` local was hiding.

**The >=30 target is not reachable by renaming.** The story estimated ~11
residue rows; inspection of all 38 survivors found ~33 unconvergeable:

- Module-mixin receiver passing (~11 rows) — the `autosave-association.ts` block
  of 5, `encryption/extended-deterministic-queries.ts` x3, `scoping/named.ts`,
  `signed-id.ts`, `token-for.ts`. Now tracked by
  `module-mixin-receiver-this-typed`, which is the highest-yield remaining move.
- `enum.ts` x3 **cannot close**: the recorded first argument is Rails' `name`,
  but trails' `_enum` already has a `name` parameter _and_ an alias-resolved
  `attrName` local that Rails has no counterpart for (Rails resolves aliases
  inside `decorate_attributes`). Converging needs the alias resolution moved,
  not a rename.
- `.size` -> `.length`: `collection-association.ts` x2.
- Nested-call / `ref:constructor` recordings: `model-schema.ts#columns`,
  `encryptable-record.ts#encrypt_attributes`, `internal-metadata.ts`,
  `belongs-to-polymorphic-association.ts`, `nested-attributes.ts`,
  `encrypted-attribute-type.ts`, `enum.ts#serialize` (Ruby `mapping.fetch`),
  `message-pack-message-serializer.ts` (`Buffer.from`),
  `middleware/.../session.ts` (`Time.now` vs `Temporal.Now.instant`),
  `database-configurations.ts#build_db_config_from_raw_config`
  (`config.symbolize_keys`).
- a3, needing structural work: `tasks/mysql-database-tasks.ts` x2
  (`requireDatabaseName()` guard vs the `database` reader),
  `tasks/sqlite-database-tasks.ts` (passes `config.configuration`),
  `migration.ts` (`loaded` is the async-resolved migration behind the proxy),
  `model-schema.ts#yaml_encoder` (passes the global `typeRegistry`, Rails passes
  the model's `attribute_types`), `encryption/cipher/aes256-gcm.ts`,
  `has-one-association.ts#replace` (`displaced` caches `this.target` because the
  live reader mutates mid-method).
- `attribute-methods.ts#generate_alias_attribute_methods` is the
  activemodel-mirrored row left to `naming-burndown-3-arel-activemodel` to keep
  the file sets disjoint.

## Threshold correction (`naming-residue-taxonomy-recalibration`, 2026-08-13)

The `>=30` above was written against the pre-recalibration assumption that
~6% of the class is unconvergeable tooling residue. The committed classifier
(`scripts/api-compare/naming-taxonomy.ts`, reported by `pnpm
parity:api:calls:args:report`) measures this slot at **24 convergeable rows
and 3 permanent** ones, so the reachable target is **24**, not
`>=30`. Read the acceptance criterion as that number.

Permanent here means the classifier's `js-reserved-word`, `no-js-equivalent` and
`conventions-rename` classes — each carries ONE shared reviewed reason at the
gate flip, not a per-row sentence. `module-mixin-receiver` and `burndown` rows
are NOT permanent and must never be baselined, whatever this slot leaves
standing. See RFC 0096 `## Residue taxonomy`.
