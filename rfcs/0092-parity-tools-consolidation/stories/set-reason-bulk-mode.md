---
title: "Add a --set-reason bulk mode to lint-call-mismatches.ts"
status: done
updated: 2026-08-09
rfc: "0092-parity-tools-consolidation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 6275
claim: "2026-08-09T02:30:47Z"
assignee: "converge-check-constraint-name-fetch-semantics"
blocked-by: null
closed-reason: null
---

## Context

The `parity:api:calls` triage audit of 2026-08-08 names this the one piece of tooling
that would pay for itself. Its bulk-clearance plan applies a small number of
cluster-vetted reason texts to large row sets — 32 mutex/monitor rows, 16 Ruby
core-constructor rows, 20 reflection rows, 34 Hash-idiom rows, 15
`Array.wrap` rows — roughly **150 row rewrites spread across ~80 shard files**
under `scripts/api-compare/call-mismatches-exclude/`. There is no supported way
to do that today.

Hand-editing the shard JSON is specifically forbidden: `serializeBaseline`
(`scripts/api-compare/baseline-json.ts:26`) owns the encoding, and a
`json.dumps`-style rewrite escapes em-dashes and reds Unit Tests. The existing
flags do not cover it either — `--write` reseeds from the artifact and
_preserves_ existing reasons rather than setting them, and `--report` /
`--unreviewed` are read-only.

Build a `--set-reason <category>` mode on
`scripts/api-compare/lint-call-mismatches.ts`:

- **Predicate.** A category is a named predicate over baseline rows: call name
  ∈ a set, plus optionally a regex over the _Ruby call-site line_. Categories
  live in a table in the source, not on the command line — each one carries its
  reason text and the audit evidence that vetted it, so the rationale is
  reviewable in the diff rather than lost in a shell history.
- **Prerequisite worth scoping for.** `CallMismatchKey` is
  `{package, tsFile, rubyName, call}` (`call-mismatch-baseline.ts:63-68`) — it
  carries **no Ruby file or line**, so a receiver regex needs a join against the
  Rails manifest (`scripts/api-compare/output/rails-api.json`) or the freshly
  regenerated artifact. Land the join, or scope the first cut to call-name-only
  predicates and state that explicitly; do not fake the receiver test.
- **Write path.** Rewrite matching rows' `reason` through the existing
  `writeSplitBaseline` / `serializeBaseline` path. Refuse to overwrite a reason
  that is not the seeded `DEFAULT_REASON` unless `--force` is passed — an
  already-reviewed row is someone's per-entry finding and must not be flattened
  into a class reason by accident.
- **Reseed, mandatorily.** The unreviewed marks are flush with zero slack
  (1,904 = 1,904). Every reason set lowers a shard's unreviewed count, which
  `unreviewed-ratchet.ts:slackByPath` gates as a STALE high-water mark. The
  gate already exists and already tells the user to run `pnpm parity:api:calls:reseed`
  — so no new guard is needed, but `--set-reason` must reseed the marks itself
  (or refuse to exit 0 without it), because a mode that leaves the gate red by
  construction is not usable.
- **Dry run.** `--set-reason <cat> --dry-run` prints the matched row count per
  shard and the reason text without writing, so a category can be vetted
  against the population before 150 rows move.

Scope note: this story builds the _mechanism_ only. Applying the audit's
bulk reason texts to the activerecord backlog is triage labour and belongs to
the RFC that owns the `parity:api:calls` burndown, not here.

## Acceptance criteria

- `pnpm tsx scripts/api-compare/lint-call-mismatches.ts --set-reason <category>`
  rewrites matching rows' `reason` through `serializeBaseline`; no code path
  writes baseline JSON any other way.
- At least one real category from the audit is defined in the table (the
  mutex/monitor class is the strongest candidate: all 32 Ruby call sites were
  read, every one a Mutex/Monitor, zero exceptions, and the reason text already
  exists in the tree verbatim).
- `--dry-run` reports matched rows per shard and writes nothing.
- Rows carrying a non-default reason are skipped unless `--force`; the run
  reports how many it skipped.
- The mode reseeds the sharded marks, and `pnpm parity:api:calls` is green with zero
  slack immediately after a `--set-reason` run — verified, not assumed.
- Unit tests cover predicate matching, the non-default-reason guard, and the
  serialization round-trip (including an em-dash in a reason text).
- The file's stated hard rules are preserved: no `node:*` imports, no
  `process.*` outside the CLI entry guard, async fs only.

## Audit addendum (auditor, 2026-08-08) — a correction to the audit's own category list

