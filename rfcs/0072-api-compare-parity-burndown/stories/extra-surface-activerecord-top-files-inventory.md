---
title: "spike: inventory + classify activerecord extra-surface top-20 files"
status: closed
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: extra-surface
deps: ["extra-surface-reasoned-allowlist"]
deps-rfc: []
est-loc: 50
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "spike complete: inventory in story body + audit report extra-surface-20260726T000734Z.md; 10 follow-up stories registered in RFC 0072"
---

## Context

Spike/audit (done-when-closed). The activerecord extra-surface counts are far
too large for direct stories: 793 novel / 2315 moved (`pnpm api:extra`,
2026-07-25). Top offenders:

- `connection-adapters.ts` — 48 novel, 568 moved (legacy monolith; most
  "moved" names belong in `connection-adapters/…` Rails-layout files)
- `associations.ts` — 39 novel, 171 moved
- `inheritance.ts` — 33 novel, 176 moved (novel list includes obvious
  cross-file leakage: `loadBelongsTo`, `restoreAttribute`,
  `savedChangeToAttributeValues` — suggests shared-helper files being
  re-exported and double-counted)
- `connection-adapters/abstract-mysql-adapter.ts` — 30 novel (mostly `ER_*` /
  `CR_*` error-code constants — probable allowlist-with-reason candidates)
- `relation/finder-methods.ts` — 30 novel, `relation/delegation.ts` — 25
  novel/173 moved, `base.ts` — 20/155, `postgresql-adapter.ts` — 19/149.

The job: classify each top-20 file's novel/moved names into (a) invention to
remove, (b) allowlist-with-reason, (c) misplaced port to relocate, (d)
extractor artifact (re-export double-counting — cross-check against
`project_api_compare_ts_cache_under_reports_calls` class of issues), then
register per-cluster follow-up stories with `pnpm tasks new
api-compare-parity-burndown <slug> --body-file …`, each carrying the
classified name list and file:line context so implementers don't re-derive.

## Acceptance criteria

- A written inventory (in this story body on close, or a linked audit
  report) covering at least the top-20 activerecord files by novel count,
  with per-name classification counts.
- Follow-up stories registered in this RFC for each actionable cluster, each
  with real `## Context` refs and acceptance criteria (no skeleton stubs).
- Any extractor double-counting bug found is filed as its own tooling story.
- No implementation PRs from this story itself.

## Findings (2026-07-25)

### Summary

The headline finding is that **the activerecord extra-surface numbers are
substantially wrong, not substantially large.** Of the 776 novel / 2084 moved
extras `pnpm api:extra --package activerecord` reported on 2026-07-25, at
least **179 novel and 1015 moved are tooling artifact** — five distinct
extractor/allow-set defects, each independently reproducible and each fixable
in well under 100 LOC. The story's own hypotheses were partly right and partly
wrong: the `inheritance.ts` cross-file leakage IS an extractor artifact, but
via the `this`-typed mixin convention rather than re-exports; and the mysql
`ER_*` / `CR_*` constants are NOT allowlist candidates — Rails declares them,
the allow-set just never reads `fileConstants`.

After the five tooling fixes, activerecord's genuinely-drifted novel surface
on the top-20 files drops from 387 to roughly 272 names, concentrated in five
real clusters (finder `perform*`, the associations engine, the STI/schema
registry, the schema-cache/pool sync API, and recurring adapter names). Ten
follow-up stories are registered in RFC 0072, all with per-name lists and
`file:line` refs.

Numbers throughout are from `pnpm api:compare` + `pnpm api:extra --package
activerecord --top 25 --json` run at commit `d34479c3c` on 2026-07-25.

### Coverage

- Tooling read: `scripts/api-compare/extra-surface.ts` (whole file),
  `scripts/api-compare/compare.ts:660-700` (`resolveModuleName`),
  `scripts/api-compare/extract-ts-api.ts`, `scripts/api-compare/config.ts`.
- Manifests analysed: `scripts/api-compare/output/ts-api.json`,
  `output/rails-api.json` (classes, modules, fileFunctions, fileConstants).
