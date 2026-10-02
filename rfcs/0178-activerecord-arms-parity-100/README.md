---
rfc: "0178-activerecord-arms-parity-100"
title: "activerecord control-flow arms, void returns and duck-type guards at zero — split from RFC 0174"
status: active
created: 2026-10-02
updated: 2026-10-02
owner: "@deanmarano"
packages:
  - "activerecord"
clusters:
  - arms
related-rfcs:
  - "0174-activerecord-api-parity-100"
  - "0113-branch-and-guard-parity"
  - "0127-fidelity-tooling-signals-and-hygiene"
  - "0156-parity-beyond-name-presence"
  - "0172-arel-parity-100"
  - "0173-activemodel-parity-100"
priority: 2
---

# RFC 0178 — activerecord control-flow arms, void returns and duck-type guards at zero

## Summary

This RFC holds activerecord's residue on the three report-only **body-shape** axes: the arms report
(`pnpm parity:api:arms:report`), void returns (`pnpm parity:api:returns`) and duck-type guards
(`pnpm parity:api:duck-types`). It was split out of `0174-activerecord-api-parity-100` on 2026-10-02 and
took the 53 stories of 0174's `arms` cluster with it. 45 of them are open, at 17,848 est-loc. One more
story was filed with the split (§ "Blocked") and two unestimated ones were sized, so the RFC opens with
54 stories, 46 of them open, at 18,448 est-loc. The
destination of a story is decided by one question: **which report does the row it deletes come from?**

## Motivation

RFC 0174 was seeded on 2026-09-30 with 127 stories on every source-side parity axis. Two days later it
held 319. It was too big to read as one backlog, and one cluster dominated it:

| Slice of 0174 (2026-10-02, from the DB)  | Stories | Open | Open est-loc |
| ---------------------------------------- | ------- | ---- | ------------ |
| `arms` cluster + 5 unclustered arms rows | 53      | 45   | 17,848       |
| everything else                          | 266     | 219  | 39,465       |

The arms stories also work differently from the rest of 0174. Every other cluster deletes rows from a
gated register (a baseline shard, a skip group, an exclude file, a receipt). These stories work from a
**report nothing gates on**, so the row lists in their bodies go stale as sibling stories land, and each
story has to re-measure before it starts. They share one extractor (`scripts/api-compare/`), one fold, and
one set of false-positive classes. A reader looking for arms prior art had to filter 319 rows to find it.

### Baseline

Measured 2026-10-02 on trails `main` @ `5659ce9eb3` after a clean `pnpm build` and
`API_COMPARE_FORCE=1 pnpm parity:api --calls`. The 0174 column is that RFC's own baseline, measured
2026-09-30 @ `ea7d456048`.

| Axis                                   | 0174 baseline | Now              | Target        | Where the residue lives                                                        |
| -------------------------------------- | ------------- | ---------------- | ------------- | ------------------------------------------------------------------------------ |
| arms report, missing direction (pairs) | 129           | 38 in 23 files   | 0, then gated | `postgresql-adapter.ts` 7, `sqlite3-adapter.ts` 5, `tasks/database-tasks.ts` 3 |
| arms report, invented direction        | 903           | 824 in 188 files | 0             | `relation.ts` 24, `relation/query-methods.ts` 21, `tasks/database-tasks.ts` 20 |
| `parity:api:returns` (activerecord)    | 51            | 22               | 0             | models and tasks                                                               |
| `parity:api:duck-types` (activerecord) | 8             | 9                | 0             | 9 bodies, one of them `postgresql-adapter.ts#translateException` (blocked)     |

14 of the 38 missing pairs are also invented pairs (`missing-arm + invented-arm`). The short-circuit
projection (858 pairs over the `or` / `and` tokens) is not a target of this RFC: the arm verdicts do not
read it, and `activerecord-gate-report-only-arm-tokens` names it as out of the gate.

Five of the six missing-arm stories are done, and 38 missing pairs remain. Some of those are produced by
the fold, not by the port: see the two `arms-report-*` stories. Count Rails' real arms before porting a
missing one.

