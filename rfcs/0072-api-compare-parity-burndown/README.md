---
rfc: "0072-api-compare-parity-burndown"
title: "api:compare parity & fidelity burndown"
status: active
created: 2026-07-25
updated: 2026-07-27
owner: "@deanmarano"
packages:
  - "activerecord"
  - "activemodel"
  - "globalid"
  - "actionpack"
clusters:
  - api-compare-tooling
  - arity-fidelity
  - missing-methods
  - extra-surface
priority: 2
---

## Summary

Burn down the three drift buckets `api:compare` (`scripts/api-compare/`) still
reports for the data layer, toward full Rails API parity and fidelity:

1. **Missing methods** — 4 in activerecord (`null_scope?`, `already_in_scope?`,
   `intersect?` ×2) + 1 in activemodel (`Dirty#as_json`), per
   `output/api-comparison.json` (re-verified 2026-07-25).
2. **Arity mismatches** — 79 in activerecord of 183 total across 7625 compared
   pairs (`output/arity-mismatches.json`). A deep dive (below) shows roughly
   half are checker/extractor gaps, the rest split between genuine signature
   gaps and state-threading port deviations.
3. **Extra TS surface** — `pnpm api:extra` novel/moved methods with no Rails
   counterpart. This RFC reconciles the small named clusters (globalid,
   abstractcontroller) and sets up the allowlist mechanism + triage for the
   large activerecord files.

## Arity deep-dive (2026-07-25 snapshot, 79 activerecord mismatches)

**(c) Checker/extractor gaps — ~31 entries, fix the tooling first:**

- **Ruby `delegate`/`alias` recorded as `()[0-0]`** (~21 entries): the Ruby
  extractor already tags these `"notes": "delegate"` (e.g.
  `rails-api.json` records `create_or_find_by` from `querying.rb:12` delegate
  with `params: []`), but `arity.ts` compares them as genuine zero-arg methods
  against the real TS signature. Entries: `create_or_find_by` ×2,
  `type_to_sql`/`options_include_default?`/`quoted_columns_for_index`
  (schema_creation.rb:16 delegate), `in_groups`/`in_groups_of`/`split`/`rindex`
  ×2 files (delegation.rb:101-104 delegate to `:records`),
  `user_input_in_time_zone` ×2 (oid/array.rb:13, oid/range.rb:9),
  `within_new_transaction` ×2 (database_statements.rb:367),
  `add_sql_comment!` (mysql/schema_creation.rb:7),
  `quoted_include_columns_for_index` (postgresql/schema_creation.rb:8),
  `invert_add_belongs_to`/`invert_remove_belongs_to` (command_recorder.rb:269-270
  alias), `type.rb add_modifier`, `migration.rb run_without_lock` (verify).
- **Required-kwargs bundle vs single TS options object** (8 entries):
  `perform_query` ×4 (Ruby `(raw_connection, sql, binds, type_casted_binds,
prepare:, notification_payload:, batch:)` → min 6-7; TS
  `(rawConnection, sql, binds, typeCastedBinds, options?)` → max 5) and
  `batch_on_loaded_relation`/`batch_on_unloaded_relation` ×2 files (Ruby 6/9
  required kwargs vs TS single `opts`). `arity.ts` counts each required kwarg
  as one positional slot; the port's convention bundles them into ONE options
  object.
- **TS alias/re-export bindings recorded as 0-param** (~2+ entries):
  `readonly_attribute?` matches TS only via the object-literal alias
  `isReadonlyAttribute: readonlyAttributeQ`
  (`readonly-attributes.ts:204`), extracted with `params: []`, so the real
  `readonlyAttributeQ(this, attribute)` signature (line 90) never enters the
  candidate pool — a false mismatch. Also produces the misleading `ts()`
  display for `perform_query`, `cache_sql`, `association_valid?`, etc. via
  `matchArityAgainst`'s first-candidate reporting.