- Rails source read: `connection_adapters/abstract_mysql_adapter.rb:793-845`,
  `connection_adapters/postgresql_adapter.rb:183`,
  `migration/command_recorder.rb:48-340`, `connection_adapters.rb`,
  `relation/finder_methods.rb`, `model_schema.rb`.
- TS source read: `connection-adapters.ts` (whole),
  `connection-adapters/abstract/quoting.ts`,
  `connection-adapters/abstract/connection-pool.ts`,
  `connection-adapters/schema-cache.ts`, `relation/finder-methods.ts`,
  `associations.ts`, `inheritance.ts`, `base.ts`,
  `connection-adapters/postgresql-adapter.ts`.
- Experiment: `compare.ts:683` patched locally with a namespace-prefix walk,
  `pnpm api:extra` re-run, patch reverted (`git checkout`). Worktree is clean.

### Top-20 inventory with per-name classification

Columns: `art` = extractor artifact (mixin host-interface leak + re-export
duplication), `const` = Rails constant the allow-set ignores, `int` = already
`@internal`-tagged but not honored, `real` = genuine drift needing a decision.
The two right-hand columns are the same artifact split on the moved side.

| file                                                 | novel   | moved    | art    | const  | int    | real    | mv-mixin | mv-reexport |
| ---------------------------------------------------- | ------- | -------- | ------ | ------ | ------ | ------- | -------- | ----------- |
| `connection-adapters.ts`                             | 48      | 568      | 36     | 0      | 2      | 10      | 0        | 489         |
| `associations.ts`                                    | 33      | 94       | 3      | 0      | 4      | 26      | 94       | 0           |
| `connection-adapters/abstract-mysql-adapter.ts`      | 30      | 37       | 0      | 17     | 1      | 12      | 0        | 1           |
| `relation/finder-methods.ts`                         | 30      | 0        | 0      | 0      | 0      | 30      | 0        | 0           |
| `inheritance.ts`                                     | 27      | 98       | 5      | 0      | 8      | 14      | 94       | 0           |
| `base.ts`                                            | 20      | 155      | 0      | 0      | 1      | 19      | 0        | 0           |
| `connection-adapters/postgresql-adapter.ts`          | 19      | 149      | 1      | 0      | 0      | 18      | 0        | 1           |
| `relation/delegation.ts`                             | 19      | 97       | 5      | 0      | 0      | 14      | 93       | 0           |
| `migration/command-recorder.ts`                      | 17      | 21       | 0      | 0      | 0      | 17      | 0        | 0           |
| `migration.ts`                                       | 15      | 60       | 2      | 1      | 1      | 11      | 0        | 4           |
| `connection-adapters/abstract-adapter.ts`            | 15      | 13       | 0      | 0      | 1      | 14      | 0        | 0           |
| `relation/query-methods.ts`                          | 15      | 1        | 0      | 0      | 9      | 6       | 0        | 0           |
| `connection-adapters/sqlite3-adapter.ts`             | 14      | 71       | 0      | 0      | 0      | 14      | 0        | 0           |
| `connection-adapters/abstract/connection-pool.ts`    | 13      | 10       | 0      | 0      | 0      | 13      | 0        | 0           |
| `model-schema.ts`                                    | 13      | 1        | 0      | 0      | 4      | 9       | 0        | 0           |
| `associations/collection-proxy.ts`                   | 12      | 40       | 0      | 0      | 0      | 12      | 0        | 0           |
| `relation.ts`                                        | 12      | 11       | 2      | 0      | 0      | 10      | 0        | 2           |
| `connection-adapters/schema-cache.ts`                | 12      | 2        | 0      | 0      | 0      | 12      | 0        | 0           |
| `connection-adapters/abstract/quoting.ts`            | 12      | 0        | 0      | 0      | 10     | 2       | 0        | 0           |
| `connection-adapters/abstract/schema-definitions.ts` | 11      | 18       | 0      | 0      | 2      | 9       | 0        | 0           |
| **top-20 total**                                     | **387** | **1446** | **54** | **18** | **43** | **272** | **281**  | **497**     |

Package-wide (all 216 drifted files): 776 novel / 2084 moved; 100 novel are
`@internal`-tagged, 22 novel are Rails constants, 14 novel + 343 moved are
mixin host-interface leak, and the re-export defect accounts for 527 of
`connection-adapters.ts`'s 616. The relative-qualified-include defect removes
a further 183 moved.

