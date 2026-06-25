---
rfc: "0011-activerecord-docs-cutover"
title: "ActiveRecord docs cutover — retire docs/activerecord, tasks as sole source of truth"
status: closed
created: 2026-06-04
updated: 2026-06-20
owner: "@deanmarano"
packages:
  - activerecord
clusters:
  - reconcile
  - migrate
  - decommission
  - guardrails
---

<!-- Unnumbered until merge: keep `rfc:` as 0011-activerecord-docs-cutover and
     the H1 below number-free. `scripts/finalize-rfc.mjs` assigns the number at
     merge. -->

# RFC 0011 — ActiveRecord docs cutover: retire `docs/activerecord`, make `tasks` the sole source of truth

## Summary

The `tasks` repo was created (late May 2026) to be the single source of truth
for work tracking, but the migration off `trails/docs/` only ever happened for
three AR gap docs (→ RFC 0005). The big driver docs never moved, and the
stories that _did_ move were never reconciled against what shipped. This RFC
scopes the cutover to **ActiveRecord only**: reconcile the existing (AR-focused)
RFCs against reality, migrate every actionable `docs/activerecord/*` doc into
RFCs/stories, **delete** those docs, and add a guardrail so AR work can only
flow from one place again. Non-AR docs (actionpack, actionview, rack, trailties,
infra, frontiers, …) are **explicitly out of scope** — a later cutover handles
them.

## Motivation

**Two sources of truth, drifting apart.**

_Tasks side (stale):_ across RFCs 0001–0010 the story status breakdown is **4
done / 39 ready / 15 draft / 11 blocked**. Yet a large fraction of the "ready"
and "blocked" items have already shipped in trails — e.g. ConnectionHandler
(Story 4.1), nested-through associations, association callbacks, query-logs
parity, and most adapter buckets (M-1..M-4, P-1/P-3/P-6/P-9) are all merged on
`main`. The ready queue is full of phantom work; `tasks ready` can't be trusted.

_Trails side (authoritative, but should not be):_ `docs/activerecord/` still
holds the high-traffic AR drivers. `workplan.md` was reconciled **2026-06-02**;
`test-compare-100-attack-plan.md` openly declares itself "authoritative for what
order to do things in." New AR work keeps getting authored against these docs,
so every edit widens the gap with the RFCs that were supposed to replace them.

**Why it festers:** the first-batch migration was partial. Only
`associations-gap-plan.md` / `connection-pool-gap-plan.md` /
`relation-gap-plan.md` were lifted (into RFC 0005); the high-traffic drivers
(`workplan.md`, the attack plan, the `*-100-plan.md` trackers) stayed put, and
nobody closed the loop on the stories that moved. Until the docs are physically
gone and a guardrail forbids re-adding them, the two-SoT split self-heals back
into existence.

**Why AR-only:** ActiveRecord is where the drift is worst (most docs, most
stale stories, the live `workplan`/attack-plan loop). Scoping the cutover to AR
keeps it shippable and reviewable; the same playbook generalizes to the other
packages once it's proven here.

## Design

**Principle:** after this cutover, `docs/activerecord/` contains **no
work-tracking content**. Every actionable AR item lives as a story under an RFC
here; ordering, deferred items, and permanent-skips live in RFC prose (the RFC
0005 §Deferred pattern). The `pnpm tasks` CLI + this repo's indices are the only
queue. The AR docs are deleted outright — no stub pointers (a stub is just a
smaller second source of truth) — with **one carve-out kept in place**:
`docs/activerecord/parity-verification.md` (reference/how-to, not a tracker),
allowlisted by the Phase-4 guardrail.

**Out of scope (deferred to a later cutover):** every doc outside
`docs/activerecord/` — `actionpack-100-percent.md`, `actionview-100-percent.md`,
`rack-100-percent.md`, `activesupport.md`, `html-sanitizer-plan.md`,
`system-testing-plan.md`, `launch-roadmap.md`, `docs/index.md`, and the
`trailties/`, `infrastructure/`, `frontiers/` trees. These stay live and
untouched; the Phase-4 guardrail does **not** police them.

