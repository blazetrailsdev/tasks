---
rfc: "0079-drop-rebuild-canonical-tables"
title: "Drive rebuildCanonicalTables call sites to zero, then delete it"
status: draft
created: 2026-07-26
updated: 2026-07-27
owner: "@deanmarano"
packages:
  - "activerecord"
clusters:
  - "test-infra"
related-rfcs:
  - "0059-drop-defineschema-mirror-create-table"
  - "0070-drop-repair-worker-schema"
priority: 2
---

## Summary

`rebuildCanonicalTables` (`packages/activerecord/src/support/canonical-table-rebuild.ts`)
is the anti-contamination shield left standing after RFC 0059 (drop
`defineSchema`) and RFC 0070 (delete `repairWorkerSchema`): a victim test file
drop+recreates a named subset of canonical tables at setup because some sibling
file on the shared per-worker DB reshaped or dropped them and never restored
the canonical shape. Like `repairWorkerSchema` before it, every call site is a
paid-per-run patch over a contamination source, plus FK machinery
(`foreignKeyDependents`, `fkSafeDropPlan` with `scanInbound: true`,
`bulkInboundFkHost`) that exists only to make the shield safe.

This RFC drives the call sites to **zero** the same way RFC 0070 did: attribute
each shield to its contaminating sibling, fix the source (restore canonical
shape at the culprit, or move the victim suite onto `fixtures({ ... })` /
transactional rollback so drift cannot reach it), ratchet the caller list so no
new call sites appear, then delete `rebuildCanonicalTables`, its FK-scan
machinery, and its tests, and rework the `require-canonical-rebuild` eslint
rule — which today MANDATES calling the helper after a canonical drop — into a
plain ban on dropping canonical tables outside the helper's own file.

## Baseline

**Re-verified against `origin/main`, 2026-08-09.** The helper moved from
`test-helpers/canonical-schema.ts` to `packages/activerecord/src/support/canonical-table-rebuild.ts`
(with its FK machinery: `foreignKeyDependents`, `fkSafeDropPlan`'s
`scanInbound` arm at `:109-128`, `bulkInboundFkHost` at `:192`), so every
`test-helpers/…` path in the stories below reads `support/…` today.

**26 call sites across 23 files** (down from the 2026-07-26 count of 32/23).
Production-helper callers: `support/setup-second-pool.ts` — **2** sites (`:81`,
`:105`), not 3. Self-coverage that dies with the helper:
`support/canonical-table-rebuild.test.ts`,
`support/canonical-table-rebuild-bulk-inbound-fk.test.ts` (both renamed from
`canonical-schema*.test.ts`). The rest are per-suite shields, grouped in the
burndown stories by table family.

Deltas since the original baseline:

- **Gone:** `base-prevent-writes.test.ts` (professors) no longer calls the
  helper.
- **New, unattributed to any burndown story:**
  `migration/exclusion-constraint.test.ts:34` (`invoices`),
  `migration/rename-table.test.ts:44` (`references`),
  `migration/unique-constraint.test.ts:26` (`sections`). These three arrived
  after the ratchet story was written and are exactly what
  `ratchet-rebuild-canonical-tables-callers` exists to stop; they are folded
  into `shield-removal-misc-singles`.
- `drop-all-tables.test.ts` is no longer a caller, and `dropAllTables` itself
  is no longer dead — `test-setup-dy.ts:87` calls it on the boot full-load arm
  (which is why `delete-dead-drop-all-tables-helper` is closed).

## Phase 1 inventory (`inventory-attribute-rebuild-call-sites`, 2026-08-26)

Attribution of every `rebuildCanonicalTables` call site to the sibling (or
same-file block) that leaves the named tables drifted. Measured against
`origin/main` at `07c7924f1`. Line numbers are current; several have drifted
from the 2026-08-09 baseline and the burndown stories are corrected below.

### Method

1. Enumerated every caller: `grep -rn rebuildCanonicalTables packages/activerecord/src`
   — **26 sites across 23 files**, matching the baseline (24 per-suite + 2 in
   `support/setup-second-pool.ts`; the two self-coverage files
   `support/canonical-table-rebuild.test.ts` and
   `support/canonical-table-rebuild-bulk-inbound-fk.test.ts` die with the helper).
2. For every table named in a call site, scanned the whole AR source tree for a
   schema-mutating op (`dropTable` / `createTable` / `renameTable` /
   `changeTable` / `add|remove|rename|changeColumn` / `dropAllTables` /
   `defineSchema`) within 14 lines of a quoted occurrence of that table name.
3. Cross-checked against `eslint/require-canonical-rebuild-exclude.json` and
   RFC 0070's drift-source table.
