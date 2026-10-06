---
rfc: "0180-activerecord-receipt-parity"
title: "activerecord receipts: every deviation receipt ratified or converged — split from RFC 0174"
status: active
created: 2026-10-06
updated: 2026-10-06
owner: "@deanmarano"
packages:
  - "activerecord"
  - "ruby-compat"
  - "activesupport"
  - "activemodel"
  - "trailties"
clusters:
  - audits
  - convergeable
  - findings
related-rfcs:
  - "0174-activerecord-api-parity-100"
  - "0175-activerecord-test-parity-100"
  - "0178-activerecord-arms-parity-100"
  - "0181-activerecord-member-placement"
  - "0182-activerecord-error-parity"
  - "0183-activerecord-excluded-source-files"
  - "0179-api-compare-crediting-rules"
  - "0123-blocked-convergence-holding"
  - "0127-fidelity-tooling-signals-and-hygiene"
  - "0154-ruby-compat-surfaced-deviations"
priority: 2
---

# RFC 0180 — activerecord receipts: every deviation receipt ratified or converged

## Summary

This RFC holds the work of taking activerecord's deviation receipts (`@noRailsEquivalent`,
`@missingRailsCall`, `@missingRailsArgs`, `@missingRailsName`, `@inventedArm`) down to the ones a
CLAUDE.md section ratifies. It was split out of `0174-activerecord-api-parity-100` on 2026-10-06 and took
the 59 stories of 0174's `receipts` cluster plus 30 unclustered stories that a receipt names or a
receipt audit surfaced. **89 stories, 73 open, 15,370 est-loc.** The destination of a story is decided
by one question: **does a receipt in `packages/activerecord/src` exist because of it?**

## Motivation

After RFCs 0175, 0178 and 0179 were split out, RFC 0174 still held 301 story files, 254 of them open, and
178 of them in no cluster. The receipts work was the largest coherent slice:

| Slice of 0174 (2026-10-06, from the DB)           | Stories | Open | Open est-loc |
| ------------------------------------------------- | ------- | ---- | ------------ |
| `receipts` cluster                                | 59      | 43   | 10,430       |
| unclustered, named by a receipt or audit-surfaced | 30      | 30   | 4,940        |
| the rest of 0174 after all four splits            | 166     | 127  | 15,275       |

It also works differently from the rest. The ten audit stories were a one-pass review of 417 PERMANENT
receipts against CLAUDE.md; nine are done, and what they produced is this RFC's backlog: each receipt no
section ratifies was re-tagged `CONVERGEABLE <story-id>` onto a story filed for it. Those 71 findings
are small, independent, and each is anchored to a receipt in trails, so "is it done" is a grep.

### Baseline

Measured 2026-10-06 on trails `main` @ `53cf6a5875`, by `git grep` over `packages/activerecord/src`. The
0174 column is that RFC's baseline of 2026-09-30 @ `ea7d456048`.

| Axis                                                                                                             | 0174 baseline                     | Now                    | Target                     |
| ---------------------------------------------------------------------------------------------------------------- | --------------------------------- | ---------------------- | -------------------------- |
| PERMANENT receipts                                                                                               | 417                               | 137                    | ratified only, each tabled |
| of which `@noRailsEquivalent` / `@missingRailsCall` / `@missingRailsArgs` / `@missingRailsName` / `@inventedArm` | 136 / 194 / 27 / 60 / not counted | 37 / 16 / 3 / 57 / 24  | —                          |
| CONVERGEABLE receipts                                                                                            | 104                               | 260                    | 0                          |
| of which name a story in this RFC                                                                                | —                                 | 119, across 51 stories | 0                          |
| of which name a story in RFC 0178 / 0123 / 0023 / 0183 / 0154                                                    | 44                                | 67 / 37 / 4 / 2 / 1    | converge via those stories |
| of which carry prose and name no story                                                                           | 60                                | 30                     | 0                          |

PERMANENT fell and CONVERGEABLE rose because the audits moved receipts from the first to the second. 0174's baseline did not count `@inventedArm`. The 30 story-less receipts are owned by the
`convergeable` cluster; the 57 `@missingRailsName` PERMANENT receipts are the naming pairs
`classifyPair` files as permanent and are checked by the audits.

## Design

### Scope

**In:** the PERMANENT-receipt audits; the stories that converge a named group of CONVERGEABLE receipts;
and every story a `CONVERGEABLE <story-id>` receipt in `packages/activerecord/src` names, or that a
receipt audit filed. Three clusters:

