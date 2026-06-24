---
rfc: "0047-widen-call-set-parity-all-ported"
title: "Widen call-set parity: converge all ported-method internal calls to Rails"
status: active
created: 2026-06-24
updated: 2026-06-24
owner: "@your-handle"
packages:
  - "activerecord"
  - "arel"
  - "activemodel"
clusters:
  - infra
  - real-omission
  - equivalent-baseline
related-rfcs:
  - "0044"
  - "0045"
---

## Summary

RFC 0044 burns the advisory **call-set parity** dimension to zero, but only
over the narrow `SIGNIFICANT_CALLS` allowlist (~18 callback / transaction /
locking / persistence / dirty-tracking primitives → 23 flagged activerecord
pairs). 0044 explicitly lists **"Widening `SIGNIFICANT_CALLS`"** as a non-goal:
"tuning the allowlist is separate (it would change the population)." This RFC
**is** that separate, wider effort, across `activerecord`, `arel`, and
`activemodel`: for every name-matched (Ruby, TS) method pair, where Rails' body
calls _another ported method_ and the trails TS body omits that call (and it is
not a structural/equivalent difference), surface it and converge to Rails.

The widening is mechanical: `significantMissingCalls()` already takes a
`significant: ReadonlySet<string>` parameter (compare.ts ~line 129) that
defaults to `SIGNIFICANT_CALLS`. Passing a set that admits _every_ Ruby call
name (except `super`, which the module-mixin port structurally drops — see the
`SIGNIFICANT_CALLS` comment) reuses the existing noise-suppression gates
(`isPortedWithArgs`, `mapCall`, "TS body makes NONE of the mapped candidates")
without touching the committed allowlist.

## Population & triage breakdown

Wide run (`API_COMPARE_WIDE_CALLS` widening of the `significant` set, all
ported names admitted except `super`), regenerated via
`pnpm api:compare --package <pkg>`:

| Package      | Matched pairs checked | Pairs flagged (wide) | Missing-call rows (wide) |
| ------------ | --------------------- | -------------------- | ------------------------ |
| activerecord | 2596                  | 1834                 | 5273                     |
| arel         | 498                   | 336                  | 473                      |
| activemodel  | 329                   | 218                  | 378                      |

This raw population is exactly the ~72%-noise the `SIGNIFICANT_CALLS` comment
warns about. Two mechanical filters cut it down:

1. **Enumerable / Object / Hash / String idiom denylist** (`new`, `to_s`,
   `each`, `map`, `empty?`, `any?`, `include?`, `present?`, `merge!`,
   `transform_values`, …) — Ruby stdlib idioms that translate to native JS and
   collide with ported names. Drops the bulk.
2. **Ruby-side zero-arg gate** — the callee must be _defined taking arguments_
   somewhere in Ruby (mirroring the existing TS-side `isPortedWithArgs`). Kills
   the remaining accessor noise where Ruby records a property read (`model`,
   `primary_key`, `klass`, `owner`, `reflection`, `table`, `id`, `type`,
   `connection`, `schema_cache`, `arel_table`) as a "call" that trails realizes
   as `this.x`.

The residual was then hand-triaged against vendored Rails + the ported TS,
side-by-side, into 0044's three buckets:

- **(a) Real omission** (converge to Rails): the TS body genuinely skips
  behavior Rails performs. **3 clusters survive** (2 activerecord, 1
  activemodel). Detailed below.
- **(b) Confirmed behavioral equivalent** (documented baseline entry): the call
  is realized through a different but equivalent path. The large clusters are
  here — e.g. the entire `execute` / `internal_execute` / `exec_query` DDL/DML
  family in `schema-statements.ts`, `database-statements.ts`, and the adapters
  routes through `this.adapter.executeMutation(...)` (verified at
  `schema-statements.ts:315` etc.); `select_all` / `select_values` go through
  `rel._conn().selectAll(...)`; `set_callback` registration delegates through
  `modelClass.afterCommit`; the dirty-tracking mutation helpers reimplement
  via `AttributeSet` snapshots.