4. Ran `require-canonical-rebuild` over the whole AR test tree: **clean**.

### Headline finding: two populations, not one

The 26 sites split cleanly, and only one half is a shield at all.

**(A) Same-file restores — 14 sites.** The file itself drops or `force`-creates
the canonical table, and the `require-canonical-rebuild` rule *mandates* the
rebuild that follows. These are not defences against a sibling; deleting the
call alone would red the lint and leave the shared worker DB drifted. They
converge only by removing the drop — moving the DDL onto a bespoke table name,
a private (`:memory:`/tmpdir) adapter, or `fixtures({ ... })`.

**(B) Defensive shields — 12 sites.** No same-file drop; the call is a
pre-emptive rebuild in a `beforeAll` guarding against a sibling. **Every
culprit these sites name in their own comments is extinct.** The comments cite
`coders/json.test.ts`'s `SerializedTopic`, `callbacks.test.ts`'s
`topics: { title }` / `people: { name }`, `clone.test.ts`'s trimmed `topics`,
`reflection.test.ts`'s `people: { name, age, active }`,
`autosave-association.test.ts`'s `people: { name, first_name }`, and
`attribute-methods.test.ts` / `finder.test.ts`'s bespoke `topics` — all of them
`defineSchema` call sites, and `defineSchema` no longer exists in the AR test
tree (RFC 0059 finished it; the only surviving `defineSchema` spellings are the
schema-dumper's *emitted* function name in `schema-dumper.ts:677`,
`support/schema-file-generator.ts:111`, and `tasks/database-tasks.ts:985`).
The named culprit files today contain no `createTable`/`dropTable`/`defineSchema`
at all.

So the working hypothesis for the burndown is: **group (B) is stale debt left
behind by RFC 0059, deletable once a co-scheduled full-suite run on all three
lanes confirms it**, and group (A) is the real remaining work.

### Per-call-site table