Four phases, each its own cluster.

### Phase 1 — Reconcile the existing RFCs (`reconcile`)

Before importing anything new, make the current (AR-focused) RFCs trustworthy.

1. **Build reconcile tooling** (`reconcile-tooling`). A script that, for every
   story, gathers shipped-signals and emits a triage report
   (`likely-done` / `likely-open` / `unknown`):
   - `pr:` frontmatter already set → confirm the PR is merged.
   - Match story id / title / source anchors against the **trails merged-PR
     log** (`gh pr list --state merged` + `git log` keyword/anchor search).
   - `test:compare` / `api:compare` current deltas vs the story's acceptance
     criteria (a closed gap ⇒ likely done).
   - Seed the obvious AR cases from the persistent memory index, which already
     records shipped PRs per feature.
2. **Run + apply** (`reconcile-existing-rfcs`). Auto-flip `likely-done` stories
   to `done` (with their PR), spot-check manually, re-verify every `blocked`
   story's blocker still exists, and set RFC status to `closed` where all
   stories are done. Expectation: several of 0001–0010 close outright.

Validation order (per decision): **automated reconcile first, then manual** for
the residue the script marks `unknown`.

### Phase 2 — Migrate the `docs/activerecord` drivers (`migrate`)

One new RFC per doc cluster (authored `draft-*` → PR → numbered at merge, the
normal flow). Actionable items become stories; design/ordering/deferred prose
stays in the RFC body.

**Full disposition of `docs/activerecord/`** (every file gets an action):

| Doc                                         | Action                       | Target RFC / story                     |
| ------------------------------------------- | ---------------------------- | -------------------------------------- |
| `workplan.md`                               | migrate (spec source)        | feeds AR test-compare RFC stories      |
| `test-compare-100-attack-plan.md`           | migrate (ordering+inventory) | **new:** AR test-compare-100           |
| `activerecord-100-plan.md`                  | migrate                      | **new:** AR test-compare-100           |
| `activerecord-index.md`                     | migrate (sequencing)         | folds into AR test-compare-100 rollout |
| `activerecord-gaps.md`                      | reconcile + delete           | already in **RFC 0005**                |
| `activerecord-type-audit.md`                | reconcile + delete           | already in **RFC 0009**                |
| `adapter-architecture-cleanup.md`           | reconcile + delete           | **RFC 0010** + **RFC 0007**            |
| `adapter-test-ci-coverage-plan.md`          | migrate                      | **new:** adapter-CI lanes              |
| `ci-gates-plan.md`                          | migrate                      | **new:** adapter-CI lanes              |
| `defineschema-to-fixtures-migration.md`     | migrate                      | **new:** fixtures-migration            |
| `fixtures-adoption-inventory.md`            | migrate                      | **new:** fixtures-migration            |
| `fixtures-migration-backlog.md`             | migrate                      | **new:** fixtures-migration            |
| `trails-models-dump-schema-ts-migration.md` | migrate                      | **new:** schema.ts migration           |
| `trails-tsc-schema-ts-migration.md`         | migrate                      | **new:** schema.ts migration           |
| `parity-verification.md`                    | **leave** (reference)        | stays in place — allowlisted (decided) |

Each migration story is "author RFC X from doc(s) Y, converting actionable
items to dep-aware stories; record deferred/permanent-skip in §Deferred." A
doc is **not** deleted in Phase 3 until its target RFC is merged and reconciled.

### Phase 3 — Decommission `docs/activerecord` (`decommission`)

1. `decommission-docs` — delete each migrated AR doc (deps: the doc's migration
   story). No stubs. `parity-verification.md` is retained. `docs/index.md` still
   indexes non-AR docs, so it is **not** deleted — only its AR rows are removed.
