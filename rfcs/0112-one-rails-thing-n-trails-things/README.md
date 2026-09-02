---
rfc: "0112-one-rails-thing-n-trails-things"
title: "One Rails thing, N trails things — duplicate bodies and split stores"
status: closed
created: 2026-08-18
updated: 2026-09-02
owner: "@deanmarano"
packages:
  - "activerecord"
  - "activemodel"
  - "activesupport"
  - "actionpack"
  - "arel"
  - "date"
  - "globalid"
  - "trailties"
clusters:
  - "duplicate-bodies"
  - "split-stores"
  - "dead-mixin-companions"
  - "wrapper-vs-subclass"
  - "duplicate-definition-gate"
related-rfcs:
  - "0111-error-class-message-parity"
  - "0023-surfaced-deviations"
  - "0006-collection-store-unification"
  - "0026-adapter-layout-fidelity"
  - "0107-relation-ts-decomposition"
priority: 2
---

# RFC 0112 — One Rails thing, N trails things

## Summary

The most repeated pathology in the deviation backlog: Rails keeps **one** body,
or **one** ivar; trails keeps two or three and hand-syncs them. 93 open
`0023-surfaced-deviations` stories describe it — 43 duplicated code, 50
duplicated state — for roughly 14,390 estimated LOC, a fifth of that register.

