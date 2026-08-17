---
rfc: "0084-wide-call-set-burndown"
title: "Wide call-set burn-down"
status: superseded
created: 2026-07-30
updated: 2026-08-15
owner: "@deanmarano"
packages:
  - activerecord
  - arel
  - activesupport
  - "actionview"
clusters:
  - "api-compare"
related-rfcs:
  - "0047"
  - "0083"
priority: 2
superseded-by: "0106-wide-call-set-direct-burndown"
---

# Wide call-set burn-down

## RETIRED 2026-08-14 — superseded by RFC 0106

**Do not file new stories here.** This RFC's discovery-feed model is retired in
favour of [RFC 0106 — Wide call-set direct
burndown](../0106-wide-call-set-direct-burndown/README.md), which converges rows
directly rather than delegating them to the fidelity RFCs that own the
underlying defects.

Why the model was retired, measured 2026-08-14: the delegation half of it was
not running. All five fidelity RFCs this one feeds — 0051, 0075, 0076, 0077,
0078 — are `draft`, so none of their stories is claimable from the ready queue,
and **0075 and 0078 have never shipped a story** (0 done, 33 open between them).
Rows in the files those two own had nobody retiring them. Separately, the
population turned out to be a head rather than a long tail: 1,134 in-scope rows
across 217 files, but the top 25 files carry 569 of them (50%) and `relation.ts`
alone carries 117 — which makes a scheduled wave plan viable in a way the
original survey did not anticipate.

**Closed 2026-08-15**, on schedule and with nothing orphaned. It was held
`active` past the supersession only so its one remaining claimed story,
`adapter-non-boolean-prepared-statements-config-raises`, could finish where its
agent had claimed it; that landed in PR #6556 and the auto-close pass retired
the RFC the same day. Everything else moved first:
`burn-down-surfaced-empty-call-rows` and `align-collect-calls-name-filter-with-ruby`
were re-filed verbatim under 0106 (with fresh slugs — story ids are globally
unique) and closed here as superseded.

Draining the open stories before closing was deliberate: a superseded RFC's
open stories are silently unclaimable and nothing reports them, which is the
drift RFC 0091 tracks. Follow the same order if another RFC is superseded.

What carries forward unchanged: the row count is the debt metric (the
2026-08-04 decision in `## The debt metric is the row count` below), the
only-shrink ratchet, the unreviewed high-water marks, the reseed-drift arm and
the sharding. 0106 changes who converges the rows and on what schedule — not
the mechanism.

## Summary

Drive the RFC 0047 wide call-set ratchet toward zero by converging the entries
that represent real call-shape divergence between a Rails body and its trails
port — **and by feeding the divergence nobody has filed yet into the fidelity
RFCs that own it.**

This RFC is a **discovery feed, not a parallel convergence campaign.** That
framing is the result of a survey (2026-07-30) of all 92 open stories across the
five open fidelity RFCs, cross-referenced against the live wide artifact. The
survey is the reason B4 and B5 were dropped before this RFC was ever scheduled.

## Survey: what the wide list does and does not overlap

| Measure                                                                 | Open stories |  Share |
| ----------------------------------------------------------------------- | -----------: | -----: |
| Total open across 0051 / 0075 / 0076 / 0077 / 0078                      |           92 |      — |
| Wide list has a row on the **same file and same method**                |           39 |    42% |
| Wide list has a row whose **missing call is the story's actual defect** |        **8** | **9%** |

The gap between 42% and 9% is the finding. The gate keeps landing on the same
_methods_ the fidelity RFCs are working on while flagging a _different defect_
in them:

- `bound-reflection-stale-after-add-index` (0078) — the wide row on
  `remove_index` is `quote_column_name` / `quote_table_name`, nothing to do with
  reflection staleness.
- `dialect-quotestring-returns-literal-not-escape-only` (0077) — the wide row on
  `quote` is a missing `check_int_in_range`.
- `sqlite-copy-table-family-bypasses-execute-primitives` (0076) — the wide row on
  `alter_table` is `strip_table_name_prefix_and_suffix`.

### Why: the gate detects exactly one defect shape

`significantMissingCalls` (`compare.ts:242-286`) answers one question — Rails'
body calls `M`, does the TS body call `M`? Everything else is invisible:

| Defect shape                                           | Gate        | Example open story                                         |
| ------------------------------------------------------ | ----------- | ---------------------------------------------------------- |
| Missing call to a ported method                        | **visible** | `inline-mysql-exec-mutation-indirection`                   |
| Invented / extra behavior Rails does not have          | blind       | `mysql-quote-column-name-star-branch-invented`             |
| Wrong return value or semantics of a call that IS made | blind       | `replace-records-gate-on-concat-return-not-rollback-catch` |
| Wrong values / literals                                | blind       | `SchemaCreation typeToSql uppercases native type names`    |

