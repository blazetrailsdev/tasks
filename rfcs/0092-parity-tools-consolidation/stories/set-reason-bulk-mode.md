---
title: "Add a --set-reason bulk mode to lint-call-mismatches.ts"
status: draft
updated: 2026-08-08
rfc: "0092-parity-tools-consolidation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The `api:calls` triage audit of 2026-08-08 names this the one piece of tooling
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
  gate already exists and already tells the user to run `pnpm api:calls:reseed`
  — so no new guard is needed, but `--set-reason` must reseed the marks itself
  (or refuse to exit 0 without it), because a mode that leaves the gate red by
  construction is not usable.
- **Dry run.** `--set-reason <cat> --dry-run` prints the matched row count per
  shard and the reason text without writing, so a category can be vetted
  against the population before 150 rows move.

Scope note: this story builds the _mechanism_ only. Applying the audit's
bulk reason texts to the activerecord backlog is triage labour and belongs to
the RFC that owns the `api:calls` burndown, not here.

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
- The mode reseeds the sharded marks, and `pnpm api:calls` is green with zero
  slack immediately after a `--set-reason` run — verified, not assumed.
- Unit tests cover predicate matching, the non-default-reason guard, and the
  serialization round-trip (including an em-dash in a reason text).
- The file's stated hard rules are preserved: no `node:*` imports, no
  `process.*` outside the CLI entry guard, async fs only.