| Cluster        | What it holds                                                                     | Stories      |
| -------------- | --------------------------------------------------------------------------------- | ------------ |
| `audits`       | `activerecord-audit-permanent-receipts-*`: check each PERMANENT against CLAUDE.md | 10 (1 open)  |
| `convergeable` | `activerecord-converge-*`: converge a named group of story-less receipts          | 8 (5 open)   |
| `findings`     | one deviation each, surfaced by an audit or named by a receipt                    | 71 (67 open) |

### Where a story goes

This table is repeated in 0174 § "Split: RFCs 0180 to 0183".

| The story's first acceptance criterion                                                                                                   | File it in |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| moves a member into the file mirroring the `.rb` that defines it (`inlined-from`, `parity:api:moves`)                                    | RFC 0181   |
| changes an error class, message or raise site, or deletes an error-parity / callback-invocations exclude row                             | RFC 0182   |
| ports or un-excludes a `.rb` listed in `scripts/parity/unported-files/`                                                                  | RFC 0183   |
| deletes a receipt in `packages/activerecord/src`; or a `CONVERGEABLE <story-id>` receipt names the story; or a receipt audit surfaced it | here       |
| deletes a row of the arms, void-return or duck-type report                                                                               | RFC 0178   |
| changes a test file, test model, fixture or the test schema                                                                              | RFC 0175   |
| any other activerecord source-side axis                                                                                                  | RFC 0174   |

The rows are read top to bottom and the first match wins. So a story a receipt names goes to RFC 0181,
0182 or 0183 when its subject is theirs, and to RFC 0180 otherwise.

Two stories that both port and re-score moved here because trails receipts cite them (17 and 8 times):
`pg-gem-result-and-array-coders-score-against-the-pg-gem` and
`sqlite3-gem-c-surface-and-driver-covers-score-against-the-vendored-gem`. 0174 § "Split: RFC 0179" had
kept them in 0174 as port stories; the receipt rule above now decides it.

### Principles

These are 0174's, unchanged:

- **Converge, never ratify.** Each story deletes rows or receipts. None adds a baseline row, a receipt, a
  skip or an exclude entry.
- **Blocked, not ratified.** Where a story hits a gap CLAUDE.md does not ratify, it is `blocked` with the
  concrete blocker (§ "Blocked"), never re-worded into a PERMANENT receipt.
- **Measurement faults are fixed in the tool**, with a unit test, and the fault story is filed in the RFC
  that owns the tool (RFC 0127 for signals and ratchets; RFC 0179 is closed).
- **Each story is one PR**, `est-loc` ≤ 650. A leftover is filed here as its own story with the Rails
  `file:line`.
- **The receipt is deleted in the PR that converges it.** The receipts gate reds a receipt that suppresses
  nothing, and `stale-story-references` reds a citation of a closed story, so a story is not marked done
  while trails still cites it.
- **An audit never re-words a receipt.** A PERMANENT receipt no section ratifies becomes
  `CONVERGEABLE <story-id>` and a `findings` story here, with the Rails `file:line`.

### Ordering

- `activerecord-audit-permanent-receipts-subsystems-part-2` is the last open audit. It will file more
  `findings` stories here, so the count above is a floor.
- In-RFC edges: `schema-creation-visit-alter-table-maps-through-an-awaiting-map` and
  `pg-schema-statements-reflection-maps-rows-through-an-awaiting-map` wait on
  `preloader-through-records-by-owner-map-awaits-each-loader`; `has-default-function-matches-through-regexp-match-p`
  and `pg-constraint-export-name-on-schema-dump-matches-through-regexp-match-p` wait on
  `export-name-on-schema-dump-matches-through-a-stateless-regexp-match-p`;
  `create-record-passes-returning-columns-unconditionally` waits on
  `mysql-returning-column-values-ports-the-super-arm`. The first two groups each share one ruby-compat primitive.
- Many `findings` add a ruby-compat primitive (`Hash#select!`, `Regexp#match?`, `String#insert`,
  `Kernel#sleep`). Two stories that need the same primitive are ordered by a `deps` edge when the second
  is marked ready.

### Gating

- **`active` from birth**, for 0174's reason: `claimable()` surfaces a story only when its own RFC is
  `active`. The 6 `ready` stories here were claimable in 0174 and stay claimable.