## Design

### Scope

**In:** a story whose acceptance criteria delete an activerecord row from the arms report, the void-return
report or the duck-type report, and a story that fixes the extractor or fold behind those reports
(`scripts/api-compare/report-arms.ts`, `extract-ts-api.ts#extractSkeleton`, `enumerable-idioms.ts`,
`report-void-returns.ts`, `report-duck-type-instanceof.ts`) where an activerecord row shows the fault.

### Where a story goes

This table is repeated in 0174 § "Split: RFC 0178".

| The row a story deletes is in                                                    | File it in                         |
| -------------------------------------------------------------------------------- | ---------------------------------- |
| `parity:api:arms:report`, `parity:api:returns` or `parity:api:duck-types`        | here                               |
| the extractor or fold behind those three reports (`scripts/api-compare/`)        | here                               |
| `parity:api:arms:throws`, `:blocks`, `:parents` (gated, owned by RFCs 0127/0156) | `0174-activerecord-api-parity-100` |
| any other activerecord source-side axis                                          | `0174-activerecord-api-parity-100` |

A story that deletes rows on two axes goes where its first acceptance criterion points. A story that a
story in 0174 depends on stays in 0174: `quoted-date-usec-arm-is-relocated-into-sql-datetime` names an arms
row and did not move, because `sql-datetime-formatters-fold-into-quoted-date-and-quoted-time` depends on it.

### Principles

These are 0174's, unchanged:

- **Converge, never ratify.** A story removes arms Rails does not have and restores arms Rails does. None
  adds a baseline row, a receipt or a skip.
- **Blocked, not ratified.** Where a body cannot take Rails' shape, the story is `blocked` with the
  concrete blocker.
- **Measurement faults are fixed in the tool.** A row the comparer manufactures is fixed in the extractor
  with a unit test, not by editing a correct port.
- **Each story is one PR**, `est-loc` ≤ 650. A leftover is filed here as its own story with the Rails
  `file:line`, as `activerecord-statement-pool-threads-pending-dealloc-through-ternaries` was.
- **Re-measure first.** The reports are not gated, so a story's row list is the list on the day it was
  seeded. Run the report for the story's files before starting and work from that.

### Ordering

- Each invented-arm story depends on the missing-arm story of the same area, so the branch structure is
  restored before invented guards are removed. Five of those six missing-arm stories are done, so 31
  invented-arm stories are claimable now.
- `activerecord-gate-report-only-arm-tokens` depends on `audit-loop-try-rescue-arm-strata-for-gating`
  (RFC 0127, draft), which measures the noise floor. It is the last story here: activerecord joins the
  missing-arm gate at 0.
- `activerecord-duck-type-instanceof-to-respond-to` depends on `pg-translate-exception-respond-to-result`,
  which is blocked on `pg-driver-errors-carry-a-result-at-the-raw-connection-boundary` (see § "Blocked").
- The three extractor stories have no dependencies. Each one that lands shrinks the row lists of the
  stories behind it, so they are worth taking early.

### Gating

- **`active` from birth**, for 0174's reason: `claimable()` surfaces a story only when its own RFC is
  `active`. 33 stories here were claimable in 0174 and stay claimable.
- **Edges out of this RFC:** `audit-loop-try-rescue-arm-strata-for-gating` (RFC 0127) and
  `parity-100-rehome-postponed-rfc-dependencies` (RFC 0174, done). There are no others.
- **Edges into this RFC:** `activerecord-api-parity-100-close-out` (RFC 0174) only. It names 43 of these
  stories in `deps`. After this split merges, those are replaced by one `deps-rfc` edge on this RFC, so the
  0174 close-out waits for everything here, including stories filed later.

### After merge

Three dependency edits name something that does not exist on main until this RFC merges, and
`tasks set-deps` / `tasks set-deps-rfc` refuse a dangling reference. They run once it has merged. The 43
slugs are the entries of the close-out's `deps` whose story file is under this RFC's `stories/`:

```bash
tasks set-deps-rfc activerecord-api-parity-100-close-out --add 0178-activerecord-arms-parity-100
tasks set-deps activerecord-api-parity-100-close-out --remove <the 43 moved slugs it names>
tasks set-deps pg-translate-exception-respond-to-result --add pg-driver-errors-carry-a-result-at-the-raw-connection-boundary
```

Until then the close-out's 43 story-level edges gate it exactly as they did in 0174.

## Blocked

- `pg-translate-exception-respond-to-result`: node-pg errors share no class, marker or result carrier, so
  one duck test at `postgresql_adapter.rb:802`'s position cannot separate a driver error from any other
  `Error`. Its prerequisite is `pg-driver-errors-carry-a-result-at-the-raw-connection-boundary`, filed with
  this split from the story's own `blocked-by`. The story stays `blocked` until that lands; unblocking is a
  `tasks` verb, not an edit here.

## Non-goals

- **The gated arm axes.** `parity:api:arms:throws`, `parity:api:blocks` and `parity:api:parents` stay with
  their owning stories in RFCs 0127 and 0156, and 0174 tracks them.
- **The short-circuit projection.** The `or` / `and` token mismatches are not read by the arm verdicts and
  have no stories here.
- **Other packages' arms.** arel (RFC 0172) and activemodel (RFC 0173) carry their own arms stories.
  `activerecord-gate-report-only-arm-tokens` builds the gate those packages enroll in first, and is here
  because activerecord is the last package to join it.
- **Void returns and duck-type guards outside activerecord.** The reports list 34 and 10 such pairs in
  other packages. They belong to those packages' RFCs.
- **A close-out story.** 0174's close-out re-measures these three axes with every other one. A second
  close-out here would measure the same rows twice.

## Alternatives considered

I listed all 319 stories in 0174 from the DB and computed, for each cluster, the open story count, the
open est-loc, and every `deps` edge that crosses the cluster boundary in either direction.

- **Split out the `arms` cluster (chosen).** 40 open stories at 17,218 est-loc, 8 done (17%), none claimed
  or in a PR. One mechanism. One edge to another open 0174 story
  (`pg-translate-exception-respond-to-result`, which only an arms story depends on, so it moved too), one
  edge to RFC 0127, and no inbound edge except the close-out. No trails source cites any moved slug.
- **Split out `receipts`** (59 open, 13,460 est-loc): rejected. It is three unrelated things under one
  label: call-gate crediting rules, PERMANENT receipt audits, and one-off subsystem convergences.
  `placement` and `skips` stories depend on it, so the split would leave edges in both directions.
- **Split out `placement`** (12 open, 5,100 est-loc): rejected. It depends on two receipts stories and a
  skips story, and a calls-args story depends on it.
- **Split out `excluded-files`** (10 open, 2,630 est-loc): rejected. RFC 0175, `skips` and `calls-args` all
  depend into it, and 2 of the 10 are blocked.
- **Split out `errors`, `api-surface`, `skips`, `pins` or `tooling`**: rejected. Each is clean, and each is
  2 to 6 open stories. That is not enough to earn an RFC.
- **Split out the 115 unclustered stories as a surfaced-deviations bucket**: rejected for this split. They
  share no mechanism, and 0174's own Open question 1 already owns that decision.
- **Split by subsystem** (connection adapters, relation, associations): rejected. Every axis cluster cuts
  across every subsystem, so each new RFC would carry a slice of every cluster and its cross-edges.
- **Move only the arms-report stories and leave void returns and duck types in 0174**: rejected. That
  leaves 3 stories in 0174 under a cluster whose other 50 are gone. All three reports are report-only
  body-shape axes over the same extractor, and 0174's Rollout already ran them as one step.
- **Leave the 8 done stories in 0174**: rejected, for the reason RFC 0158 gives. The invented-arm stories
  depend on the done missing-arm stories, and the leftover stories cite the done ones by slug. Keeping
  them together keeps the prior art beside the open work.