**Do not seed this table with the audit's Hash-idiom category as written.** The
audit proposed `merge` / `except` / `delete` / `merge!` (34 rows) as
"bulk-justifiable immediately". Re-reading `compare.ts:184-188` — "Same reason
`delete` (Map#delete), `merge`, `fetch` — all real JS call forms — stay in" —
and then every one of those Ruby call sites by hand shows the audit classified
them **by call name without checking the receiver**, which is the exact trap the
sibling `positional-idiom-analogues` story is about:

- **`except` (11 rows): 7 are `Relation#except`**, not `Hash#except` —
  `except(:includes, :eager_load, :preload)` (`relation.rb#apply_join_dependency`),
  `except(:group)` (`calculations.rb#execute_grouped_calculation`),
  `except(:order)` (`finder_methods.rb#construct_relation_for_exists`),
  `except(:limit, :offset)` (`#find_some_ordered`),
  `except(:optimizer_hints)` (`query_methods.rb#build_subquery`), plus
  `@values.except(...)` and `scope_for_create.except(...)`. These are real
  spawn_methods calls; a class reason would bless dropping a query modifier.
- **`merge!` (4 rows): 3 are `Relation#merge!`** — `base.rb#all`'s
  `relation.merge!(scope)`, and `association.rb`'s `scope` / `target_scope`.
  Same problem.
- **`merge` (14 rows): all 14 are genuinely `Hash#merge`.** This sub-slice holds.
- **`delete` (5 rows): 4 are Hash/Array/String `delete`**, 1 is
  `@statements.delete` on the StatementPool (`postgresql/database_statements.rb#perform_query`).
  Holds, with the pool row checked individually.

Net: the Hash-idiom category is ~34 defensible rows, not 58, and only after the
Relation-receiver rows are split out. **The mutex category named in the
acceptance criteria is unaffected** — it was verified exhaustively (32/32 Ruby
call sites read, every one a `Mutex`/`Monitor`/`MonitorMixin`), and remains the
right first category to define.

The general lesson for the predicate table: **a call-name-only predicate is
unsafe for any name that also exists on `Relation` / an association proxy.** The
story already scopes the Rails-manifest join as a prerequisite for receiver
regexes — this is the evidence for why that join is not optional polish. A
category whose predicate is call-name-only should carry an explicit note that
its name has no Relation homonym.

## Audit addendum 2 (auditor, 2026-08-08) — the mutex category is ~22 rows, not 32

The acceptance criteria above name the mutex/monitor class as the strongest
first category, on the audit's claim that "all 32 Ruby call sites were read,
every one a Mutex/Monitor, zero exceptions". The Ruby half of that is still
true. **The TS half was never checked, and it splits the class three ways.** The
seeded reason — "trails is single-threaded and has no mutex, so the port has no
analogue call" — conflates _single-threaded_ with _non-interleaving_, which
stops being true the moment a body `await`s.

- **Tier 1 — 18 sync bodies** (`attribute-methods.ts` ×2,
  `model-schema.ts#loadSchema`, `relation/delegation.ts#generateMethod`,
  `queue.ts` ×4, `reaper.ts`, `connection-pool.ts`
  checkin/checkout/disconnect/reap/remove/stat, …). No yield point, so
  run-to-completion supplies what the mutex supplies. Reason holds. Note 4 of
  these converge instead: `queue.ts:358` already defines a faithful pass-through
  `synchronize(_queue, block) { return block(); }` ("Mirrors:
  …ConnectionPool::Queue#synchronize", `queue.rb:80-82`) and nothing calls it.
- **Tier 2 — ~4 async wrappers over a synchronous core**: `flush`,
  `discardBang`, `clearReloadableConnections` (`connection-pool.ts:1145, 1019,
1079`), `discard_pool!` — all shaped `await Promise.all(this._syncCore())`,
  where the state mutation is atomic and the awaits are driver-close drains
  after it. Reason holds, **but not for the stated warrant**; the row should say
  "the mutation is a synchronous core, the awaits are post-hoc drains", which is
  falsifiable and names the invariant a later refactor must not break.
- **Tier 3 — ~10 that await inside the critical section.** Reason is **false**;
  these are unported concurrency guarantees. See the sibling story
  `0084-wide-call-set-burndown/port-async-critical-sections-for-mutex-guarded-lifecycle`.

Consequence for this story: the seeded predicate must be call-name **plus** a
tier discriminator, or it will stamp "no analogue" onto ~10 rows that are real
gaps — the precise failure mode `--dry-run` and the non-default-reason guard
exist to prevent, arriving instead through a category definition nobody
re-derived. Either scope the first category to the Tier 1 mixed-in members
explicitly (by `tsFile` + `rubyName`, ~14 rows, since Tier 1's queue rows
converge), or land the tier split first and key the predicate on it.