### Defect inventory

### D1: `@internal` JSDoc ignored on top-level exported functions

- **Type:** extractor bug — biggest single novel-side false-positive source
- **Where:** `scripts/api-compare/extract-ts-api.ts` (fileFunctions path);
  consumed at `extra-surface.ts:399-407`
- **Evidence:** `connection-adapters/abstract/quoting.ts:524-530` tags
  `dispatchQuote` `@internal`; `ts-api.json` records `internal: undefined`
- **Scale:** **100 of activerecord's 776 novel names (13%)**
- **Story:** `extra-surface-honor-internal-jsdoc-on-file-functions`

### D2: partially-qualified `include`/`extend` names never resolve

- **Type:** shared api-compare bug (affects `api:compare` too)
- **Where:** `scripts/api-compare/compare.ts:683` —
  `if (incName.includes("::")) return [incName];`
- **Evidence:** `postgresql_adapter.rb:183` `include PostgreSQL::Quoting`
  resolves to the relative string, matches no module, mixin silently dropped
  at `extra-surface.ts:530`
- **Scale:** 54 includes manifest-wide; measured (patch + re-run + revert)
  activerecord moved **2084 → 1901**; pg-adapter 149 → 36, sqlite3 71 → 38,
  mysql 37 → 22, `base.ts` 155 → 144
- **Story:** `api-compare-resolve-relative-qualified-includes`

### D3: re-export barrels charged with the classes they re-export

- **Type:** extractor bug
- **Evidence:** `ts-api.json` holds three `AbstractAdapter` entries
  (`abstract-adapter.ts`, `connection-adapters.ts`, `index.ts`), each with the
  full 306+18 method list; 273 activerecord class names are attributed to more
  than one file
- **Scale:** 527 of `connection-adapters.ts`'s 616 extras (a 180-line file)
- **Story:** `extra-surface-skip-reexported-class-entries`

### D4: `this`-typed mixin pseudo-modules leak the entire host interface

- **Type:** extractor bug — this is the real cause of the leakage the story
  suspected was re-export double-counting
- **Evidence:** `inheritance.ts` declares seven `<file>:<fn>__mixin` modules,
  each carrying all 136 members of the host type; `grep` confirms
  `inheritance.ts` declares none of `isEqual` / `toSlug` /
  `attributeNamesList` / `loadBelongsTo` (real homes: `base.ts:4486`,
  `attribute-methods.ts:126`, `associations.ts:1413`)
- **Scale:** 6 files affected; **343 of 2084 moved (16%) and 14 novel**
- **Story:** `extra-surface-mixin-pseudo-module-host-leak`

### D5: Ruby `fileConstants` never enter the allowed-name set

- **Type:** allow-set gap
- **Evidence:** `rails-api.json` has
  `fileConstants["connection_adapters/abstract_mysql_adapter.rb"]` with
  `ER_DUP_ENTRY`, `ER_LOCK_DEADLOCK`, … (`abstract_mysql_adapter.rb:793`);
  `collectAllowedNames` (`extra-surface.ts:481-556`) unions only methods
- **Scale:** 22 confirmed novel names; a further 18 SCREAMING_CASE novel names
  split between extractor misses (9) and genuine inventions (9)
- **Story:** `extra-surface-allow-ruby-file-constants`

### D6: `define_method`-generated Rails methods absent (pre-existing)

- **Type:** extractor gap — already filed
- **New instance found here:** `migration/command-recorder.ts`'s 17 novel
  `invert*` names. `migration/command_recorder.rb:125-180` generates
  `invert_add_column`, `invert_add_index`, … inside a
  `ReversibleAndIrreversibleMethods.each` / `class_eval` heredoc loop, so none
  are in `rails-api.json`. All 17 are faithful ports scored as inventions.
- **Story:** existing `ruby-extractor-records-define-method-names` — no new
  story filed; add this instance when that story is picked up.

### Genuine drift clusters (post-fix)

### C1: `relation/finder-methods.ts` — 30 novel, 0 moved, 0 artifact

