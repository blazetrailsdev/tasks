---
rfc: "0045-data-layer-api-compare-100"
title: "Data layer api:compare to 100% method parity"
status: active
created: 2026-06-23
updated: 2026-06-23
owner: "@deanmarano"
packages:
  - "arel"
  - "activerecord"
  - "activemodel"
clusters:
  - "arel"
  - "activemodel"
  - "ar-relation"
  - "ar-config"
  - "ar-adapter"
  - "ar-feature"
---

## Summary

The data layer — `arel`, `activerecord`, `activemodel` — sits at **94.8%**
`api:compare` method parity (6041/6429 matched, **388 missing**). This RFC frames
the campaign to drive all three packages to **100%** and registers per-cluster
stories that, shipped, close the gap. Every gap is triaged into one of three
buckets — **(a) genuine port**, **(b) convention/skip entry**, **(c) arity/
signature fix** — and resolved the right way (port the method, add a documented
`SKIP_GROUPS`/`unported-files` entry with a reason, or converge the signature).
No stubs.

## Motivation

Per-package state from `pnpm api:compare` (run 2026-06-23):

| Package        | Matched / Total | %         | Missing |
| -------------- | --------------- | --------- | ------- |
| arel           | 901 / 938       | 96.1%     | 37      |
| activerecord   | 5495 / 5810     | 94.6%     | 315     |
| activemodel    | 645 / 681       | 94.7%     | 36      |
| **data layer** | **6041 / 6429** | **94.0%** | **388** |

The raw 388 overstates the distinct work: module inclusion double-counts the
same name across files (e.g. `attribute_aliases` is one `class_attribute` from
`activemodel/attribute_methods.rb:71` but surfaces as a miss in
`attribute-methods.ts`, `attributes.ts`, AND `dirty.ts`; the relation
`*_values` accessor block is counted in both `relation.ts` and
`query-methods.ts`; the async finders show in both `base.ts` and
`querying.ts`). The distinct-name gap is far smaller (~120), which is why the
clusters below collapse many files into one story.

Inspecting the misses (per `output/api-comparison.json`) shows most are NOT
hand-written method bodies waiting to be typed — they are **Ruby
metaprogramming artifacts**:

- **Generated accessors.** `Relation::VALUE_METHODS.each { ... }`
  (`query_methods.rb:162`) generates `includes_values`/`includes_values=`/…;
  `class_attribute :_reflections` (`reflection.rb:11`),
  `class_attribute :primary_key_prefix_type` (`model_schema.rb:163`),
  `class_attribute :belongs_to_required_by_default` (`core.rb:89`) generate
  reader/writer/predicate triples. trails stores this state in private fields
  (`_whereClause`, `_referencesValues`) or hardcodes the config (model-schema.ts
  notes "trails has no pluralize_table_names toggle"), so the Rails-named
  accessor is absent.
- **Delegations.** `delegate :to_xml, :each, :in_groups, … to: :records`
  (`delegation.rb:101`) and `delegate :primary_key, :connection, … to: :model`
  (`delegation.rb:106`) are realized via trails' runtime delegation list, not
  named methods.
- **Aliases.** `alias :value :expr` / `alias :table_alias :name`
  (`arel/nodes/unary.rb:7-8`); `alias :visit_Time :visit_String` and the
  primitive-type visitor block (`arel/visitors/dot.rb:200`); `alias
:add_belongs_to :add_reference` (`command_recorder.rb:133`). The aliased
  target is usually already ported; the alias name is not a separate method.

The genuine ports are a minority: arel's real `visit_Integer` def
(`to_sql.rb:824`), `ActiveModel::AttributeSet` collection methods
(`each_value`/`fetch`/`except`/`include?`), encryption (`with_context`,
`key_provider`, `previous_schemes`), PostgreSQL OID type coercion
(`user_input_in_time_zone`/`limit`/`precision`/`scale`), through-association
`source_reflection`, and `read_attribute_for_validation`/`_serialization`.

The point of this RFC is not to guess the bucket up front but to make each
cluster a small, reviewable PR where the owner reads the Rails source and the
ported TS side-by-side and resolves each name correctly.

## Design

One story per cohesive cluster (a Rails module or a tight file group), each
sized under the 500-LOC PR ceiling and **non-overlapping in files** so they run
in parallel without conflicts. For every missing name a story does exactly one
of:

1. **Port (a)** — implement the method on the host (module-mixin `this`-typed
   function per CLAUDE.md), with a test matching the Rails test name where one
   exists.
2. **Skip (b)** — add a `SKIP_GROUPS` entry in
   `scripts/api-compare/conventions.ts` (or an `unported-files.ts` exclusion)
   **with a reason**, when the name is a generated accessor realized as a
   private field, a delegation realized via the runtime list, or an alias whose
   target is already ported. A skip is a documented true-negative of a
   name-based comparator, never a way to hide missing behavior.
3. **Arity (c)** — converge the TS signature to Rails (advisory dimension;
   `output/arity-mismatches.json` lists 13 activemodel + 3 arel mismatches).

When a cluster's underlying behavior genuinely diverges from Rails (not just a
naming artifact), the story **converges to Rails** and, if convergence is larger
than the story, files a follow-up with `pnpm tasks new` rather than ratifying
the deviation.

### Aggregator ordering

`base.ts`, `relation.ts`, and `query-methods.ts` re-expose names defined in leaf
modules (Querying, Reflection, the feature modules). Fixing the leaf flips the
aggregator's count too. So the leaf stories run first and the
`base/core/model-schema` aggregator story depends on them, mopping up only the
residual base.rb/core.rb-native config. The relation surface is kept as one
story (it owns `relation.ts` + `query-methods.ts` + `delegation.ts` together)
because those three files share the same generated/delegated surface and would
otherwise collide.

## Non-goals

- **Other packages.** Scoped to the data layer (arel/activerecord/activemodel).
  activesupport/actionview/etc. parity are separate efforts.
- **Call-set / options-key / literal advisory burndown.** Those dimensions have
  their own RFCs (e.g. 0044 call-set parity). This RFC is the method-name
  (match/miss) dimension plus the arity sub-fix.
- **Widening the comparator.** No changes to what `api:compare` counts; we burn
  down the current output.
- **`super`-call and private-method fidelity.** Out of the name-match scope.

## Alternatives considered

- **One mega-story per package.** Rejected: would blow the 500-LOC ceiling and
  serialize all work behind one PR. Per-cluster keeps PRs reviewable and
  parallel.
- **Blanket skip-list the generated accessors.** Rejected: some "generated
  accessor" misses mask a real behavioral gap (a config toggle trails hardcodes
  that Rails lets you set). Each must be read against Rails before skipping.

## Rollout

Leaf clusters first (no deps), aggregators last.

1. Phase 1 (parallel, no deps) — leaf clusters:
   - arel: `arel-visitors-primitive-dispatch`, `arel-node-accessor-aliases`
   - activemodel: `am-attribute-method-pattern-accessors`,
     `am-forbidden-and-read-attribute-hooks`, `am-attribute-set-collection`,
     `am-arity-convergence`
   - activerecord leaves: `ar-relation-surface`,
     `ar-feature-module-config-accessors`, `ar-querying-async-finders`,
     `ar-ddl-belongs-to-aliases`, `ar-schema-creation-quoting`,
     `ar-encryption-surface`, `ar-pg-oid-types`,
     `ar-type-metadata-negation-operator`, `ar-associations-source-reflection`
2. Phase 2 (depends on the activerecord leaf stories) —
   `ar-base-core-model-schema-config`.

## Verification

`pnpm api:compare --package arel`, `--package activemodel`, and `--package
activerecord` each report **100%** (0 missing). Per story, the named files reach
100% in `output/api-comparison.json`. Arity advisory reaches 0 for arel and
activemodel. Every skip added carries a reason and shows in the generated
conventions doc.

## Open questions

1. **Are the relation `*_values` generated accessors a skip or a thin-getter
   port?** Recommendation: skip with reason (state lives in private fields /
   `WhereClause` objects; the Rails accessor name has no behavioral home in
   trails). Resolve in `ar-relation-surface` with the Rails source open — if any
   accessor turns out to gate real behavior, port it instead.
2. **Do the arel primitive-type visitors (`visit_Time`, `visit_Integer`, …)
   apply in trails at all,** given JS has no Ruby `Time`/`BigDecimal`/`Symbol`?
   Recommendation: port the ones reachable by trails' value pipeline, skip the
   Ruby-only primitives with a reason. Resolve in
   `arel-visitors-primitive-dispatch`.
