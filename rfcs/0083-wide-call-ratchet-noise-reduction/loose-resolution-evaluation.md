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
API_COMPARE_FORCE=1 pnpm api:compare --wide-calls # writes output/call-mismatches-wide.json
pnpm tsx scripts/api-compare/audit-cross-file-calls.ts                 # summary
pnpm tsx scripts/api-compare/audit-cross-file-calls.ts --loose-sample  # one JSON row per resolution
```

Each `--loose-sample` line carries the paired `tsFile` / `tsName`, the missing
`call`, the file the loose rule resolved it in (`resolvedIn`), the edge kind
that reached that file (`include` or `delegation`), and the names of the methods
there that actually make the call (`resolvingMethods`).

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

Of the 264 loose rows whose resolving file is reached through a delegation edge:

| Property                                                       |  Rows |
| -------------------------------------------------------------- | ----: |
| resolving method set contains the paired method's own name     | **0** |
| resolves into the paired file itself (`resolvedIn === tsFile`) |    94 |
| resolves into a different file                                 |   170 |
| resolves across adapter families (pg ↔ mysql ↔ sqlite)         |    10 |
| distinct missing calls covered                                 |   101 |
| mean number of unrelated methods credited per row              |   3.5 |

## Classification of the sample

A deterministic every-9th-row sample (31 of 264) was read in full. **31 of 31
are unrelated-method credits**; 0 are same-concern ports. Representative rows:

| Paired method                                       | Missing call | Credited to                                                     |
| --------------------------------------------------- | ------------ | --------------------------------------------------------------- |
| `abstract/schema-statements.ts#checkConstraintName` | `first`      | `visitAddColumnDefinition` in `mysql/schema-creation.ts`        |
| `postgresql-adapter.ts#translateException`          | `match?`     | `checkConstraints` in `postgresql/schema-statements-class.ts`   |
| `postgresql-adapter.ts#createEnum`                  | `quote`      | `changeTableComment` in `postgresql/schema-statements-class.ts` |
| `migration.ts#isReverting`                          | `connection` | `commit` in `abstract/transaction.ts`                           |
| `relation.ts#size`                                  | `loaded?`    | `_associationCache` in `base.ts`                                |
| `routing/mapper.ts#shallow`                         | `new`        | `newChild` in `routing/scope.ts`                                |

That the same-name overlap is exactly 0 is structural, not accidental: the loose
rule only fires on rows the strict rule already failed, so **by construction**
every row it adds is a call made by some other method. The question the sample
answers is whether that other method is nevertheless the same concern — a body
split out of the paired one. It is not: the credits are dominated by generic
names (`first`, `size`, `map`, `new`, `values`, `connection`, `loaded?` — 101
distinct calls across 264 rows) landing on whichever of the ~3.5 methods in a
reachable file happens to use them.

Two subsets deserve calling out:

- **10 rows cross adapter families.** `postgresql-adapter.ts` credited with a
  call `mysql/schema-creation.ts` makes is precisely the per-adapter fidelity
  gap the gate exists to catch, and precisely what `cross-file-audit.md`
  identified as unsound about the `collaborator` bucket. The delegation edge
  does not fix that failure mode; it widens its reach.
- **94 rows resolve into the paired file itself.** They are the same-file
  transitive-closure case owned by `wide-calls-same-file-transitive-call-set`,
  already shipped for the strict path. They are not evidence for widening the
  graph rule, and counting them as such inflates the apparent benefit by 36%.

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