2. `repoint-references` — no automated consumer reads `docs/` (decided: the
   spawn-loop and skills do not read `docs/` paths), so this is limited to
   **prose links** — the `README.md` and `CLAUDE.md` pointers at AR plan docs —
   repointed at the tasks index / `pnpm tasks`.

### Phase 4 — Guardrails (`guardrails`)

`drift-prevention-ci` — a CI check in trails that **fails on any new or edited
work-tracking file under `docs/activerecord/`**, with a one-entry allowlist:
`docs/activerecord/parity-verification.md`. (Non-AR docs are untouched and
unpoliced — they remain live until their own cutover.) Plus a `CLAUDE.md`
working-principles edit: "AR work tracking lives in the `tasks` repo; pick work
via `pnpm tasks`, never by hand-editing an `activerecord` plan doc." Without
this, the two-SoT split returns.

## Alternatives considered

- **Cut over all packages at once.** Rejected — too large to review, and AR is
  where the drift is concentrated. Prove the playbook on AR, then repeat.
- **Stub pointers instead of deletion.** Rejected per decision — a stub is a
  smaller second source of truth and invites re-expansion. Delete outright.
- **Migrate docs first, reconcile later.** Rejected — importing un-reconciled
  docs would multiply the phantom-work problem across new RFCs. Reconcile the
  existing 10 first so the importer has a clean baseline and a working
  done-detection script to reuse.
- **One mega-RFC for all AR docs.** Rejected — violates the per-cluster RFC
  model and would be unreviewable. One RFC per doc cluster.
- **Pure manual audit of all 65 stories.** Rejected per decision — automated
  reconcile first (PR-log + compare deltas + memory seed), manual only for the
  `unknown` residue.

## Rollout

1. **Phase 1 — reconcile:** `reconcile-tooling` → `reconcile-existing-rfcs`.
2. **Phase 2 — migrate** (parallel): `migrate-ar-test-compare`,
   `migrate-ar-followups`, `migrate-adapter-ci`, `migrate-fixtures`,
   `migrate-schema-ts`.
3. **Phase 3 — decommission:** `decommission-docs` (deps: all `migrate-*`) →
   `repoint-references`.
4. **Phase 4 — guardrails:** `drift-prevention-ci`.

Stories are enumerated in §Stories but **not yet scaffolded** — they get
materialized at execution kickoff (this RFC is the plan doc; scaffolding the
10 story files is the first execution step, gated on accepting the plan).

## Open questions

1. ~~**`parity-verification.md`.**~~ **Decided: leave in place** (reference/
   how-to, allowlisted by the Phase-4 guardrail; not migrated, not deleted).
2. ~~**In-flight RFC 0011.**~~ **No conflict.** "RFC 0011" never merged — it was
   direct-committed then reverted to re-enter via the placeholder flow (commit
   `54c3079`), and now lives unnumbered on PR #1 (`rfc-isolation-helper`, AR
   test-harness/config-fidelity). So no number is pre-claimed: the two open
   draft-RFC PRs (#1, this one) each get numbered at `finalize-rfc` in merge
   order. No content overlap — the isolation helper isn't in the disposition
   table.
3. ~~**Spawn-loop coupling.**~~ **Decided: nothing reads `docs/`** — the
   spawn-loop (`tasks/tooling/tasks-loop`) and skills do not consume `docs/`
   paths, so `repoint-references` only touches prose links, not code.

## Changelog

- 2026-06-04: initial RFC — plan the full cutover and `trails/docs` retirement.
- 2026-06-04: resolved open questions — keep `parity-verification.md` in place
  (allowlisted); no automated consumer reads `docs/`.
- 2026-06-04: **cut scope to ActiveRecord only** — disposition limited to
  `docs/activerecord/*`; dropped the actionpack/actionview/rack/activesupport/
  html-sanitizer/system-testing/trailties/infra/frontiers/launch-roadmap
  migrations (deferred to a later cutover); guardrail now polices only
  `docs/activerecord/`; renamed slug to `0011-activerecord-docs-cutover`
  (10 stories).