**(a) Genuine fidelity gaps — ~17 entries, TS signature should converge:**
`get_chain` (missing `association`), `update_through_counter?`,
`internal_metadata.rb` ×5 (TS dropped the leading `connection` param),
`verify_attributes`, `derive_join_table_name`, `preload_associations`,
`tables(stream)`, `resolve_token`, `encoded`, `column_type`,
`generate_iv`/`generate_deterministic_iv`, `association_valid?`/
`compute_primary_key` (record threading), pending per-item verification.

**(b) State-threading deviations — ~31 entries:** Ruby zero-arg private
methods reading ivars ported as free functions taking the state explicitly
(`where_clause.rb` ×5 taking `predicates`, mysql `schema_statements` ×2 taking
`isMariaDb`/`databaseVersion`, `insert_all.rb` ×2, `url_config.rb`/
`connection_url_resolver.rb`, `schema_cache.rb`, `result.rb hash_rows`,
`transaction.rb` ×2, `nested_error.rb` ×2, uniqueness ×2 taking `validator`,
etc.). Each must converge to the `this`-typed mixin convention (CLAUDE.md)
where feasible, or be excluded with a reason via a new arity exclude file.

## Design

Foundation first: fix the three checker/extractor gaps and add a reasoned
arity-exclude mechanism (mirroring `call-mismatches-exclude.json`) plus a
reasoned extra-surface allowlist (today `extra-surface.ts` has only the global
`TS_ALWAYS_ALLOWED` set and `--exclude-glob`). Then burn down the residual
true mismatches per-cluster, port the 5 missing methods, and reconcile the
named extra-surface clusters. Large activerecord extra-surface files
(`connection-adapters.ts` 48 novel, `associations.ts` 39, `inheritance.ts` 33,
`relation/finder-methods.ts` 30, …) get an inventory spike that registers
follow-up stories rather than one unboundable story.

## Scope

This RFC is **activerecord-first**: the target is Rails API parity for the
data layer (activerecord, activemodel, arel) plus only the surface _necessary
to support it_ — e.g. activesupport pieces AR actually consumes
(MessageVerifier/MessageEncryptor/Messages codec for encryption and signed
ids, callbacks, notifications) and globalid/actionpack glue where AR features
depend on it. It is NOT a 100%-activesupport parity campaign, and actionview
parity is not pursued here at all (the three open actionview stories were
closed out of scope on 2026-07-26; a future actionview RFC can adopt them).
When an activesupport/actionpack gap surfaces that AR does not need, file it
elsewhere rather than growing this RFC.

## Non-goals

- Extra-surface burndown of packages outside activerecord/activemodel/
  globalid/abstractcontroller beyond the mechanism work.
- actionview parity (entirely); activesupport parity beyond what activerecord
  consumes.
- The `pins` (body-pin) backlog and inheritance-parity gaps — separate
  campaigns.
- Changing what counts toward the parity % — arity/extra-surface stay
  advisory.

## Rollout

1. Tooling: arity-skip-ruby-delegate-entries, arity-collapse-required-kwargs,
   arity-resolve-ts-alias-bindings, arity-exclude-mechanism,
   extra-surface-reasoned-allowlist.
2. Missing methods: port-missing-scope-predicates.
3. Arity residual: internal-metadata cluster, associations cluster, misc
   cluster, state-threading triage.
4. Extra surface: globalid, abstractcontroller/apply-mixin pattern,
   activerecord top-file inventory spike.

## Fidelity-first policy

Moving toward Rails fidelity is the stated goal of every extra-surface story in this RFC; the allow-set/allowlist is a **last resort**. Before
admitting or keeping any name in the allow-set, first make — or file as its own
story — the fidelity change that would make the entry unnecessary: converge the
TS surface onto the Rails name and Rails-layout file (relocate + rename),
delete the invention, or justify an `@internal` at the declaration site. Only
names that are faithful-but-unmappable (e.g. genuine Ruby file constants or
nested class names present in the matched Rails file) belong in the allow-set;
any other allowlisted entry must cite the filed fidelity story next to it.