The purest drift file in the package. 28 `perform*` async-split
implementations plus `normalizeFindArgs` (`:82`), `raiseNotFoundAll` (`:192`),
`raiseNotFoundSingle` (`:248`). Nothing named `perform_first` exists in Rails.
Mostly `@internal`-able; `raiseNotFound*` may map to Rails'
`raise_record_not_found_exception!`.
**Story:** `extra-surface-finder-methods-perform-helpers`.

### C2: `associations.ts` — ~26 real novel after artifact removal

trails' functional association engine where Rails' `associations.rb` is nearly
doc-only. Several already carry `Mirrors:` JSDoc naming a Rails method
(`buildHasOne:1843` → `HasOneAssociation#build_record`), making them
relocations, not inventions. **Story:**
`extra-surface-associations-engine-classify`.

### C3: `inheritance.ts` + `model-schema.ts` — ~24 real novel

The STI/schema-host registry standing in for Ruby constant lookup and the
`inherited` hook (`registerSubclass`, `moduleParentChain`,
`*ModuleTableName{Prefix,Suffix}`, `namespaceSegments`, `qualifiedName`).
CLAUDE.md already routes Ruby lifecycle-hook substitutes to `SKIP_GROUPS` in
`conventions.ts` rather than the allowlist. **Story:**
`extra-surface-sti-and-schema-registry-names`.

### C4: `schema-cache.ts` + `connection-pool.ts` — 25 real novel

Sync accessor/writer API Rails does not need (`getCachedColumnsHash:285`,
`setColumns:426`, `leaseConnectionSync:623`, `realPool:184`, `NULL_CONFIG:70`,
the close-draining trio). Mostly justified async-forced deviations; the
justification must land at each declaration. **Story:**
`extra-surface-schema-cache-and-pool-sync-api`.

### C5: adapter names recurring across five files — ~73 real novel

`executeMutation`/`exec`, `Version`/`major`/`minor`/`gte`,
`lookupCastType`/`nativeTypeMap`/`buildTypeMap`, `quoteIdentifier`,
`schemaStatements`/`schemaQuery`/`schemaCacheBound`/`verifyCalled`/`columnMethodNames`,
`createRange`/`dropRange`, `isNoDatabaseError`, `statementLimit` — each is one
decision resolving five reports. **Story:**
`extra-surface-adapter-cross-file-recurring-names`.

Not separately storied (below the top-20 cut or already covered):
`base.ts` (19 real), `associations/collection-proxy.ts` (12 — mostly JS
iteration protocol: `detect`, `every`, `flatMap`, `reduce`, `some`, `sortBy`,
candidates for the `TS_ALWAYS_ALLOWED` set at `extra-surface.ts:87`),
`relation.ts` (10), `relation/delegation.ts` (14),
`connection-adapters/abstract/schema-definitions.ts` (9).

### Registered follow-up stories

All in RFC `0072-api-compare-parity-burndown`, cluster `extra-surface`,
dependency-ordered so the tooling fixes land before the classification work.

| story                                                  | est LOC | prio | deps   |
| ------------------------------------------------------ | ------- | ---- | ------ |
| `extra-surface-honor-internal-jsdoc-on-file-functions` | 60      | 10   | —      |
| `api-compare-resolve-relative-qualified-includes`      | 80      | 10   | —      |
| `extra-surface-skip-reexported-class-entries`          | 90      | 15   | —      |
| `extra-surface-mixin-pseudo-module-host-leak`          | 80      | 15   | —      |
| `extra-surface-allow-ruby-file-constants`              | 80      | 20   | —      |
| `extra-surface-finder-methods-perform-helpers`         | 120     | 30   | D1     |
| `extra-surface-associations-engine-classify`           | 200     | 35   | D1, D4 |
| `extra-surface-schema-cache-and-pool-sync-api`         | 150     | 35   | D1, D3 |
| `extra-surface-adapter-cross-file-recurring-names`     | 220     | 40   | D1, D5 |
| `extra-surface-sti-and-schema-registry-names`          | 180     | 40   | D1, D4 |

Recommended order: ship the five tooling stories first (they are independent
of each other and of the classification work), re-run `pnpm api:compare && pnpm
api:extra --package activerecord --json`, then start the classification
stories from the refreshed lists. Doing it the other way round means every
classification story re-derives a name list that is ~30% artifact.
