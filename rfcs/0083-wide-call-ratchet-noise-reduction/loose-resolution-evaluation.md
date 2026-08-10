# Loose ("any method in the graph") wide-gate resolution — evaluation

Evaluation date: 2026-07-31. Story:
`evaluate-loose-any-method-wide-resolution` (RFC 0083). Producing script:
`scripts/api-compare/audit-cross-file-calls.ts` (trails), which this evaluation
extends with delegation-edge traversal (`reachableFiles`) and a row-level sample
mode (`--loose-sample`).

Companion to [`cross-file-audit.md`](cross-file-audit.md), which measured the
same population under include/extends edges only.

## Verdict

**Reject.** Every row the loose rule adds credits the paired method with a call
that a **different** method makes; the sample turned up no same-concern port
that strict resolution missed. The sound narrowing already exists and is already
scoped: `resolve-wide-candidates-through-include-graph`'s same-name rule — which
delegation edges do **not** improve (21 rows with them, 21 without).

No gate change, no baseline change, expected row delta 0.

## How to reproduce

```sh
pnpm build                                        # extractor needs fresh dist/*.d.ts
API_COMPARE_FORCE=1 pnpm parity:api --wide-calls # writes output/call-mismatches-wide.json
pnpm tsx scripts/api-compare/audit-cross-file-calls.ts                 # summary
pnpm tsx scripts/api-compare/audit-cross-file-calls.ts --loose-sample  # one JSON row per resolution
```

Each `--loose-sample` line carries the paired `tsFile` / `tsName`, the missing
`call`, and **every** resolution the loose rule admits — the file, the edge kind
that reached it (`include` or `delegation`), and the names of the methods there
that actually make the call. Reporting all of them, rather than a first match,
keeps the classification independent of traversal order.

The summary emits every headline figure below as a field:
`anyMethodInIncludeGraph`, `anyMethodInDelegationGraph`,
`sameNameInIncludeGraph`, `sameNameInDelegationGraph`, `anyMethodByEdgeKind`,
`anyMethodResolvedOnlyInOwnFile`, `anyMethodCrossingAdapterFamilies` and
`anyMethodWithSameNamedResolver`.

## Measured, on the 2026-07-31 tree

The tree has moved since the story was written (`wide-calls-same-file-transitive-call-set`
and the receiver-scoping work landed), so the artifact is **3251** (row, call)
pairs, not 3693, and every figure below is smaller than the story's. The shape
is unchanged.

| metric                                                        | include-graph only | + delegation edges |
| ------------------------------------------------------------- | -----------------: | -----------------: |
| strict — a same-named definition in a reachable file makes it |                 21 |                 21 |
| loose — ANY method in a reachable file makes it               |                252 |                458 |

The delegation edge buys **0 rows under same-name resolution** and **+206 under
the loose rule** — the story's +285 on the older, larger artifact. The entire
gain sits behind the relaxation, not behind the new edge.

Properties of the 458 loose rows, and of the 206 of them that no include edge
reaches (the population the delegation edge adds):

| Property                                                      | All 458 | Delegation-only 206 |
| ------------------------------------------------------------- | ------: | ------------------: |
| some resolver carries the paired method's own name            |   **0** |               **0** |
| resolvable only inside the paired file itself                 |     117 |                  94 |
| some resolution crosses adapter families (pg / mysql/ sqlite) |      51 |                   0 |
| distinct missing calls covered                                |     151 |                  89 |
| mean methods credited per row                                 |     8.2 |                 5.0 |

## Classification of the sample

A deterministic every-9th-row sample of the delegation-only population (23 of 206) was read in full. **23 of 23 are unrelated-method credits**; none is a
same-concern port that strict resolution missed. Representative rows:

| Paired method                                       | Missing call  | Credited to                                              |
| --------------------------------------------------- | ------------- | -------------------------------------------------------- |
| `abstract/schema-statements.ts#checkConstraintName` | `first`       | `visitAddColumnDefinition` in `mysql/schema-creation.ts` |
| `abstract-adapter.ts#log`                           | `instrument`  | `start` in `abstract/transaction.ts`                     |
| `postgresql-adapter.ts#resetBang`                   | `synchronize` | `commitTransaction` in `abstract/transaction.ts`         |
| `migration.ts#parseMigrationFilename`               | `first`       | `selectOne` in `abstract-adapter.ts`                     |
| `relation.ts#only`                                  | `slice`       | `respondToMissingFinder` in `base.ts`                    |
| `routing/route-set.ts#eagerLoadBang`                | `routes`      | `partitionedRoutes` in `journey/router.ts`               |

That the same-name overlap is exactly 0 is structural, not accidental: the loose
rule only fires on rows the strict rule already failed, so **by construction**
every row it adds is a call made by some other method. The question the sample
answers is whether that other method is nevertheless the same concern — a body
split out of the paired one. It is not: the credits are dominated by generic
names (`first`, `size`, `map`, `new`, `connection`, `loaded?` — 89 distinct
calls across 206 rows) landing on whichever of the ~5 methods in a reachable
file happens to use them.

Two subsets deserve calling out:

- **51 of the 458 rows resolve across adapter families**, including
  `postgresql-adapter.ts#enableExtension` missing `internal_exec_query` credited
  to `explain` in `mysql/database-statements.ts`, and
  `postgresql-adapter.ts#getAdvisoryLock` credited to `internalBeginTransaction`
  in `sqlite3/database-statements.ts`. That is precisely the per-adapter fidelity
  gap the gate exists to catch, and precisely what `cross-file-audit.md`
  identified as unsound about the `collaborator` bucket. These arrive through
  include edges rather than delegation ones — the loose rule is unsound on the
  graph the gate already has, before delegation edges are considered at all.
- **94 of the 206 delegation-only rows (46%) resolve nowhere but the paired file
  itself.** They are the same-file transitive-closure case owned by
  `wide-calls-same-file-transitive-call-set`, already shipped for the strict
  path. They are not evidence for widening the graph rule, and counting them as
  such inflates the apparent benefit by nearly half.

## If the relaxation is ever revisited

The narrowing that would keep it sound is the one the story names: restrict
resolution to the **delegation target's own file** (never the transitive graph),
and keep the **same-name** requirement. That combination is already measured —
it is the 21-row strict figure, identical with and without delegation edges — so
it buys nothing beyond what `resolve-wide-candidates-through-include-graph`
already covers. Dropping the same-name requirement is what produces the 206
rows, and that requirement is carrying all of the soundness.

`resolve-wide-candidates-through-include-graph` therefore stays scoped to strict
same-name resolution; this evaluation does not absorb it, and does not change
its measured delta.