- **Edges out of this RFC, open:** `activerecord-converge-schema-load-and-primary-key-convergeable-receipts`
  waits on `sync-reads-of-async-reflection-retire-with-rfc-0073` (RFC 0123, blocked);
  `sql-datetime-formatters-fold-into-quoted-date-and-quoted-time` waits on
  `quoted-date-usec-arm-is-relocated-into-sql-datetime` (RFC 0178, moved there in this split). The three edges into RFC 0174 and the two into RFC 0173 are all on done stories.
- **Edges into this RFC, open:** `activerecord-retire-check-pending-skip` (RFC 0174) and
  `activerecord-relocate-persistence-model-schema-counter-cache-bodies` (RFC 0181) wait on
  `activerecord-converge-schema-load-and-primary-key-convergeable-receipts`;
  `activerecord-relocate-remaining-base-hosted-inlined-bodies` (RFC 0181) waits on
  `activerecord-converge-inheritance-convergeable-receipts`.
- **Edges into this RFC from the 0174 close-out.** `activerecord-api-parity-100-close-out` named these
  stories one by one in `deps`. This split replaces those entries with one `deps-rfc` edge on
  `0180-activerecord-receipt-parity`, the whole-RFC case 0174 § "Gating" describes: the close-out waits until this RFC is
  closed, including stories filed here later. The edit is in the split's own diff, so nothing is owed
  after merge.

## Stories

All 89. Status is DB-owned and is not repeated here: `pnpm tasks list --rfc 0180-activerecord-receipt-parity`.