The "wrong values / literals" row is now addressed by a separate dimension:
RFC 0095 (spiked 2026-08-08) measured 77% genuine divergence
over 102 hand-classified rows and charters a narrowed `parity:api:calls:args` gate
over **its own** baseline tree — deliberately not folded into
`call-mismatches-exclude`, whose row count is this RFC's debt metric. Its
headline finding is filed here as
`converge-arel-visitor-helper-collector-parameter-position`.
| Ordering / state / memoization | blind | `Migrator loads the migration outside the rescue` |
| Structural / class-shape | blind | `Split trails' merged Migrator into MigrationContext + Migrator` |
| Type-level enforcement | blind | `schema-quoter-host-contract-not-compile-enforced` |

RFC 0077 is the sharpest case: 13 open stories, essentially none missing-call
shaped. Burning the wide list to zero would not touch a single one of them.

## Scope: activerecord and its dependencies only (2026-08-11)

This RFC is scoped to the **data layer** — activerecord, activemodel,
activesupport, arel, and the adapter/connection code activerecord depends on —
which is exactly what `packages` declares. The wide artifact spans all 15
packages, so it is easy to file a row from actionpack here by accident: four
such stories (`port-exception-wrapper-build-backtrace`,
`port-request-get-post-param-builder`, `port-request-initialize-rack-request`,
`port-system-testing-driver-browser`) were closed as out of scope on 2026-08-11.

**When you triage a wide row, check the package first.** A row under
`packages/actionpack/**`, `packages/actiondispatch/**`, `packages/actionview/**`,
`packages/actioncontroller/**`, `packages/rack/**`, `packages/trailties/**`,
actionmailer, activejob, actioncable or activestorage does not get a story here
— those rows stay in the baseline until a non-data-layer RFC exists. Filing one
anyway just spends a review cycle on a close.

## Bundles

| Bundle | Scope                                                                                          | ~Rows | ~PRs |
| ------ | ---------------------------------------------------------------------------------------------- | ----: | ---: |
| B1     | arel visitors — `collect_nodes_for`, `maybe_visit`, `infix_value` inlined instead of called    |   ~90 |    3 |
| B2     | permanent-deviation annotation — `synchronize` (~30) plus the 349 already-verified equivalents |  ~380 |    2 |
| B3     | associations residual (after the property-access tooling story)                                |   ~70 |    2 |
| B6     | non-AR — actiondispatch mapper + route-set, actioncontroller, activesupport callbacks          |  ~110 |    4 |

Order: **B1 → B2 → B3 → B6.**

### Dropped before scheduling: B4 (relation cluster) and B5 (adapter cluster)

Both duplicated work already owned elsewhere, on the same files — exactly the
file-overlap conflict the repo's one-agent-per-PR model exists to prevent.

- **B5 (adapter cluster, ~200 rows)** overlaps RFC 0076
  (`execute/raw_execute/perform_query` primitive convergence, 19 open stories),
  RFC 0051 and RFC 0077 — all targeting `postgresql-adapter.ts`,
  `sqlite3-adapter.ts`, `abstract-mysql-adapter.ts`. RFC 0076 is the one
  genuinely call-shaped fidelity RFC: the wide list carries 152 rows in the
  execute-primitive family (`execute`, `raw_execute`, `internal_exec_query`,
  `perform_query`, `log`, `query_value`, `with_connection`), concentrated in
  exactly those files.
- **B4 (relation cluster, ~230 rows)** overlaps 24 open stories in RFC 0023,
  5 in RFC 0072, plus 0073 and 0082 — all touching
  `packages/activerecord/src/relation.ts` or `relation/`.

Those rows are not abandoned: they become acceptance criteria on the stories
that already own the code (see below), not a second campaign against the same
files.

## How this RFC actually operates

1. **Do not treat the wide list as a work list.** Before filing or claiming any
   convergence work off it, check whether an open story in another RFC already
   owns the file — 42% of the time one does.
2. **Feed the leftovers.** After `0083-wide-call-ratchet-noise-reduction` lands,
   run `pnpm parity:api:calls --report`, subtract rows covered by open stories in
   other RFCs, and file what remains as new stories under the RFC that owns that
   area. That is how RFC 0047 was chartered in the first place.
3. **Hand verified rows to their owners.** Where a wide row IS a story's actual
   defect, the story gains a free acceptance criterion: "the wide baseline entry
   for `<file> <method> <call>` is removed." The eight identified by the survey
   have had this added:

   | Story                                                        | RFC  |
   | ------------------------------------------------------------ | ---- |
   | `migration-join-table-delegate-to-derive-join-table-name`    | 0051 |
   | `table-definition-primary-keys-is-a-reader-not-rails-setter` | 0051 |
   | `require-host-receiver-quote-table-name-for-assignment`      | 0077 |
   | `schema-quoter-host-contract-not-compile-enforced`           | 0077 |
   | `reset-column-information-recurse-descendants`               | 0078 |
   | `subclass-tablename-columns-clobbered-by-base-load`          | 0078 |
   | `replace-mid-load-settarget-raise-with-loaded-flag-yield`    | 0075 |
   | `inline-mysql-exec-mutation-indirection`                     | 0076 |