- **(c) Noise** (not actionable; documented filter): the two mechanical filters
  above, plus receiver-chained calls the extractor mis-attributes and
  mixin-host flattening that duplicates a predications/visitor flag across every
  host that mixes it in.

**`arel` yields zero real omissions.** Its entire residual is bucket (b)/(c):
the `grouping_any` / `grouping_all` / `quoted_array` flags are mixin-host
attribution artifacts (the methods _are_ defined and used in `predications.ts`
at lines 315/330/340), and the `visit` / `accept` / `maybe_visit` /
`visit_Arel_Nodes_*` flags are the visitor double-dispatch the ToSql visitor
realizes through its own dispatch map. This is a fine, honest outcome — the
clean widened signal is small.

## Why this is distinct from 0044

0044's population is the 23-pair output of the committed `SIGNIFICANT_CALLS`
allowlist and its non-goals fence off allowlist tuning. This RFC changes the
population by admitting _all_ ported method names as "significant", which is a
different (and far noisier) input requiring its own triage methodology and its
own ratcheting baseline (the wide artifact is not the same file 0044 gates).
The two RFCs share the bucket methodology and the converge-never-ratify
principle but do not overlap in scope.

## Bucket methodology

For each candidate residual pair: open the vendored Rails source
(`vendor/rails/...`) and the ported TS side-by-side; confirm whether the
omitted call's behavior is (a) genuinely absent, (b) realized by a differently
named/structured but equivalent path, or (c) a tooling artifact. **Fidelity is
the #1 value** (CLAUDE.md): bucket (b) records a _true negative of a coarse
heuristic_, never ratifies a real behavioral deviation — any actual difference
converges.

## Clusters (per-story)

1. **Phase 1 — `wide-call-set-significant-knob-and-baseline`** (infra). Promote
   the throwaway widening into a first-class, opt-in `significant`-set knob on
   the calls check + its own ratcheting baseline (separate from 0044's
   `call-mismatches-exclude.json`), so the burndown below has somewhere to
   record confirmed equivalents and CI fails on new unexplained wide flags.
2. **`query-methods-empty-args-guard`** (activerecord, real omission).
   `checkIfMethodHasArgumentsBang` is defined and exported in
   `relation/query-methods.ts:1618` but **never called**; ~17 public query
   methods (`includes`, `eager_load`, `preload`, `references`, `select`,
   `reselect`, `group`, `regroup`, `order`, `reorder`, `unscope`, `joins`,
   `left_outer_joins`, `optimizer_hints`, `annotate`) skip Rails'
   empty-argument `ArgumentError` guard **and** the `flatten!` / `compact_blank!`
   normalization it performs.
3. **`finder-raise-record-not-found-message-fidelity`** (activerecord, real
   omission). `find_one` / `find_some` / `find_some_ordered` in
   `relation/finder-methods.ts` `throw new RecordNotFound(...)` inline instead
   of routing through the shared `raiseRecordNotFoundExceptionBang`
   (`finder-methods.ts:578`), producing non-faithful exception messages.
4. **`validates-helpers-delegate-to-validates-with`** (activemodel, real
   omission). The `validates_*_of` helpers in `model.ts` reimplement via
   `this.validates(attr, { presence: … })` instead of Rails'
   `validates_with(XValidator, _merge_attributes(attr_names))`; several can't
   even accept multiple `attr_names` the way Rails does (single-attribute TS
   signatures), an arity + behavior divergence.

## Verification

The widened call-mismatches artifact (Phase 1's new gated file, produced with
the wide `significant` set) reaches **0 unexplained entries** for all three
packages: every wide flag is either fixed (call now present / converged) or
carries a justified baseline entry. The baseline only shrinks. CI fails on any
new wide flag not in the baseline. The narrow 0044 gate is unaffected.

## Non-goals

- Re-burning 0044's 23-pair narrow output (separate RFC, already active).
- Changing the committed `SIGNIFICANT_CALLS` allowlist or the narrow
  `call-mismatches-exclude.json` baseline.
- `super`-call fidelity (structurally dropped by the module-mixin port).
- arel real-omission stories — none found.