| Story                                                                               | est-loc | Cluster      |
| ----------------------------------------------------------------------------------- | ------- | ------------ |
| `activerecord-audit-permanent-receipts-associations`                                | 500     | audits       |
| `activerecord-audit-permanent-receipts-ca-abstract`                                 | 500     | audits       |
| `activerecord-audit-permanent-receipts-ca-drivers`                                  | 500     | audits       |
| `activerecord-audit-permanent-receipts-ca-root`                                     | 500     | audits       |
| `activerecord-audit-permanent-receipts-relation-part-1`                             | 500     | audits       |
| `activerecord-audit-permanent-receipts-relation-part-2`                             | 500     | audits       |
| `activerecord-audit-permanent-receipts-root-a-m`                                    | 500     | audits       |
| `activerecord-audit-permanent-receipts-root-n-z`                                    | 500     | audits       |
| `activerecord-audit-permanent-receipts-subsystems-part-1`                           | 500     | audits       |
| `activerecord-audit-permanent-receipts-subsystems-part-2`                           | 500     | audits       |
| `activerecord-converge-command-recorder-inverse-table-methods`                      | 400     | convergeable |
| `activerecord-converge-configuration-and-connection-convergeable-receipts`          | 250     | convergeable |
| `activerecord-converge-dumper-adapter-sqlite-encryption-convergeable-receipts`      | 350     | convergeable |
| `activerecord-converge-inheritance-convergeable-receipts`                           | 350     | convergeable |
| `activerecord-converge-reflection-nested-enum-store-convergeable-receipts`          | 300     | convergeable |
| `activerecord-converge-schema-load-and-primary-key-convergeable-receipts`           | 500     | convergeable |
| `activerecord-converge-selector-middleware-convergeable-receipts`                   | 200     | convergeable |
| `activerecord-converge-test-infra-convergeable-receipts`                            | 450     | convergeable |
| `adapter-backoff-sleeps-through-a-ruby-compat-kernel-sleep`                         | 120     | findings     |
| `adapter-discard-bang-abandons-the-socket-through-the-driver-port`                  | 250     | findings     |
| `adapter-extended-type-maps-onto-concurrent-map`                                    | 120     | findings     |
| `ar-read-attribute-for-validation-is-not-send`                                      | 200     | findings     |
| `association-marshal-dump-maps-its-instance-variables`                              | 120     | findings     |
| `association-symbol-iterators-come-from-ruby-compat-enumerable`                     | 100     | findings     |
| `association-target-scope-calls-association-relation-create`                        | 200     | findings     |
| `atomic-write-takes-its-block-without-a-temp-dir-placeholder`                       | 100     | findings     |
| `base-allocate-comes-from-a-ruby-compat-rb-obj-alloc`                               | 250     | findings     |
| `batch-enumerator-enumerable-over-an-async-each`                                    | 300     | findings     |
| `build-insert-sql-reads-keys-first-without-spreading-the-set`                       | 50      | findings     |
| `collection-association-ids-reader-plucks-through-enumerable-pluck`                 | 120     | findings     |
| `collection-proxy-async-iterator-has-no-rails-counterpart`                          | 150     | findings     |
| `connection-handler-pool-manager-map-onto-concurrent-map`                           | 120     | findings     |
| `connection-url-resolver-parses-through-uri-rfc2396-parser`                         | 300     | findings     |
| `connection-url-resolver-query-hash-camelizes-every-key`                            | 120     | findings     |
| `create-record-passes-returning-columns-unconditionally`                            | 150     | findings     |
| `database-selector-session-timestamps-are-ruby-times`                               | 150     | findings     |
| `define-method-on-a-class-receiver-goes-through-ruby-compat`                        | 200     | findings     |
| `delete-collection-proxy-for-inline-association-reader`                             | 600     | findings     |
| `encryption-encoding-helpers-fold-into-string-encode-and-header-reads`              | 250     | findings     |
| `encryption-install-support-takes-no-targets-and-no-installed-flag`                 | 300     | findings     |
| `enum-undeclared-type-raise-reads-no-cold-schema-replay-flag`                       | 200     | findings     |
| `explain-proxy-drops-thenable-callers-await-inspect`                                | 200     | findings     |
| `export-name-on-schema-dump-matches-through-a-stateless-regexp-match-p`             | 80      | findings     |
| `find-cmd-and-exec-replaces-the-process-through-kernel-exec`                        | 250     | findings     |
| `fixture-set-file-ts-fixture-module-registry-has-no-rails-counterpart`              | 600     | findings     |
| `foreign-association-is-a-module-mixed-into-has-one-and-has-many`                   | 150     | findings     |
| `generated-relation-methods-mutex-synchronize-is-unported`                          | 120     | findings     |
| `has-default-function-matches-through-regexp-match-p`                               | 60      | findings     |
| `load-async-disabled-arm-calls-load-and-dedupes-in-flight-load`                     | 300     | findings     |
| `model-class-names-resolve-through-constantize-not-a-model-registry`                | 400     | findings     |
| `model-namespace-reads-the-constant-path-not-a-module-name-static`                  | 300     | findings     |
| `model-schema-instance-readers-come-from-delegate-to-class`                         | 150     | findings     |
| `mysql-returning-column-values-ports-the-super-arm`                                 | 80      | findings     |
| `mysql-schema-statements-indexes-ports-the-rails-body`                              | 150     | findings     |
| `mysql2-adapter-initialize-sets-found-rows-on-config-flags`                         | 400     | findings     |
| `nodejs-inspect-custom-hooks-come-from-one-ruby-compat-seam`                        | 150     | findings     |
| `optimistic-locking-instance-methods-fold-into-the-optimistic-module`               | 200     | findings     |
| `pg-and-mysql-wire-casts-register-where-rails-configures-the-driver`                | 250     | findings     |
| `pg-constraint-export-name-on-schema-dump-matches-through-regexp-match-p`           | 30      | findings     |
| `pg-explain-pretty-printer-centers-through-string-center`                           | 40      | findings     |
| `pg-gem-result-and-array-coders-score-against-the-pg-gem`                           | 300     | findings     |
| `pg-max-identifier-length-sync-async-split`                                         | 110     | findings     |
| `pg-schema-dumper-reads-its-connection-without-any-typed-guards`                    | 80      | findings     |
| `pg-schema-statements-reflection-maps-rows-through-an-awaiting-map`                 | 200     | findings     |
| `pool-config-instances-is-an-objectspace-weak-map`                                  | 200     | findings     |
| `pp-is-kernel-pp-in-ruby-compat-not-an-activerecord-export`                         | 350     | findings     |
| `preloader-new-stub-seam-onto-a-ruby-compat-class-new`                              | 200     | findings     |
| `preloader-through-records-by-owner-map-awaits-each-loader`                         | 120     | findings     |
| `reaper-register-pool-spawns-its-thread-through-spawn-thread`                       | 250     | findings     |
| `regexp-union-comes-from-ruby-compat`                                               | 200     | findings     |
| `relation-async-iterator-has-no-rails-counterpart`                                  | 400     | findings     |
| `relation-presence-comes-from-activesupport-object-presence`                        | 100     | findings     |
| `result-includes-enumerable-and-cast-values-asks-columns-one-p`                     | 120     | findings     |
| `reversible-block-helper-up-down-yield-in-line`                                     | 120     | findings     |
| `schema-cache-load-from-ports-the-marshal-and-yaml-load-arms`                       | 250     | findings     |
| `schema-creation-visit-alter-table-maps-through-an-awaiting-map`                    | 60      | findings     |
| `schema-dumper-dump-language-is-a-class-static-rails-has-no-seat-for`               | 200     | findings     |
| `schema-dumper-formatted-version-inserts-through-string-insert`                     | 80      | findings     |
| `sql-datetime-formatters-fold-into-quoted-date-and-quoted-time`                     | 300     | findings     |
| `sqlite-driver-adapter-subclasses-carry-file-level-covers`                          | 300     | findings     |
| `sqlite-uri-helpers-port-memory-database-as-rails-computes-it`                      | 150     | findings     |
| `sqlite3-gem-c-surface-and-driver-covers-score-against-the-vendored-gem`            | 300     | findings     |
| `sqlite3-new-column-from-field-is-this-typed-with-raw-reads`                        | 80      | findings     |
| `temporal-wire-parsers-fold-into-the-oid-and-type-cast-bodies`                      | 450     | findings     |
| `timestamp-current-time-from-proper-timezone-reads-the-connection-default-timezone` | 200     | findings     |
| `touch-later-touch-takes-rails-parameters-and-resumes-through-super-method`         | 180     | findings     |
| `translation-const-carries-i18n-scope-and-lookup-ancestors-follows-rails`           | 60      | findings     |
| `validates-size-of-is-an-alias-of-validates-length-of`                              | 30      | findings     |
| `weak-thread-key-map-prunes-through-hash-select-bang`                               | 90      | findings     |