## Dependencies

**All landed — this RFC is unblocked (verified 2026-08-04).**

- `ruby-extractor-record-call-receiver-kind` (done, PR #5726) and
  `resolve-wide-candidates-through-include-graph` (done, PR #5755) landed
  2026-07-31.
- `missing-rails-call-tag-suppresses-wide-flag` (done, PR #5754) landed
  2026-07-31 — B2 is unblocked too.

### Re-measure (2026-08-04, forced full-build compare)

Live artifact matches the baseline exactly: 2,216 rows, 0 new, 0 stale.
Post-noise-reduction counts vs the 2026-07-30 projections:

| Figure                   | Projected | Measured |
| ------------------------ | --------: | -------: |
| B1 arel                  |       ~90 |       41 |
| B2 `synchronize` rows    |       ~30 |       51 |
| B2 reviewed-reason rows  |       349 |      190 |
| B3 association files     |       ~70 |      180 |
| Execute-primitive family |       152 |       80 |
| `relation.ts`            | 338 (183) |      143 |

B3's "most will evaporate" claim did not hold: the residual is still
dominated by `owner` / `reflection` / `klass` getter-shape rows despite
`ts-extractor-record-this-property-access` landing (PR #4656).
`significantMissingCalls` now sits at `compare.ts:274` (the RFC's original
`242-286` cite has drifted). Open fidelity stories across
0051/0075/0076/0077/0078: 85 as of 2026-08-04 (92 at survey time; 7 done
since). Of the eight hand-verified stories above,
`table-definition-primary-keys-is-a-reader-not-rails-setter` (0051) is now
done; the other seven remain ready with the criterion intact.

B1 has been split into three PR-sized slices (filed 2026-08-04):
`arel-tosql-statement-visitor-helper-calls`,
`arel-dialect-visitor-helper-calls`,
`arel-nodes-manager-residual-classification`.

## The debt metric is the row count

Decided 2026-08-04 (story `row-count-is-debt-not-seeded-reasons`). This RFC's
burndown is measured in **wide baseline rows**, not in reviewed reasons.

Rows: 6,845 (2026-07-17) → 2,218 (2026-08-03) → 2,195 (2026-08-04). Unreviewed
reasons over the same window: 2,028 of 2,218 (91%) → 2,005 of 2,195 (91%). Rows
converge by **deletion** — the port starts making the call and the row goes
stale — so the reason a reviewer would have demanded is one a later PR removes
outright. The flat 91% is the measurement: per-row reason review is not
happening, and cycles spent demanding it produce no convergence.

Consequences, recorded in [CONTRIBUTING.md] and [CLAUDE.md]:

- Progress is reported in rows retired.
- An author still writes a real reason for a row they add, and
  `@missingRailsCall` at the call site is still the per-site alternative.
  Reviewed reasons stay fully supported for rows an author chooses to justify.
- Seeded reasons **inherited** in rows a PR did not add are not that PR's debt
  and are not grounds to block it.

No mechanism changes. The only-shrink row ratchet, the per-file unreviewed
high-water marks (`scripts/api-compare/call-mismatches-wide-unreviewed/`), the
stale-tag arm, the reseed-drift arm and the sharding are untouched — each has a
paid-for incident behind it (#4020, #5869), and the unreviewed marks still stop
the count from growing. What changes is where reviewer attention goes.

## Non-goals

- **Not non-data-layer packages.** See Scope.

- **Not a substitute for the fidelity RFCs.** The survey settles this: 9% of
  open fidelity work is visible to this gate. Do not repoint fidelity effort
  here.
- **No mechanical loosening.** The ratchet, the unreviewed marks, the
  reseed-drift arm and the sharding stay exactly as they are; this is a
  reviewer-attention decision, not a gate change.
- No tooling changes — those belong to `0083-wide-call-ratchet-noise-reduction`.
  If a bundle turns up a new tooling artifact, file it there.
- Not converging entries that are correct deviations. Where the port is right
  and Rails' call genuinely does not apply, the outcome is a reasoned
  `@missingRailsCall` tag, not a code change. Deviations still converge by
  default — the burden is on the entry to justify itself.

## Why bundle stories, not per-PR stories

The residual population is not knowable until `0083`'s audit
(`audit-wide-cross-file-mixin-attribution`) and receiver-scoping land; the
projections here come from instrumented probe runs on the 2026-07-30 tree.
Each bundle story begins by re-measuring with `--report`, checking for an
existing owner, and only then splitting into PR-sized slices.
