# Cross-file / mixin-attribution audit

Audit date: 2026-07-31. Story:
`audit-wide-cross-file-mixin-attribution` (RFC 0083). Producing script:
`scripts/api-compare/audit-cross-file-calls.ts` (trails, PR that carries this
audit).

## Headline

**The bucket is not 1606 rows and the include/extends graph does not resolve
it.** On the 2026-07-31 tree the wide artifact holds 5034 (row, call) pairs.
Walking the recorded include/extends graph resolves **28** of them. The widest
graph-based rule that could be written — "the candidate is called by ANY method
on ANY class reachable through includes/extends" — reaches **412** more. The
RFC's projected `−1100 to −1600` for
`resolve-wide-candidates-through-include-graph` is **not achievable by any
include-graph rule**, because 73% of flagged rows sit in a TS file that declares
no include/extends edge at all.

The reason is structural, and it is the same fact the story's Context already
states from the other side: trails does not mix `PostgreSQL::SchemaStatements`
into `PostgreSQLAdapter`. It puts the port in a separate class
(`PostgreSQLSchemaStatements`) reached through an accessor call
(`this.pgSchemaStatements()`). That is a **delegation edge, not an inclusion
edge**, and `extract-ts-api.ts` records no such edge — `PostgreSQLAdapter`'s
recorded `includes` is exactly `["DatabaseAdapter"]`.

## How to reproduce

```sh
pnpm build                                        # extractor needs fresh dist/*.d.ts
API_COMPARE_FORCE=1 pnpm parity:api --wide-calls # writes output/call-mismatches-wide.json
pnpm tsx scripts/api-compare/audit-cross-file-calls.ts
```

The index covers `classes`, `modules` **and** `fileFunctions` — trails ports
mixin bodies as `this`-typed file functions, so a resolution rule that reads only
class members misses them (`rowsWithNoDefinition` is 0 with them indexed, 303
without).

Resolution is measured at least as generously as the gate itself: a candidate
counts as made when the other body calls the mapped TS name **or** any
`jsEnumerableAliases` analogue of the Ruby call (`any?` → `some`), the same
alias path `significantMissingCalls` uses.

The script reads `scripts/api-compare/output/ts-api.json` and
`scripts/api-compare/output/call-mismatches-wide.json` only, and prints the JSON
summary tallied below. Every figure in this report is a field of that output.

## Two readings of "cross-file", both measured

The RFC's cause table does not define the bucket precisely, so both readings
were measured.

**Reading A — attribution split (caller side).** The Ruby file the method came
from does not correspond to the TS file it was name-matched against
(`connection_adapters/postgresql/schema_statements.rb` charged against
`connection-adapters/postgresql-adapter.ts`). This is the shape the story
Context describes. **294 rows** (`crossFileRows`).

**Reading B — resolvable elsewhere (callee side).** The omitted call IS made by
a same-named body somewhere else in the package. **320 rows**
(`resolvableAnywhereByName`) — 28 include-graph, 292 collaborator.

The two overlap by 16. Neither is 1606. The 1606 figure was projected on the
2026-07-30 tree under a receiver-scoping rule that has not landed; receiver
scoping removes rows from the enumerable-idiom bucket but cannot move rows
_into_ an include-graph-resolvable state, so the ceiling measured here is not
sensitive to sibling ordering.

## Classification of all 5034 rows

| Bucket          | Rows | Meaning                                                                            |
| --------------- | ---: | ---------------------------------------------------------------------------------- |
| `divergence`    | 4713 | no definition of that TS name anywhere in the package makes the call               |
| `collaborator`  |  292 | a same-named body elsewhere makes the call; **no** include/extends edge reaches it |
| `include-graph` |   28 | a same-named body makes the call on a class reachable through recorded edges       |
| `unported`      |    1 | the paired body is the only definition and has no call-set at all                  |

Restricted to Reading A's 294 attribution-split rows: `divergence` 278,
`collaborator` 13, `include-graph` 3, `unported` 0.

Mapping onto the story's requested (a)/(b)/(c):

- **(a) pure mixin-attribution artifact** — `include-graph` + `collaborator`,
  **320 rows** (6.4%). Only the 28 `include-graph` rows are reachable by the
  mechanism the sibling story proposes.
- **(b) real divergence** — `divergence`, **4713 rows** (93.6%). This is an
  upper bound: it still contains the receiver-idiom noise that
  `ruby-extractor-record-call-receiver-kind` removes (the Ruby extractor credits
  `xs.first` against a ported `first`), which the artifact gives no way to
  separate today.