## Blocked

- `pg-max-identifier-length-sync-async-split`: PostgreSQL's `table_alias_length` is
  `max_identifier_length` (`abstract/database_limits.rb:16-18`), and `JoinDependency#initialize` reads it
  synchronously through `AliasTracker.create` inside the sync `toSql` builders CLAUDE.md
  § "`Relation` is evaluated by an async query" ratifies. An async `max_identifier_length` needs an async
  `table_alias_length`, which that build cannot await. Unblocking is a `tasks` verb, not an edit here.

## Non-goals

- **Crediting rules in the comparer.** A body that already matches Rails and is still flagged is a
  comparer fault. RFC 0179 held those and closed on 2026-10-03 with all 31 of its stories done or closed. A new one is
  filed in `0127-fidelity-tooling-signals-and-hygiene`; because 0127 is `draft`, a story here that waits on
  it is not claimable until 0127 is activated, and § "Gating" must then list the edge.
- **Receipts in other packages.** arel and activemodel are rowless; the other packages have their own RFCs.
- **Ratifying new CLAUDE.md sections.** An audit that finds a genuine language shortcoming files the story
  `blocked`; deciding to ratify is a separate, explicit decision.
- **Receipts that name a story in another RFC.** 111 CONVERGEABLE receipts name stories in RFCs 0178, 0123,
  0023, 0183 and 0154. Those stories converge them; 0174's close-out counts them.
- **A close-out story.** 0174's close-out re-measures this axis with every other one and pins it at zero.
  A second close-out here would measure the same rows twice.

## Alternatives considered

The four splits of 2026-10-06 were cut together. RFC 0178 § "Alternatives considered" rejected each of
these seams on 2026-10-02, for reasons that no longer hold:

- **`receipts` was "three unrelated things under one label".** RFC 0179 has since taken the comparer-rule
  stories out, so what is left is audits, receipt convergences and audit findings.
- **`placement`, `skips` and `calls-args` had edges into the clusters.** They still do (§ "Gating"), but a
  `deps` edge resolves by slug across RFCs, and cutting all four seams at once leaves 7 open cross-RFC
  edges in total.
- **`errors` and `excluded-files` were "too small to earn an RFC".** Each now also takes the unclustered
  stories on its subject, and 0174 at 301 stories is the larger cost.

- **Move only the 59 clustered stories**: rejected. 19 unclustered stories are named by a receipt in
  trails and 11 more say in their Context that a receipt audit filed them. They are the same kind of work,
  and leaving them behind would leave "does a receipt name it" with two answers.
- **Keep one `receipts` cluster**: rejected. `tasks next-bundle --cluster` would mix a 500-line audit
  with a 30-line finding. Three clusters cost one frontmatter line per story.