This is the generalisation of **RFC 0006**, which fixed exactly this shape for
collection stores (`_cachedAssociations` + the proxy's target array → the
association's `@target`), closed after 5 stories, and never came back for the
rest of the repo.

## Motivation

### Duplicated state

| Rails keeps            | trails also keeps                                         |
| ---------------------- | --------------------------------------------------------- |
| `joins_values`         | `_joinClauses`, a raw-SQL/Arel side-channel               |
| `with_values`          | a bespoke `_ctes` array                                   |
| `@statements`          | `_statementPool`, plus a `_statementPoolForTest` accessor |
| `@raw_connection.nil?` | `_permanentlyClosed` **and** `_isFakeConnection`          |
| `Base.configurations`  | `DatabaseTasks.databaseConfiguration`, a second registry  |
| `@association_cache`   | the same map, holding ad-hoc non-`Association` literals   |

### Duplicated code

- `abstract/database-statements.ts` defines each method **twice** — once as a
  free function, once on the mixin.
- `_assign_attributes`: Rails 1, trails 3.
- `SchemaDumper#tables`: Rails one body; trails an async branch plus a
  synchronous fast path that re-walks the tables inline.
- `AssociationScope#_mergeReferencedJoins` hand-reimplements `Merger#merge_joins`
  / `#merge_outer_joins`, which are ported, Rails-faithful, and sitting in
  `relation/merger.ts`.

### Why this is not two RFCs

The two halves cause each other. A duplicated body usually exists **because** a
second store feeds it; a second store survives **because** a second body reads
it. Split into two RFCs, each blocks on the other.

The 2026-08-18 triage pass hit this concretely: retiring the bespoke `_ctes`
array is what puts the already-ported `build_with_value_from_hash` on the live
path at all. Converging one without the other is not smaller, it is impossible.

### Why it is worth a campaign rather than piecemeal fixes

Hand-synced stores drift, and the drift is invisible until it isn't. RFC 0006's
motivation said it first — _"so we stop hand-syncing them"_ — and the same
sentence now applies to at least six more pairs. Every one of them is a place
where a fidelity fix to one copy silently leaves the other behind.

## Design

### Gate: one cheap half, one that needs an extractor change

**Duplicate bodies — cheap.** `parity:api` already matches every TS definition
to its Ruby counterpart; that matching is the whole point of the manifest. A
Ruby method claimed by two or more TS definitions is derivable from the existing
artifact with **no extractor change** — a `duplicate-definitions` ratchet with
the same only-shrink contract as the RFC 0084 / 0095 call gates.

**Split stores — needs work.** `scripts/api-compare/extract-ruby-api.rb` is a
Ripper AST walker that captures methods, params, calls and visibility — **but
not ivars**. Comparing "Rails ivars on this class" against "private fields on
the TS class" means teaching it to collect `@ivar` assignment nodes. The AST is
already in hand so this is tractable, but it is real tooling work and is scoped
as this RFC's **first story**, not assumed.

If the ivar extractor turns out to be noisy — Rails memoisation ivars,
`@__ivar` internals, ivars set only in tests — ship the duplicate-definition
gate alone and run the store half as an ungated campaign. Say so rather than
widening an allowlist until it goes quiet.

### Scope boundary against RFC 0107

Four of the 50 split-store stories live **only** in
`packages/activerecord/src/relation.ts`. That file is RFC 0107's territory —
`active`, priority 1, explicitly about relation.ts decomposition and invented
machinery. **Those four stay with 0107; this RFC takes the other 89.** Without
this line the two campaigns collide on the largest file in the repo.

### Representative stories

| est-loc | story                                                          |
| ------: | -------------------------------------------------------------- |
|     400 | `fold-join-clauses-into-joins-values`                          |
|     400 | `retire-associations-array-for-reflection-registry`            |
|     400 | `current-attributes-port-body`                                 |
|     350 | `consolidate-three-assign-attributes-implementations`          |
|     300 | `with-clause-uses-bespoke-ctes-not-with-values`                |
|     300 | `consolidate-duplicated-through-association-module`            |
|     250 | `database-statements-duplicate-bodies-free-function-and-mixin` |
|     200 | `association-cache-holds-only-association-instances`           |
|     150 | `string-inquirer-wraps-a-value-where-rails-subclasses-string`  |

## Non-goals

- **`relation.ts`-only stores.** RFC 0107 owns them; see the scope boundary.
- **Adapter method _homing_** — a body on `Mysql2Adapter` that Rails puts on
  `AbstractMysqlAdapter`. Six such stories overlap the dead-mixin-companion wave
  and come along for free; the other ~36 belong to closed RFC 0026's
  methodology and should re-open it rather than expand this one.
- **Collapsing sync/async twins as a class.** Where a sync copy exists purely
  because a TS body cannot await, that is RFC 0063 / 0068 / 0087 territory. Only
  twins with no async justification are in scope here.
- **Deleting a store that carries behaviour Rails lacks** without first tracing
  that behaviour to a Rails line. A store is not invented merely because Rails
  has no field by that name.

## Alternatives considered

- **Re-open RFC 0006 and widen it.** Tempting — it is the precedent and the
  title still fits. Rejected because 0006 is `closed` with all 5 stories `done`;
  re-opening a terminal RFC to hold 93 new stories misrepresents what it
  delivered and breaks its own verification claim.
- **Two RFCs, one per half.** Rejected on the mutual-dependency argument above.
- **Fold into RFC 0107.** 0107's framing is one file. 62 of the 93 stories touch
  `activerecord` but only 4 are relation.ts-only; the rest span
  `activesupport`, `activemodel`, `actionpack`, `arel` and three more packages.
- **Gate first, stories later.** The duplicate-definition gate could ship before
  any convergence and would immediately red a large surface. Rejected: a gate
  with no landing path is a blocked CI job, not a plan. Gate lands in Phase 1
  report-only.

## Rollout

Story IDs are assigned when the RFC moves to `active` and the 89 stories
re-home.

1. **Phase 1 — tooling.** Duplicate-definition ratchet over the existing
   `parity:api` artifact, report-only. Ivar collection in
   `extract-ruby-api.rb`, also report-only. Both must land before the noise
   floor can be judged.
2. **Phase 2 — dead mixin companions.** ~10 stories, ~2,060 LOC. A body on the
   concrete class plus a mixed-in companion that never runs. Mechanically
   findable, mostly deletion, and the cheapest evidence that the gate works.
3. **Phase 3 — bespoke parallel stores.** The `_joinClauses` / `_ctes` /
   `_associations` / `_statementPool` family. The highest-value half, and where
   the ivar extractor pays for itself.
4. **Phase 4 — N divergent copies of one method.** ~7 stories, ~1,190 LOC. Each
   is a merge, so each needs the behavioural union of the copies established
   first. Slowest per LOC; deliberately last.
5. **Phase 5 — wrappers where Rails subclasses the real thing.**
   `StringInquirer` wrapping a `_value`, `GlobalID#uri` as a string rather than a
   `URI::GID`, `AdapterSchemaSource` hand-projecting column flags instead of
   passing `Column`s.

## Verification

- The `duplicate-definitions` baseline reaches **0 rows** for the 89 in-scope
  stories' files.
- No Ruby method in the `parity:api` manifest is claimed by more than one TS
  definition outside a reviewed exclusion.
- Named stores are gone repo-wide: `_joinClauses`, `_ctes`, `_statementPool`,
  `_permanentlyClosed`, `_isFakeConnection`, `DatabaseTasks.databaseConfiguration`.
- `pnpm parity:api:extra` novel-name count drops for every file touched — a
  retired duplicate is invented surface leaving the tree.
- All three adapter lanes green throughout; no story converges by adding a
  baseline row.

## Open questions

1. **Is the ivar extractor's signal usable?** Rails uses ivars for memoisation
   (`@composite_query_constraints_list ||= …`) as freely as for state, and a
   memo is not a store. **Recommendation:** collect ivars in Phase 1
   report-only, then decide — and if memo-vs-store cannot be separated
   mechanically, run Phase 3 ungated rather than shipping a gate nobody trusts.
2. **How much of Phase 4 is really a merge?** Three copies of
   `_assign_attributes` may be three copies of the _same_ body, in which case it
   is a deletion, not a reconciliation.
   **Recommendation:** diff the three before sizing; `consolidate-three-assign-attributes-implementations`
   currently carries est-loc 350 on the pessimistic reading, and its sibling
   `activemodel-assign-attribute-still-writes-through-write-attribute` (140)
   should land first — it puts all three on the same shape and materially lowers
   that estimate.
3. **Does the RFC 0107 boundary hold as 0107 progresses?** 0107 is decomposing
   `relation.ts`; a store that is relation.ts-only today may not be next month.
   **Recommendation:** re-check the boundary at each phase transition rather
   than fixing the split once.

## Wind-down

This RFC is closing. 174 of its 188 stories are done or closed, and the
remainder has been triaged to the active RFC that already owns the surface each
one touches, rather than carried into a successor epic:

| Re-homed to                               | Stories                                                                                                                                                                                                                                                                                      |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0129-ruby-compat`                        | `converge-actioncontroller-metal-header-seat-onto-response`, `response-content-type-and-charset-reparse-what-parsed-content-type-header-already-parsed`, `activesupport-stringio-puts-for-rack-errors`                                                                                       |
| `0133-rack-session-gem-port`              | `rack-request-env-header-accessor-names`                                                                                                                                                                                                                                                     |
| `0104-twitter-app-full-stack-integration` | `converge-csp-permissions-policy-middleware-into-their-rails-file`, `model-response-cache-control-hash-for-expires-in-and-fresh-when`, `port-wrap-parameters-class-macro`                                                                                                                    |
| `0105-ar-deps-test-parity-100`            | `retire-the-find-collection-target-test-helper`                                                                                                                                                                                                                                              |
| `0123-blocked-convergence-holding`        | `association-helpers-extracted-for-the-collection-proxy`, `association-scope-cpk-mismatch-second-raise-site`, `process-nested-attributes-is-a-second-deferred-path`, `module-ext-module-methods-take-an-explicit-receiver`, `delegate-is-an-ar-association-special-case-not-module-delegate` |

The first two groups follow the work: PR #7366 converged
`ActionDispatch::Response`'s header seat under `0129-ruby-compat` and
explicitly deferred the two header stories now sitting beside it, and
`0133-rack-session-gem-port` already carries the `Rack::Request::Helpers`
convergences that `rack-request-env-header-accessor-names` belongs with.

**One story stays here**, and the RFC stays `active` until it lands:
`bridge-activesupport-railtie-registry-into-application-initialize` is claimed
and in flight, and moving a claimed story out from under the agent holding it
buys nothing. Close this RFC when that story is done — no other work remains.

## Changelog

- 2026-09-02: closed; the last eight stories, all trailtie/boot-path scope
  creep, re-homed to 0104 and 0113 after PR #7386 closed unmerged.
- 2026-09-01: triaged the 14 unfinished stories out to five active RFCs; 13
  moved, one claimed story held back. RFC stays active until it lands.
- 2026-08-18: initial RFC, carved out of `0023-surfaced-deviations` by the
  backlog triage pass.

## Closed 2026-09-02

**The goal is met on the store half, and the gate shipped report-only as
designed.** Of the six stores the Verification section names, four are gone
repo-wide on `origin/main` — `git grep` finds no `_joinClauses`, `_ctes`,
`_statementPool`, or `_cachedAssociations` anywhere under `packages/`. Two
remain and are out of this RFC's reach: `_permanentlyClosed` and
`_isFakeConnection` still sit side by side on `Mysql2Adapter`
(`connection-adapters/mysql2-adapter.ts:126-127`), adapter territory that
`0119-connection-adapter-fidelity` now owns; and
`DatabaseTasks.databaseConfiguration` survives as the CLI's test-harness config
seat (`packages/activerecord-cli/src/db-helpers.ts:28` and five test files).

Phase 1's cheap half landed as `pnpm parity:structural-duplicates:report`
(`scripts/api-compare/report-structural-duplicates.ts`), report-only, exactly
as the design said it should be — it was never flipped to an enforcing
`duplicate-definitions` ratchet, so the "baseline reaches 0 rows" criterion was
never armed. The ivar work in `scripts/api-compare/extract-ruby-api.rb` exists
(`collect_ivar_option_keys`, the `:@ivar` shape arm) but as option-key
collection rather than the store-vs-store comparison Open Question 1 asked for;
that question was answered by running Phase 3 ungated, which is what the
Recommendation permitted.

167 stories done across trails PRs #6369–#7387, 9 closed as void on re-check.

## Wind-down, second pass — 2026-09-02

The 2026-09-01 triage below left one claimed story here; since then that work
finished and eight more stories accumulated on the trailtie/railtie-config
surface, all of them scope creep past the original charter (the RFC was carved
for `activerecord`/`activesupport` duplicate bodies and split stores; these are
application-boot files). PR #7386, which carried the Trailtie fold, **closed
unmerged on 2026-09-02**, so its two in-progress stories and the one story it
had closed all returned to `ready` with nothing landed. All eight are re-homed:

| Re-homed to                               | Stories                                                                                                                                                                                                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `0104-twitter-app-full-stack-integration` | `fold-the-two-trailtie-ports-into-one`, `activesupport-trailtie-initializer-drops-before-after-options`, `reset-trailtie-registry-between-tests`, `globalid-trailtie-app-config-is-a-property-shape-the-application-lacks`, `set-hash-digest-class-reads-the-static-config-not-the-app`, `port-railtie-configuration-dynamic-options-test`, `test-case-process-rebuilds-the-request-instead-of-reusing-it` |
| `0113-branch-and-guard-parity`            | `railtie-configuration-drops-respond-to-super-and-shadow-guard`                                                                                                                                                                                                |

0104 owns the convergence onto one real `Trailties::Application` that actually
serves requests, which is the same defect the Trailtie fold and the
`app.config` reads are instances of. The one exception is a missing-arm story
— `respond_to?` dropping its `super ||` arm and `method_missing` dropping the
`actual_method?` raise (`railtie/configuration.rb:90-105`) — which is 0113's
axis, not a duplicate store.

No story remains under this RFC.

