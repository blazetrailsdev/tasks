---
rfc: "0072-api-compare-parity-burndown"
title: "parity:api parity & fidelity burndown"
status: closed
created: 2026-07-25
updated: 2026-08-12
owner: "@deanmarano"
packages:
  - activerecord
  - activemodel
  - activesupport
  - arel
  - globalid
clusters:
  - api-compare-tooling
  - arity-fidelity
  - missing-methods
  - extra-surface
priority: 2
---

## Outcome (closed 2026-08-12)

All three buckets are burned down for the data layer. Measured on main
`707c3975b` with a full `pnpm parity:api`:

| Bucket           | Baseline (2026-07-25)                                                                       | At close                                                                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Missing methods  | 4 activerecord + 1 activemodel                                                              | activerecord 6146/6147, activemodel 715/715, arel 952/952 — **data layer 7813/7814 methods (100%), 412/412 files**                                                    |
| Arity mismatches | 79 activerecord of 183                                                                      | **0 in activerecord, activemodel and arel** (90 remain repo-wide, all outside the data layer)                                                                         |
| Extra TS surface | large activerecord clusters (connection-adapters 48 novel, associations 39, inheritance 33) | **0 novel in activerecord**; every remaining row is a `moved` classification. The reasoned allowlist, the `@noRailsEquivalent` tag family and the CI gate all shipped |

Final counts: 351 stories, 323 done / 28 closed, 0 open.

activesupport (55.2%) is the one declared package still below 100%, and this RFC
scoped that out by design; the AR-closure slice (93.6%) belongs to RFC 0098.

### Where the 24 open stories went

None of them was one of the three buckets — this RFC had become the default
landing zone for anything `parity:api` surfaced, which is how it reached 375
stories. They were rehomed rather than closed:

- **0098-activesupport-ar-closure-port** (promoted to `active`) — the date-ext
  trio, the deprecation trio, the time-zone trio, and
  `port-numeric-ext-size-tests-for-bytes` (in progress on PR #6431).
- **0101-activesupport-out-of-closure-surface** (new) — the three cache-store
  stories and the two XmlMini stories, which this RFC's own audit had triaged
  out of the AR closure.
- **0102-adapter-version-reader-fidelity** (new) — the `database_version`
  residue: the blocked sync-getter story, the PG optimizer-hints memo, and the
  MySQL `newColumnFromField` `ON UPDATE` fold.
- **0103-parity-api-scoring-correctness** (new) — the two compare-tooling
  scoring bugs (overridden Ruby files scored against an empty allowed set; a
  Ruby writer resolving to `set<Name>`).
- **0076-execute-primitive-convergence** — `sqlite-get-database-version-bypasses-query-value`.
- **0094-sqlite3-adapter-construction-fidelity** — `abstract-adapter-constructor-drops-rails-config-arg`.
- **0075-collection-association-target-fidelity** — `port-base-association-find-target-body`.
- **0084-wide-call-set-burndown** — `converge-count-body-onto-calculate`.

Do not file new work here. Pick the RFC above that matches the bucket.

## Summary

Burn down the three drift buckets `parity:api` (`scripts/api-compare/`) still
reports for the data layer, toward full Rails API parity and fidelity:

1. **Missing methods** — 4 in activerecord (`null_scope?`, `already_in_scope?`,
   `intersect?` ×2) + 1 in activemodel (`Dirty#as_json`), per
   `output/api-comparison.json` (re-verified 2026-07-25).
2. **Arity mismatches** — 79 in activerecord of 183 total across 7625 compared
   pairs (`output/arity-mismatches.json`). A deep dive (below) shows roughly
   half are checker/extractor gaps, the rest split between genuine signature
   gaps and state-threading port deviations.
3. **Extra TS surface** — `pnpm parity:api:extra` novel/moved methods with no Rails
   counterpart. This RFC reconciles the small named clusters (globalid,
   abstractcontroller) and sets up the allowlist mechanism + triage for the
   large activerecord files.

## Scope: data layer only (2026-07-30)

This RFC is scoped to the **data layer** — activerecord, activemodel,
activesupport, arel, globalid and the adapter/connection code activerecord
depends on. `actionpack` was dropped from `packages` on 2026-07-30; `actionview` was dropped
on 2026-08-11 (it was still declared, contradicting this very section).

Its story history does not reflect that: a run of actionpack and actionview
stories (ActionView::Rendering / ViewPaths ports, the prepend/append action
callback macros, the CSP and `http/cache.ts` accessor convergences, the
abstractcontroller extra-surface cluster) merged here because no
actionpack-scoped RFC existed. Those done/closed stories stay put as history.
The three still-open actionpack stories were closed as out of scope on the same
date (`converge-cache-request-empty-header-truthiness`,
`port-cache-request-strict-freshness-accessor`,
`port-cache-lookup-store-for-cache-store-writer`); one,
`converge-http-cache-predicates-onto-is-prefix`, was left alone because PR #5637
was already open against it.

**Do not file new actionpack / actiondispatch / actionview / actioncontroller /
rack / actionmailer / activejob / actioncable / activestorage / railties work
here.** It needs its own RFC. A 2026-08-11 audit of every draft/ready story in
this RFC found none left, so the section is now accurate — keep it that way.

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

## A `@noRailsEquivalent` tag is file-scoped

The tag allows a name **in the file that declares it**, not the name globally:
`allowKeyOf` (`scripts/api-compare/extra-surface.ts:403`) keys every tagged
entry as `package tsFile name`, and the doc above it states the keying is by the
CONTAINER's file, matching how `collectTsFileNames` gathers the names it
compares.

That matters for a name re-declared as a mixin echo
(`declare static X: typeof Module.X` in `packages/activerecord/src/base.ts`).
For a **rename** the echo takes care of itself — `tsc` stops compiling when
`Module.X` is renamed, so the `base.ts` edit is forced. For a **tag** it does
not: tagging the home declaration leaves the `base.ts` echo still reporting as
novel, and the home-file story closes believing the name is done. A tag
therefore has to be written in **every** file that declares the name; the home
file's story is not sufficient on its own.

The six echoes standing on `base.ts` today (from PR #5919), with the home file
an agent claiming either end must also check:

| base.ts                        | home file                                                              |
| ------------------------------ | ---------------------------------------------------------------------- |
| `adapterClassSync` :1565       | `connection-handling.ts`, `database-configurations/database-config.ts` |
| `validatesUniqueness` :3408    | `validations.ts`, `validations/uniqueness.ts`                          |
| `withCte` :2868                | `querying.ts`                                                          |
| `attributeNamesList` :4190     | `attribute-methods.ts`                                                 |
| `isEqual` :4457                | `core.ts`                                                              |
| `loadBelongsTo` / `loadHasOne` | `associations/instance-methods.ts`                                     |

`isEqual` and `loadBelongsTo` / `loadHasOne` are the mirror image: they were
tagged on `base.ts` in #5919, so their **home** files still need the tag.

If the cleaner fix turns out to be teaching `extra-surface.ts` to follow
`typeof Module.X` echoes back to their home declaration, that is its own tooling
story — not a widening of any burndown story.