- **Split the findings by subsystem** (adapters, relation, associations): rejected, for the reason RFC 0178
  gives: every subsystem carries a slice of every axis.

## Rollout

Status is from the DB as of 2026-10-06. The clusters can be worked in parallel.

1. **Audits.** 10 stories, 1 open, 500 est-loc.
   - Ready: `activerecord-audit-permanent-receipts-subsystems-part-2`
   - Done: `activerecord-audit-permanent-receipts-associations` (trails#8328), `activerecord-audit-permanent-receipts-ca-abstract` (trails#8389), `activerecord-audit-permanent-receipts-ca-drivers` (trails#8390), `activerecord-audit-permanent-receipts-ca-root` (trails#8394), `activerecord-audit-permanent-receipts-relation-part-1` (trails#8391), `activerecord-audit-permanent-receipts-relation-part-2` (trails#8392), `activerecord-audit-permanent-receipts-root-a-m` (trails#8393), `activerecord-audit-permanent-receipts-root-n-z` (trails#8395), `activerecord-audit-permanent-receipts-subsystems-part-1` (trails#8396)
2. **Story-less CONVERGEABLE receipts.** 8 stories, 5 open, 1,850 est-loc.
   - Ready: `activerecord-converge-dumper-adapter-sqlite-encryption-convergeable-receipts`, `activerecord-converge-inheritance-convergeable-receipts`, `activerecord-converge-schema-load-and-primary-key-convergeable-receipts`, `activerecord-converge-selector-middleware-convergeable-receipts`, `activerecord-converge-test-infra-convergeable-receipts`
   - Done: `activerecord-converge-command-recorder-inverse-table-methods` (trails#8445), `activerecord-converge-configuration-and-connection-convergeable-receipts` (trails#8320), `activerecord-converge-reflection-nested-enum-store-convergeable-receipts` (trails#8443)
3. **Findings.** 71 stories, 67 open, 13,020 est-loc. Slugs are in § "Stories".
   - Ready: 0. Draft: 66. Blocked: 1. Done: 4.
   - Done: `adapter-extended-type-maps-onto-concurrent-map` (trails#8490), `association-marshal-dump-maps-its-instance-variables` (trails#8353), `connection-url-resolver-parses-through-uri-rfc2396-parser` (trails#8542), `model-namespace-reads-the-constant-path-not-a-module-name-static` (trails#8488)

## Verification

- `git grep -h CONVERGEABLE -- packages/activerecord/src` names no story of this RFC, down from 119
  receipts across 51 stories, and no receipt carries prose in place of a story id, down from 30.
- Every PERMANENT receipt in `packages/activerecord/src` is tabled against the CLAUDE.md section that
  ratifies it, in the last audit's PR body. Today there are 137.
- `pnpm parity:api:receipts:gate`, `pnpm parity:api:calls`, `pnpm parity:api:calls:args` and
  `pnpm parity:api:extra:gate` stay green with no row added.
- `pnpm tasks list --rfc 0180-activerecord-receipt-parity` shows no open story except the blocked one.

## End condition

This RFC closes when every Verification line holds. It is a bucket while audits and reviews keep finding
unratified receipts: a new one is filed here with `pnpm tasks new 0180-activerecord-receipt-parity <slug>
--body-file <path>`, naming the Rails `file:line`, the TS body and the receipt it carries.

## Open questions

None is open.

1. **Should the 66 drafts be marked ready?** Resolved: not by this split. `status` is DB-owned and a move
   does not change it; marking one ready is `tasks status-set <id> ready`. Every draft has a Rails `file:line`, acceptance
   criteria and an estimate of at most 600, so each can be marked as it is. Until some are, the claimable work
   here is the one open audit and the five `convergeable` stories.
2. **Two unsized stories.** Resolved: `delete-collection-proxy-for-inline-association-reader` (600) and
   `load-async-disabled-arm-calls-load-and-dedupes-in-flight-load` (300) had a slug for a title and no
   `est-loc`. Both are set in this split, which is why the RFC opens at 15,370 est-loc against the DB's 14,470.

## Changelog

- 2026-10-06: created by splitting the receipts work out of `0174-activerecord-api-parity-100`. 89 stories
  moved (16 done, 6 ready, 66 draft, 1 blocked). Each changes its `rfc:` and `cluster:` lines; two also
  take a title and an `est-loc`.