## Rollout

Status is from the DB as of 2026-10-02. Done stories are listed with their PR.

1. **Extractor and fold faults.** 3 stories, 3 open, 460 est-loc. These go first because each one removes
   rows from the stories below.
   - Draft: `arms-extractor-reads-a-kwargs-rebinding-guard`,
     `arms-report-fold-credits-idiom-arms-by-presence`,
     `arms-report-idiom-fold-and-catch-all-else-manufacture-missing-arms`
2. **Missing arms.** 8 stories, 3 open, 1,000 est-loc.
   - Ready: `activerecord-converge-missing-control-flow-arms-connection-adapters-part-2`
   - Draft: `column-deduplicated-drops-the-string-dedup-arms`,
     `composite-primary-key-predicate-reads-the-primary-key-setter-ivar`
   - Done: `activerecord-converge-missing-control-flow-arms-root` (trails#8357),
     `activerecord-converge-missing-control-flow-arms-connection-adapters-part-1` (trails#8351),
     `activerecord-converge-missing-control-flow-arms-associations` (trails#8353),
     `activerecord-converge-missing-control-flow-arms-relation` (trails#8354),
     `activerecord-converge-missing-control-flow-arms-subsystems` (trails#8358)
3. **Invented arms.** 37 stories, 35 open, 15,908 est-loc. All share the slug prefix
   `activerecord-converge-invented-control-flow-arms-` unless written out in full.
   - Ready, root files: `root-a-f-part-1`, `-part-2`, `-part-3`, `root-g-p-part-1`, `-part-2`, `-part-3`,
     `root-q-z-part-1`, `-part-2`, `-part-3`
   - Ready, associations: `associations-part-1` to `-part-5`
   - Ready, relation: `relation-part-1`, `-part-2`, `-part-3`
   - Ready, connection adapters: `connection-adapters-root-part-1`, `-part-2`,
     `connection-adapters-abstract-part-1`, `-part-2`, `connection-adapters-mysql-sqlite3`,
     `connection-adapters-postgresql-part-1`, `-part-2`
   - Ready, other: `encryption-part-1`, `-part-2`, `subsystems-part-1`, `-part-2`, `-part-3`,
     `tasks-part-1`, `-part-2`
   - Draft (leftovers, full slugs):
     `activerecord-sqlite3-new-client-is-one-async-body-with-timeout-in-configure-connection`,
     `activerecord-statement-pool-threads-pending-dealloc-through-ternaries`,
     `association-query-value-and-polymorphic-array-value-carry-invented-arms`,
     `time-zone-conversion-infinite-arms-inline-the-rails-expression`
   - Done: `connection-adapters-abstract-part-3` (trails#8403), `connection-adapters-root-part-3`
     (trails#8387)
4. **Void returns.** 2 stories, 1 open, 300 est-loc.
   - Ready: `activerecord-converge-void-returns-models-and-tasks`
   - Done: `activerecord-converge-void-returns-adapters` (trails#8398)
5. **Duck-type guards.** 3 stories, 3 open, 580 est-loc.
   - Draft: `pg-driver-errors-carry-a-result-at-the-raw-connection-boundary`
   - Blocked on it: `pg-translate-exception-respond-to-result`
   - Ready, waiting on the blocked story: `activerecord-duck-type-instanceof-to-respond-to`
6. **Gate.** 1 story, 200 est-loc.
   - Ready, waiting on RFC 0127: `activerecord-gate-report-only-arm-tokens`

## Stories

All 54, by Rollout group. Status is DB-owned and is not repeated here: `pnpm tasks list --rfc
0178-activerecord-arms-parity-100`.

| Story                                                                                    | est-loc | Group         |
| ---------------------------------------------------------------------------------------- | ------- | ------------- |
| `arms-extractor-reads-a-kwargs-rebinding-guard`                                          | 140     | extractor     |
| `arms-report-fold-credits-idiom-arms-by-presence`                                        | 120     | extractor     |
| `arms-report-idiom-fold-and-catch-all-else-manufacture-missing-arms`                     | 200     | extractor     |
| `activerecord-converge-missing-control-flow-arms-associations`                           | 360     | missing arms  |
| `activerecord-converge-missing-control-flow-arms-connection-adapters-part-1`             | 600     | missing arms  |
| `activerecord-converge-missing-control-flow-arms-connection-adapters-part-2`             | 600     | missing arms  |
| `activerecord-converge-missing-control-flow-arms-relation`                               | 432     | missing arms  |
| `activerecord-converge-missing-control-flow-arms-root`                                   | 600     | missing arms  |
| `activerecord-converge-missing-control-flow-arms-subsystems`                             | 600     | missing arms  |
| `column-deduplicated-drops-the-string-dedup-arms`                                        | 150     | missing arms  |
| `composite-primary-key-predicate-reads-the-primary-key-setter-ivar`                      | 250     | missing arms  |
| `activerecord-converge-invented-control-flow-arms-associations-part-1`                   | 560     | invented arms |
| `activerecord-converge-invented-control-flow-arms-associations-part-2`                   | 554     | invented arms |
| `activerecord-converge-invented-control-flow-arms-associations-part-3`                   | 560     | invented arms |
| `activerecord-converge-invented-control-flow-arms-associations-part-4`                   | 542     | invented arms |
| `activerecord-converge-invented-control-flow-arms-associations-part-5`                   | 560     | invented arms |
| `activerecord-converge-invented-control-flow-arms-connection-adapters-abstract-part-1`   | 560     | invented arms |
| `activerecord-converge-invented-control-flow-arms-connection-adapters-abstract-part-2`   | 560     | invented arms |
| `activerecord-converge-invented-control-flow-arms-connection-adapters-abstract-part-3`   | 380     | invented arms |
| `activerecord-converge-invented-control-flow-arms-connection-adapters-mysql-sqlite3`     | 356     | invented arms |
| `activerecord-converge-invented-control-flow-arms-connection-adapters-postgresql-part-1` | 560     | invented arms |
| `activerecord-converge-invented-control-flow-arms-connection-adapters-postgresql-part-2` | 374     | invented arms |
| `activerecord-converge-invented-control-flow-arms-connection-adapters-root-part-1`       | 560     | invented arms |
| `activerecord-converge-invented-control-flow-arms-connection-adapters-root-part-2`       | 560     | invented arms |
| `activerecord-converge-invented-control-flow-arms-connection-adapters-root-part-3`       | 140     | invented arms |
| `activerecord-converge-invented-control-flow-arms-encryption-part-1`                     | 560     | invented arms |
| `activerecord-converge-invented-control-flow-arms-encryption-part-2`                     | 374     | invented arms |
| `activerecord-converge-invented-control-flow-arms-relation-part-1`                       | 536     | invented arms |
| `activerecord-converge-invented-control-flow-arms-relation-part-2`                       | 560     | invented arms |
| `activerecord-converge-invented-control-flow-arms-relation-part-3`                       | 254     | invented arms |
| `activerecord-converge-invented-control-flow-arms-root-a-f-part-1`                       | 560     | invented arms |
| `activerecord-converge-invented-control-flow-arms-root-a-f-part-2`                       | 536     | invented arms |
| `activerecord-converge-invented-control-flow-arms-root-a-f-part-3`                       | 542     | invented arms |
| `activerecord-converge-invented-control-flow-arms-root-g-p-part-1`                       | 560     | invented arms |
| `activerecord-converge-invented-control-flow-arms-root-g-p-part-2`                       | 542     | invented arms |
| `activerecord-converge-invented-control-flow-arms-root-g-p-part-3`                       | 278     | invented arms |
| `activerecord-converge-invented-control-flow-arms-root-q-z-part-1`                       | 554     | invented arms |
| `activerecord-converge-invented-control-flow-arms-root-q-z-part-2`                       | 560     | invented arms |
| `activerecord-converge-invented-control-flow-arms-root-q-z-part-3`                       | 458     | invented arms |
| `activerecord-converge-invented-control-flow-arms-subsystems-part-1`                     | 560     | invented arms |
| `activerecord-converge-invented-control-flow-arms-subsystems-part-2`                     | 518     | invented arms |
| `activerecord-converge-invented-control-flow-arms-subsystems-part-3`                     | 194     | invented arms |
| `activerecord-converge-invented-control-flow-arms-tasks-part-1`                          | 536     | invented arms |
| `activerecord-converge-invented-control-flow-arms-tasks-part-2`                          | 170     | invented arms |
| `activerecord-sqlite3-new-client-is-one-async-body-with-timeout-in-configure-connection` | 220     | invented arms |
| `activerecord-statement-pool-threads-pending-dealloc-through-ternaries`                  | 200     | invented arms |
| `association-query-value-and-polymorphic-array-value-carry-invented-arms`                | 300     | invented arms |
| `time-zone-conversion-infinite-arms-inline-the-rails-expression`                         | 30      | invented arms |
| `activerecord-converge-void-returns-adapters`                                            | 400     | void returns  |
| `activerecord-converge-void-returns-models-and-tasks`                                    | 300     | void returns  |
| `activerecord-duck-type-instanceof-to-respond-to`                                        | 250     | duck types    |
| `pg-driver-errors-carry-a-result-at-the-raw-connection-boundary`                         | 250     | duck types    |
| `pg-translate-exception-respond-to-result`                                               | 80      | duck types    |
| `activerecord-gate-report-only-arm-tokens`                                               | 200     | gate          |

## Verification

Each on a clean `pnpm build` followed by `API_COMPARE_FORCE=1 pnpm parity:api --calls`:

- `pnpm parity:api:arms:report --package=activerecord --direction=missing` reports 0 pairs, down from 38.
- `pnpm parity:api:arms:report --package=activerecord --direction=invented` reports 0 pairs, down from 824.
- `pnpm parity:api:returns` lists no activerecord pair, down from 22.
- `pnpm parity:api:duck-types` lists no activerecord pair, down from 9.
- activerecord is enrolled at 0 in the missing-arm mark `activerecord-gate-report-only-arm-tokens` adds.
- `pnpm tasks list --rfc 0178-activerecord-arms-parity-100` shows no open story.

## End condition

This RFC closes when every Verification line holds. `activerecord-api-parity-100-close-out` (RFC 0174)
waits on that, and re-measures the same axes when it pins the package at zero.

## Open questions

None is open. Each was resolved before the RFC went `active`.

1. **Who stamps node-pg driver errors with a result carrier?** Resolved: filed here as
   `pg-driver-errors-carry-a-result-at-the-raw-connection-boundary`. The duck-type report scores the row it
   unblocks, so the routing table sends it here.
2. **Do the 31 open invented-arm stories still match the report?** Resolved: not re-cut. They were seeded
   from the 903-pair list of 2026-09-30 and the report is at 824, because the two done invented-arm stories
   and the missing-arm stories removed rows. Each story body lists its own `file#method` rows, so a landed story does
   not move rows between the open ones. Each story re-measures its own files first (§ "Principles"), and one whose rows
   are all gone is closed with `tasks close` and that reason.
3. **Should the five unclustered stories get `cluster: arms`?** Resolved: yes, set in this split. Those five
   files differ from main by their `rfc:` and `cluster:` lines (two of them also by `title:` and `est-loc:`);
   the other 48 by `rfc:` alone.

## Changelog

- 2026-10-02: created by splitting the `arms` cluster out of `0174-activerecord-api-parity-100`. 53
  stories moved (8 done, 35 ready, 9 draft, 1 blocked). Each moved story changes only its `rfc:` line,
  and the five that were unclustered also take `cluster: arms`. Two of those five had a slug for a title
  and no `est-loc`; both are set. One story was filed with the split:
  `pg-driver-errors-carry-a-result-at-the-raw-connection-boundary`.