- **(c) unported** — **1 row**. This bucket is empirically empty: trails ports
  mixin bodies as `this`-typed file functions (CLAUDE.md's `include` convention),
  which `ts-api.json` records under `fileFunctions`, so a paired method with no
  ported body at all is vanishingly rare. An earlier revision of this audit
  reported 306 here by indexing only `classes`/`modules`; that was an indexing
  artifact, and `rowsWithNoDefinition` is now 0, confirming full coverage.

### Files that dominate

`divergence` (whole population, top 8):

| File                                                             | Rows |
| ---------------------------------------------------------------- | ---: |
| `activerecord/relation.ts`                                       |  420 |
| `activerecord/connection-adapters/postgresql-adapter.ts`         |  162 |
| `actiondispatch/routing/mapper.ts`                               |  131 |
| `actioncontroller/base.ts`                                       |  123 |
| `activerecord/connection-adapters/sqlite3-adapter.ts`            |   96 |
| `activerecord/relation/query-methods.ts`                         |   90 |
| `activerecord/connection-adapters/abstract/schema-statements.ts` |   86 |
| `activerecord/migration.ts`                                      |   84 |

The single `unported` row is in `activerecord/attribute-methods.ts`.

Reading A's 294 rows are dominated by `activerecord/relation.ts` (97),
`activerecord/base.ts` (83) and
`activerecord/connection-adapters/postgresql-adapter.ts` (40) — 75% in three
files.

## Why the `collaborator` bucket must NOT be resolved

The 292 `collaborator` rows are what a name-only widening ("the call is made by
some method of this name anywhere in the package") would silence. Reading the
top resolution edges shows what such a rule actually matches:

| Paired file                                     | Resolved into                                               | Rows |
| ----------------------------------------------- | ----------------------------------------------------------- | ---: |
| `connection-adapters/abstract-mysql-adapter.ts` | `connection-adapters/postgresql/schema-statements-class.ts` |    9 |
| `cache/file-store.ts`                           | `cache/memory-store.ts`                                     |    9 |
| `connection-adapters/abstract-mysql-adapter.ts` | `connection-adapters/abstract/schema-statements.ts`         |    5 |
| `tasks/mysql-database-tasks.ts`                 | `tasks/sqlite-database-tasks.ts`                            |    4 |
| `tasks/postgresql-database-tasks.ts`            | `tasks/sqlite-database-tasks.ts`                            |    4 |

These are **sibling implementations of the same interface**, not collaborators.
A MySQL adapter method being credited with a call the PostgreSQL adapter makes
is precisely the fidelity gap the gate exists to catch — an adapter that drops a
per-adapter step would go permanently invisible. This is the same imprecision
`effectiveTsCalls` already accepts, but there it is confined to bodies
`isDelegatingWrapper` has proved contain no logic; unconfined it is unsound.

Only **31** of the 320 resolvable rows sit in a body that forwards to its own
name but exceeds `DELEGATION_MAX_CALLS = 3`, so `isDelegatingWrapper` rejects it
(`resolvableForwardersAboveDelegationCap`). Raising that threshold is not the
missing lever either.

## Recommended resolution rule

For `resolve-wide-candidates-through-include-graph`:

**Resolve** a missing call when a body with the **same TS method name**, on a
class or module reachable from the paired class by the transitive closure of the
**recorded `includes` / `extends` names** in `ts-api.json`, makes that call (or a
JS-native alias of it, using the existing `jsEnumerableAliases` path). Resolve
the name → entity lookup **within the row's own package only**.

**It must NOT resolve through:**

- **filename or directory proximity** — `postgresql-adapter.ts` ↔
  `postgresql/schema-statements-class.ts` share a prefix and nothing else;
- **same-name-anywhere-in-package** — the 292-row `collaborator` bucket, which
  resolves MySQL against PostgreSQL and `file-store` against `memory-store`;
- **any method on a reachable class** — name-agnostic reachability adds 412 rows
  whose only relation to the Rails method is that some unrelated body on a mixin
  happens to call the same name;
- **cross-package** entity lookup;
- **unresolved edge names** — an `includes` entry that names no entity in the
  package (a cross-package mixin, an inline object literal) must drop out of the
  walk silently, never fall back to a looser match.

**Expected delta: −28 rows, not −1100 to −1600.** The sibling story should be
re-scoped or closed on that basis: 250 LOC of graph-walking machinery to remove
28 baseline rows is not worth shipping, and the alternative rules that would
remove more are the ones this audit shows to be unsound. If the RFC still needs
the projected reduction, the lever is not the include graph — it is either
recording the **delegation edge** (accessor call → returned class) in
`extract-ts-api.ts`, which would make the trails collaborator shape resolvable
soundly, or the already-scheduled receiver-scoping and tag-suppression stories.

## Follow-up worth registering

- **Record delegation edges in `extract-ts-api.ts`.** A method whose entire body
  is `return this.<accessor>().<name>(...)` has a resolvable return type at
  extraction time. Recording that edge would let candidate resolution reach
  `PostgreSQLSchemaStatements` from `PostgreSQLAdapter` without any of the
  unsound widenings above. This is the only mechanism found that addresses the
  bucket the RFC actually described.
- **`fileFunctions` must be in scope for any candidate resolution.** trails'
  `include` convention puts mixin bodies in file-level functions, not class
  members; a resolution rule that walks only `classes`/`modules` misses them
  entirely (it cost this audit 303 misclassified rows before the fix).

## Update 2026-07-31 — re-measured against the shipped resolution

Every figure above this section was produced by a **file-level,
ambiguity-blind** walk: the audit script keyed definitions by `file` and
followed every entity an `includes` / `extends` name resolved to. Implementing
the recommended rule literally in the gate (PR #5755) showed that reading
over-resolves in two ways the audit itself had ruled out:

- **A barrel unions the package.** `cache/index.ts` holds a re-exported entry
  for every store, so crediting a whole reached FILE let
  `MemoryStore#deleteMatched` discharge a call missing from
  `FileStore#deleteMatched` — the sibling-implementation cross-credit this
  audit lists under "must NOT resolve through".
- **Edge names are ambiguous.** `DatabaseStatements` names a module under
  `abstract/`, `mysql/`, `postgresql/` and `sqlite3/`; following every
  candidate credited `sqlite3-adapter.ts#explain` with calls made in
  `mysql/database-statements.ts`.

The shipped gate therefore resolves **per entity** and **drops an edge name
more than one entity answers to**, and the measured baseline delta was **−2**,
not the −28 projected above. `audit-cross-file-calls.ts` now reuses
`scripts/api-compare/include-graph.ts` — the gate's own walk — so the audit and
the gate can no longer disagree. Treat the earlier tallies the same way this
audit treats its own 306 → 1 `unported` fix: a tooling artifact, not a finding.

### Re-measured tallies

Measured on the 2026-07-31 tree with both rules run against the **same**
artifact, which is now the post-#5754/#5755 wide artifact of **3243** (row,
call) pairs — smaller than the 5034 above because the gate now discharges what
it resolves and `@missingRailsCall` suppresses the wide flag.

| Figure                        | File-level walk | Shipped per-entity walk |
| ----------------------------- | --------------: | ----------------------: |
| `include-graph`               |              16 |                       0 |
| `collaborator`                |             191 |                     207 |
| `divergence`                  |            3035 |                    3035 |
| `unported`                    |               1 |                       1 |
| `anyMethodInIncludeGraph`     |             250 |                     159 |
| `anyMethodInDelegationGraph`  |             462 |                     230 |
| `sameNameInIncludeGraph`      |              16 |                       0 |
| `anyMethodCrossingAdapterFam` |              51 |                       0 |

Restricted to Reading A (attribution split, 194 rows on this artifact):
`divergence` 184, `collaborator` 10, `include-graph` 0.

Two readings of the `include-graph` 0:

- It is **not** evidence that the include graph resolves nothing. The rows it
  would resolve are exactly the ones the shipped gate already discharged, so
  they are absent from the artifact the audit reads.
- The 16 rows the file-level walk still calls `include-graph` are the
  cross-credits the gate refuses — they move to `collaborator`, which is the
  bucket this audit says must NOT be resolved. `anyMethodCrossingAdapterFam`
  falling 51 → 0 is the same fact: no surviving resolution crosses an adapter
  family.

`anyMethodResolvedOnlyInOwnFile` (122 under the old walk) is gone from the
output: the shipped walk never returns an entity declared in the row's own
file, so the figure is 0 by construction and reporting it would be noise.

The reproduction steps are unchanged.
