# Cross-file / mixin-attribution audit

Audit date: 2026-07-31. Story:
`audit-wide-cross-file-mixin-attribution` (RFC 0083). Producing script:
`scripts/api-compare/audit-cross-file-calls.ts` (trails, PR that carries this
audit).

## Headline

**The bucket is not 1606 rows and the include/extends graph does not resolve
it.** On the 2026-07-31 tree the wide artifact holds 5034 (row, call) pairs.
Walking the recorded include/extends graph resolves **10** of them. The widest
graph-based rule that could be written — "the candidate is called by ANY method
on ANY class reachable through includes/extends" — reaches **247** more. The
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
API_COMPARE_FORCE=1 pnpm api:compare --wide-calls # writes output/call-mismatches-wide.json
pnpm tsx scripts/api-compare/audit-cross-file-calls.ts
```

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
a same-named body somewhere else in the package. **254 rows**
(`resolvableAnywhereByName`) — 10 include-graph, 244 collaborator.

The two overlap by 14. Neither is 1606. The 1606 figure was projected on the
2026-07-30 tree under a receiver-scoping rule that has not landed; receiver
scoping removes rows from the enumerable-idiom bucket but cannot move rows
_into_ an include-graph-resolvable state, so the ceiling measured here is not
sensitive to sibling ordering.

## Classification of all 5034 rows

| Bucket          | Rows | Meaning                                                                            |
| --------------- | ---: | ---------------------------------------------------------------------------------- |
| `divergence`    | 4474 | no definition of that TS name anywhere in the package makes the call               |
| `unported`      |  306 | the paired body is the only definition and has no call-set at all                  |
| `collaborator`  |  244 | a same-named body elsewhere makes the call; **no** include/extends edge reaches it |
| `include-graph` |   10 | a same-named body makes the call on a class reachable through recorded edges       |

Restricted to Reading A's 294 attribution-split rows: `divergence` 275,
`collaborator` 11, `unported` 5, `include-graph` 3.

Mapping onto the story's requested (a)/(b)/(c):

- **(a) pure mixin-attribution artifact** — `include-graph` + `collaborator`,
  **254 rows** (5.0%). Only the 10 `include-graph` rows are reachable by the
  mechanism the sibling story proposes.
- **(b) real divergence** — `divergence`, **4474 rows** (88.9%). This is an
  upper bound: it still contains the receiver-idiom noise that
  `ruby-extractor-record-call-receiver-kind` removes (the Ruby extractor credits
  `xs.first` against a ported `first`), which the artifact gives no way to
  separate today.
- **(c) unported** — **306 rows** (6.1%).

### Files that dominate

`divergence` (whole population, top 8):

| File                                                             | Rows |
| ---------------------------------------------------------------- | ---: |
| `activerecord/relation.ts`                                       |  426 |
| `activerecord/connection-adapters/postgresql-adapter.ts`         |  169 |
| `actiondispatch/routing/mapper.ts`                               |  132 |
| `actioncontroller/base.ts`                                       |  125 |
| `activerecord/connection-adapters/sqlite3-adapter.ts`            |   99 |
| `activerecord/relation/query-methods.ts`                         |   90 |
| `activerecord/connection-adapters/abstract/schema-statements.ts` |   86 |
| `activerecord/migration.ts`                                      |   84 |

`unported` (top 5): `actioncontroller/metal/request-forgery-protection.ts` 21,
`rack/utils.ts` 19, `abstractcontroller/helpers.ts` 16,
`activerecord/relation/delegation.ts` 15, `activemodel/attribute-methods.ts` 14.

Reading A's 294 rows are dominated by `activerecord/relation.ts` (97),
`activerecord/base.ts` (84) and
`activerecord/connection-adapters/postgresql-adapter.ts` (41) — 76% in three
files.

## Why the `collaborator` bucket must NOT be resolved

The 244 `collaborator` rows are what a name-only widening ("the call is made by
some method of this name anywhere in the package") would silence. Reading the
top resolution edges shows what such a rule actually matches:

| Paired file                                     | Resolved into                                               | Rows |
| ----------------------------------------------- | ----------------------------------------------------------- | ---: |
| `connection-adapters/abstract-mysql-adapter.ts` | `connection-adapters/postgresql/schema-statements-class.ts` |    9 |
| `cache/file-store.ts`                           | `cache/memory-store.ts`                                     |    9 |
| `connection-adapters/sqlite3-adapter.ts`        | `connection-adapters/postgresql-adapter.ts`                 |    4 |
| `connection-adapters/mysql2-adapter.ts`         | `connection-adapters/postgresql-adapter.ts`                 |    3 |
| `tasks/sqlite-database-tasks.ts`                | `tasks/postgresql-database-tasks.ts`                        |    3 |

These are **sibling implementations of the same interface**, not collaborators.
A MySQL adapter method being credited with a call the PostgreSQL adapter makes
is precisely the fidelity gap the gate exists to catch — an adapter that drops a
per-adapter step would go permanently invisible. This is the same imprecision
`effectiveTsCalls` already accepts, but there it is confined to bodies
`isDelegatingWrapper` has proved contain no logic; unconfined it is unsound.

Only **22** of the 254 resolvable rows sit in a body that is delegating-wrapper
shaped but larger than `DELEGATION_MAX_CALLS` (`resolvableWrapperShaped`), so
raising that threshold is not the missing lever either.

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
- **same-name-anywhere-in-package** — the 244-row `collaborator` bucket, which
  resolves MySQL against PostgreSQL and `file-store` against `memory-store`;
- **any method on a reachable class** — name-agnostic reachability adds 247 rows
  whose only relation to the Rails method is that some unrelated body on a mixin
  happens to call the same name;
- **cross-package** entity lookup;
- **unresolved edge names** — an `includes` entry that names no entity in the
  package (a cross-package mixin, an inline object literal) must drop out of the
  walk silently, never fall back to a looser match.

**Expected delta: −10 rows, not −1100 to −1600.** The sibling story should be
re-scoped or closed on that basis: 250 LOC of graph-walking machinery to remove
10 baseline rows is not worth shipping, and the alternative rules that would
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
- **The 306 `unported` rows** are a distinct population from the burn-down RFC's
  "genuine" set — the paired TS body has no call-set at all. They belong in the
  porting backlog, not the ratchet.