| # | Call site (current line) | Tables | Group | Culprit | Proposed fix |
|---|---|---|---|---|---|
| 1 | `date.test.ts:29` | topics | B | Comment names `attribute-methods.test.ts` / `finder.test.ts` bespoke `topics` (no `last_read`) — **extinct**, both files are `defineSchema`-free | Delete; verify co-scheduled on PG (this is the documented `last_read` PG flake) |
| 2 | `dirty.trails.test.ts:21` | topics | B | None found; inherits `dirty.test.ts`'s shield rationale | Delete |
| 3 | `bind-parameter.test.ts:89` | topics, authors, author_addresses, posts | B | Comment names `coders/json.test.ts`'s `SerializedTopic` — **extinct** | Delete |
| 4 | `primary-keys.test.ts:32` | topics, subscribers, movies, dashboards, non_primary_keys, developers, developers_projects, cpk_books, countries | B | No mutator found for any of the 9 tables | Delete |
| 5 | ~~`validations/uniqueness-validation.trails.test.ts:99`~~ | topics | A | Self: the suite added `topics_direct_index` to canonical `topics` after rebuilding | **LANDED — PR #7109 (`f5d2641f6`), 2026-08-26.** Moved onto `Subscriber`/`subscribers` and deleted the `topics` rebuild. Call-site count is now **25**. |
| 6 | `dirty.test.ts:124` | people, topics, pirates, parrots, aircraft, numeric_data | B | Comment names `callbacks.test.ts`, `clone.test.ts`, `reflection.test.ts` — **all extinct** | Delete; keep the `loadSchema` warm-up, which is independent |
| 7 | `locking.test.ts:70` | people, references, legacy_things, string_key_objects, ships, lock_without_defaults(+_cust), treasures, peoples_treasures, cars, wheels, bulbs, … | B | Comment names `autosave-association.test.ts`'s `people: { name, first_name }` — **extinct** | Delete |
| 8 | `locking.test.ts:677` | people, legacy_things, personal_legacy_things, lock_without_defaults(+_cust) | B | Same as #7; second `describe`, same rationale | Delete |
| 9 | `custom-locking.test.ts:16` | people | B | No mutator found | Delete |
| 10 | `enum.trails.test.ts:425` | numeric_data | B | Only `schema-dumper.test.ts:651` `force`-creates `numeric_data`, and it restores it itself (#13) | Delete |
| 11 | `unsafe-raw-sql.test.ts:28` | posts, comments | B | Comment cites "sibling files that physically replace `posts` with a title-only shape" — the only such site is `schema-dumper.test.ts:795/879/909`, self-restored (#13) | Delete |
| 12 | `delegated-type.test.ts:55` | comments, accounts, posts, entries, messages, recipients | B | No mutator for entries/messages/recipients/accounts; `posts` as #11 | Delete |
| 13 | `schema-dumper.test.ts:1005` | booleans, companies, numeric_data, posts, products, string_key_objects, users | **A** | Self: the deferred `SchemaDumperTest` cases `force`-create these on the shared DB (`:451`, `:461`, `:558`, `:651`, `:795`, `:879`, `:909`) and the `afterAll` at `:982-1001` drops all 20 | Move the deferred cases onto bespoke table names (they assert on dump *text*, not on canonical shape), then both the drop list and the rebuild go |
| 14 | `view.test.ts:47` | authors, books | B | Comment cites a reduced `books` (no `cover`/`status`) — no such site exists today | Delete |
| 15 | `associations/required.test.ts:21` | children | **A** | Self: `beforeAll` `force`-creates `parents`/`children` at `:14-17`, `afterAll` drops them | Rename this suite's scratch tables (Rails' `RequiredAssociationsTest` builds its own `parents`/`children`; a `_tableName` override keeps the model names) — then the drop is non-canonical |
| 16 | `reserved-word.test.ts:105` | `CANONICAL_RESERVED_TABLES` (values, group, select, distinct, distinct_select) | **A** | Self: `afterAll:102` drops the reserved-word tables it created | Rails' `ReservedWordTest` owns these tables outright; converge onto `fixtures({ ... })` seeding of the canonical shapes instead of drop+recreate |
| 17 | `primary-keys.test.ts:563` | cpk_books, cpk_orders, cpk_authors | A/B hybrid | Self-preparatory: the block goes on to drop/recreate `uber_barcodes`, `barcodes_reverse`, `travels` (non-canonical) at `:565-575`; the cpk rebuild is a defensive prelude with no found culprit | Delete the cpk rebuild; the bespoke-table half stays |
| 18 | `migration.test.ts:1678` | values | **A** | Self: `:1665` `force`-creates a bespoke `values(value)` (Rails' `ReservedWordsMigrationTest` does the same verbatim) | Fidelity forbids renaming `values`; fix by isolating the block (private adapter or transactional DDL), per `shield-removal-migration-values` |
| 19 | `migration.test.ts:1703` | values | **A** | Same as #18, `ExplicitlyNamedIndexMigrationTest` | Same |
| 20 | `migration/exclusion-constraint.test.ts:34` | invoices | **A** | Self: `beforeEach:26` `force`-creates a bespoke `invoices(start_date, end_date)` | The suite already owns a private `new PostgreSQLAdapter(PG_TEST_URL)` — but on the shared DB. Move onto a bespoke table name or a private database |
| 21 | `migration/unique-constraint.test.ts:26` | sections | **A** | Self: `beforeEach:19` `force`-creates a bespoke `sections(position)` | Same as #20 |
| 22 | `migration/rename-table.test.ts:44` | references | **A** | Self: `:53-54` renames canonical `references` → `old_references` and `test_models` → `references` | Rails renames its own `octopi`/`test_models`; the `references` arm is trails-added — drop it or rename to a scratch name |
| 23 | `adapters/mysql2/mysql2-adapter.test.ts:186` | people, cars, old_cars, subscribers, engines | **A** | Self: `beforeEach:183-185` raw-`DROP TABLE IF EXISTS` those five (plus `foos`) with `FOREIGN_KEY_CHECKS=0` | The suite uses rebuild as a *fixture mechanism*; converge onto `fixtures({ ... })` and delete the raw drop loop |
| 24 | `adapters/mysql2/mysql2-adapter.trails.test.ts:244` | subscribers | B | No mutator; the comment says the suite "does not bootstrap the canonical schema" and lays the table on purpose | Converge onto `fixtures(["subscribers"])` |
| 25 | `adapters/abstract-mysql-adapter/schema.test.ts:16` (via `restoreCanonicalTables`, called at `:25` with `["posts"]`) | posts | **A** | Self: `:71` `force`-creates a bespoke `posts`, `:99` drops it; `:202`/`:228` do the same to `topics` (unrestored — `topics` is not in the `afterAll` list) | Move both onto bespoke names; note the `topics` drop is an **unattributed gap** the `afterAll` does not cover |
| 26–27 | `support/setup-second-pool.ts:81`, `:105` | colleges, courses, professors, courses_professors | **A** | Provisioning, not a shield: `:81` lays the arunit2 schema on a cold second database; `:105` re-lays it per boot so sibling rows cannot reach `College.count` | Per `retire-setup-second-pool-rebuilds`: lay the second pool through `loadCanonicalSchema` + fixtures provisioning |

### Genuinely unattributable

Sites **2, 4, 9, 12, 14, 17 (cpk half), 24** name tables for which the scan in
step 2 found **no** schema-mutating call anywhere in the AR tree — not in a
sibling, not in the file itself. Tables with zero mutators repo-wide:
`author_addresses`, `entries`, `messages`, `recipients`, `legacy_things`,
`personal_legacy_things`, `lock_without_defaults`, `lock_without_defaults_cust`,
`treasures`, `peoples_treasures`, `cars`, `wheels`, `bulbs`, `ships`,
`subscribers`, `movies`, `dashboards`, `non_primary_keys`, `countries`,
`cpk_books`, `cpk_orders`, `cpk_authors`, `children` (outside #15 itself).
These are the strongest deletion candidates in the whole list.

### Residual non-shape drift worth noting

Three files mutate canonical `topics` by column and restore it in place —
`transactions.test.ts:1685-1700`, `persistence.test.ts:381-390`,
`support/schema-cache-dump.trails.test.ts:73-115`. Shape is restored, but a
failure between the `addColumn` and the `removeColumn` leaks a column, and the
adapter's per-table column cache is not necessarily invalidated. This is the one
mechanism that could still justify a `topics` shield; it is a *column-cache*
problem, not a table-shape one, and `fixtures({ ... })` does not address it.
Flagged for `shield-removal-topics-family` to rule in or out before deleting
sites 1–5.

### Corrections to the burndown stories

- `shield-removal-topics-family` — line numbers now `bind-parameter.test.ts:89`,
  `date.test.ts:29`, `primary-keys.test.ts:32`. **Add**
  `dirty.trails.test.ts:21` (topics), which no story currently lists.
  **`validations/uniqueness-validation.trails.test.ts:99` is already done** —
  PR #7109 landed it the same day this inventory was written, which vindicates
  the story's instruction to "fix the uniqueness suite's own addIndex first":
  that site was both the only live `topics` shape mutator AND a shield, and it
  was reding `Active Record PostgreSQL Tests` on `main` by dropping `topics`
  mid-run under a raw pool and wiping a sibling file's rows.
- `shield-removal-people-locking-dirty` — `dirty.test.ts` is `:124`, not `:118`.
  The story's guess that "the locking suites themselves reshape `people`" is
  **wrong**: neither locking suite mutates `people`. Both cited culprits
  (`autosave-association`, `callbacks`, `reflection`) are extinct. All four
  sites are group B.
- `shield-removal-schema-dumper-booleans` — `schema-dumper.test.ts` is `:1005`,
  not `:994`. Confirmed: the shield guards **its own** earlier drops
  (`:982-1001`), not a sibling. Group A; the fix is at the deferred cases.
- `shield-removal-mysql-adapter-suites` — lines are `:186`, `:244`, and `:16`
  (helper; called at `:25`). Confirmed the abstract-mysql `schema.test.ts`
  "rebuild as fixture mechanism" reading. **Add**: that file also drops
  canonical `topics` at `:228` and never restores it — a gap the `afterAll`
  `["posts"]` list misses.
- `shield-removal-migration-values` — lines are `:1678` and `:1703`, not
  `:1652`/`:1677`. Confirmed: both shield the file against **its own**
  `createTable("values", { force: true })` two lines up, exactly as the story
  predicted. Note Rails writes this bespoke `values` table verbatim
  (`activerecord/test/cases/migration_test.rb`, `ReservedWordsMigrationTest` /
  `ExplicitlyNamedIndexMigrationTest`), so renaming it is a fidelity break.
- `shield-removal-misc-singles` — lines are `delegated-type.test.ts:55`,
  `associations/required.test.ts:21`, `view.test.ts:47`,
  `enum.trails.test.ts:425`, `unsafe-raw-sql.test.ts:28`,
  `reserved-word.test.ts:105`, `primary-keys.test.ts:563`,
  `migration/exclusion-constraint.test.ts:34`,
  `migration/rename-table.test.ts:44`,
  `migration/unique-constraint.test.ts:26`. Group split: `required`,
  `reserved-word`, and the three `migration/*` sites are group A (self-drops);
  `delegated-type`, `view`, `enum.trails`, `unsafe-raw-sql`, and the cpk half of
  `primary-keys` are group B with no attributable culprit.
- `retire-setup-second-pool-rebuilds` — confirmed at `:81` and `:105`; both are
  provisioning rather than shields, so the story's "lay it through
  `loadCanonicalSchema`" framing is the right one.
- `ratchet-rebuild-canonical-tables-callers` — confirmed as the highest-value
  first landing: the three `migration/*` sites (#20–22) all arrived through the
  `require-canonical-rebuild` mandate, which is a growth mechanism, and all
  three are group A. Baseline for the frozen manifest is the 26 sites tabled
  above.
