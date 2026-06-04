---
rfc: "draft-docs-cutover"
title: "Full cutover — retire trails/docs, make tasks the only source of truth"
status: draft
created: 2026-06-04
updated: 2026-06-04
owner: "@dmarano"
packages: []
clusters:
  - reconcile
  - migrate
  - decommission
  - guardrails
---

<!-- Unnumbered until merge: keep `rfc:` as draft-docs-cutover and the H1 below
     number-free. `scripts/finalize-rfc.mjs` assigns the number at merge. -->

# RFC — Full cutover: retire `trails/docs`, make `tasks` the only source of truth

## Summary

The `tasks` repo was created (late May 2026) to be the single source of truth
for work tracking, but the migration off `trails/docs/` only ever happened for
three AR gap docs (→ RFC 0005). The big driver docs never moved, and the
stories that _did_ move were never reconciled against what shipped. Today there
are **two competing sources of truth**: ~38 live plan/tracker docs in
`trails/docs/` (still authored, still authoritative for ordering) and ~65 RFC
stories here (status mostly stale). This RFC plans the full cutover — reconcile
the existing RFCs against reality, migrate every actionable doc into RFCs/
stories, **delete** the docs, and add guardrails so work can only ever flow
from one place again.

## Motivation

**Two sources of truth, drifting apart.**

_Tasks side (stale):_ across RFCs 0001–0010 the story status breakdown is **4
done / 39 ready / 15 draft / 11 blocked**. Yet a large fraction of the "ready"
and "blocked" items have already shipped in trails — e.g. ConnectionHandler
(Story 4.1), nested-through associations, association callbacks, query-logs
parity, and most adapter buckets (M-1..M-4, P-1/P-3/P-6/P-9) are all merged on
`main`. The ready queue is full of phantom work; `tasks ready` can't be trusted.

_Trails side (authoritative, but should not be):_ `trails/docs/` still holds
~38 plan/tracker docs. `workplan.md` was reconciled **2026-06-02**;
`test-compare-100-attack-plan.md` openly declares itself "authoritative for what
order to do things in." New work keeps getting authored against these docs, so
every edit there widens the gap with the RFCs that were supposed to replace
them.

**Why it festers:** the first-batch migration was partial. Only
`associations-gap-plan.md` / `connection-pool-gap-plan.md` /
`relation-gap-plan.md` were lifted (into RFC 0005); the high-traffic drivers
(`workplan.md`, the attack plan, the `*-100-plan.md` trackers) stayed put, and
nobody closed the loop on the stories that moved. Until the docs are physically
gone and a guardrail forbids re-adding them, the two-SoT split self-heals back
into existence.

## Design

**Principle:** after cutover, `trails/docs/` contains **no work-tracking
content**. Every actionable item lives as a story under an RFC here; ordering,
deferred items, and permanent-skips live in RFC prose (the RFC 0005 §Deferred
pattern). The `pnpm tasks` CLI + this repo's indices are the only queue. The
docs are deleted outright — no stub pointers (a stub is just a smaller second
source of truth) — with **two explicit carve-outs that are kept in place**:
`parity-verification.md` (reference/how-to, not a tracker) and
`launch-roadmap.md` (cross-cutting roadmap). Both are allowlisted by the
Phase-4 guardrail; everything else in `docs/` goes.

Four phases, each its own cluster.

### Phase 1 — Reconcile the existing 10 RFCs (`reconcile`)

Before importing anything new, make the current RFCs trustworthy.

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

### Phase 2 — Migrate the authoritative docs (`migrate`)

One new RFC per doc cluster (authored `draft-*` → PR → numbered at merge, the
normal flow). Actionable items become stories; design/ordering/deferred prose
stays in the RFC body. Priority order: P0/P1 first.

**Full disposition of `trails/docs/`** (every file gets an action):

| Doc                                                      | Action                       | Target RFC / story                                                                            |
| -------------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------- |
| `activerecord/workplan.md`                               | migrate (spec source)        | feeds AR test-compare RFC stories                                                             |
| `activerecord/test-compare-100-attack-plan.md`           | migrate (ordering+inventory) | **new:** AR test-compare-100                                                                  |
| `activerecord/activerecord-100-plan.md`                  | migrate                      | **new:** AR test-compare-100                                                                  |
| `activerecord/activerecord-index.md`                     | migrate (sequencing)         | folds into AR test-compare-100 rollout                                                        |
| `activerecord/activerecord-gaps.md`                      | reconcile + delete           | already in **RFC 0005**                                                                       |
| `activerecord/activerecord-type-audit.md`                | reconcile + delete           | already in **RFC 0009**                                                                       |
| `activerecord/adapter-architecture-cleanup.md`           | reconcile + delete           | **RFC 0010** + **RFC 0007**                                                                   |
| `activerecord/adapter-test-ci-coverage-plan.md`          | migrate                      | **new:** adapter-CI lanes                                                                     |
| `activerecord/ci-gates-plan.md`                          | migrate                      | **new:** adapter-CI lanes (or infra)                                                          |
| `activerecord/defineschema-to-fixtures-migration.md`     | migrate                      | **new:** fixtures-migration                                                                   |
| `activerecord/fixtures-adoption-inventory.md`            | migrate                      | **new:** fixtures-migration                                                                   |
| `activerecord/fixtures-migration-backlog.md`             | migrate                      | **new:** fixtures-migration                                                                   |
| `activerecord/trails-models-dump-schema-ts-migration.md` | migrate                      | **new:** schema.ts migration                                                                  |
| `activerecord/trails-tsc-schema-ts-migration.md`         | migrate                      | **new:** schema.ts migration                                                                  |
| `activerecord/parity-verification.md`                    | **leave** (reference)        | stays in `trails/docs` — allowlisted (decided)                                                |
| `actionpack-100-percent.md`                              | migrate                      | **new:** actionpack-parity                                                                    |
| `actionview-100-percent.md`                              | migrate                      | **new:** actionview-parity                                                                    |
| `rack-100-percent.md`                                    | migrate                      | **new:** rack-parity                                                                          |
| `activesupport.md`                                       | migrate                      | **new:** activesupport-scope                                                                  |
| `html-sanitizer-plan.md`                                 | migrate                      | **new:** html-sanitizer                                                                       |
| `system-testing-plan.md`                                 | migrate                      | **new:** system-testing                                                                       |
| `launch-roadmap.md`                                      | **leave** (roadmap)          | stays in `trails/docs` — allowlisted (decided)                                                |
| `index.md`                                               | delete                       | replaced by this repo's `index.md`                                                            |
| `trailties/*.md` (4)                                     | migrate                      | **new:** trailties (plan/template-builder/thor/tse)                                           |
| `infrastructure/*.md` (5)                                | migrate                      | **new:** infra (browser-compat, lint-deps, file-mirror, runner-restart, virtual-source-files) |
| `frontiers/*.md` (6)                                     | migrate                      | **new:** frontiers workstreams                                                                |

Each migration story is "author RFC X from doc(s) Y, converting actionable
items to dep-aware stories; record deferred/permanent-skip in §Deferred." A
doc is **not** deleted in Phase 3 until its target RFC is merged and reconciled.

### Phase 3 — Decommission `trails/docs` (`decommission`)

1. `decommission-docs` — delete each migrated doc + `docs/index.md`
   (deps: the doc's migration story). No stubs. `parity-verification.md` and
   `launch-roadmap.md` are retained.
2. `repoint-references` — no automated consumer reads `docs/` (decided: the
   spawn-loop and skills do not read `docs/` paths), so this is limited to
   **prose links** — `README.md` and the `CLAUDE.md` "Measuring progress"
   section — repointed at the tasks index / `pnpm tasks`.

### Phase 4 — Guardrails (`guardrails`)

`drift-prevention-ci` — a CI check in trails that **fails on any new or edited
work-tracking file under `docs/`**, with a two-entry allowlist:
`docs/activerecord/parity-verification.md` and `docs/launch-roadmap.md`. Plus a
`CLAUDE.md` working-principles edit: "all work tracking lives in the `tasks`
repo; pick work via `pnpm tasks`, never by hand-editing a plan doc." Without
this, the two-SoT split returns.

## Alternatives considered

- **Stub pointers instead of deletion.** Rejected per decision — a stub is a
  smaller second source of truth and invites re-expansion. Delete outright.
- **Migrate docs first, reconcile later.** Rejected — importing un-reconciled
  docs would multiply the phantom-work problem across new RFCs. Reconcile the
  existing 10 first so the importer has a clean baseline and a working
  done-detection script to reuse.
- **One mega-RFC for all remaining docs.** Rejected — violates the per-cluster
  RFC model and would be unreviewable. One RFC per doc cluster, P0/P1 first.
- **Pure manual audit of all 65 stories.** Rejected per decision — automated
  reconcile first (PR-log + compare deltas + memory seed), manual only for the
  `unknown` residue.

## Rollout

1. **Phase 1 — reconcile:** `reconcile-tooling` → `reconcile-existing-rfcs`.
2. **Phase 2 — migrate** (parallel, P0/P1 first): `migrate-ar-test-compare`,
   `migrate-ar-followups`, `migrate-adapter-ci`, `migrate-fixtures`,
   `migrate-schema-ts`, `migrate-actionpack`, `migrate-actionview`,
   `migrate-rack`, `migrate-activesupport`, `migrate-html-sanitizer`,
   `migrate-system-testing`, `migrate-trailties`, `migrate-infra`,
   `migrate-frontiers`.
3. **Phase 3 — decommission:** `decommission-docs` (deps: all `migrate-*`) →
   `repoint-references`.
4. **Phase 4 — guardrails:** `drift-prevention-ci`.

Stories are enumerated in §Stories but **not yet scaffolded** — they get
materialized at execution kickoff (this RFC is the plan doc; scaffolding the
18 story files is the first execution step, gated on accepting the plan).

## Open questions

1. ~~**`parity-verification.md`.**~~ **Decided: leave in place** (reference/
   how-to, allowlisted by the Phase-4 guardrail; not migrated, not deleted).
2. ~~**`launch-roadmap.md` home.**~~ **Decided: leave in place** (cross-cutting
   roadmap, allowlisted; not migrated, not deleted).
3. **In-flight RFC 0011.** A config-fidelity RFC is already on a PR branch. No
   doc in the disposition table is config-fidelity, so no content overlap;
   still confirm the number isn't double-claimed at `finalize-rfc` time.
4. ~~**Spawn-loop coupling.**~~ **Decided: nothing reads `docs/`** — the
   spawn-loop (`tasks/tooling/tasks-loop`) and skills do not consume `docs/`
   paths, so `repoint-references` only touches prose links, not code.

## Stories

| ID                      | Title                                                   | Status | Est LOC | Cluster      |
| ----------------------- | ------------------------------------------------------- | ------ | ------- | ------------ |
| reconcile-tooling       | Build story↔shipped-PR reconcile report                 | draft  | 200     | reconcile    |
| reconcile-existing-rfcs | Reconcile + close RFCs 0001–0010                        | draft  | 150     | reconcile    |
| migrate-ar-test-compare | RFC from workplan + attack-plan + 100-plan + index      | draft  | 300     | migrate      |
| migrate-ar-followups    | Reconcile + delete gaps/type-audit/adapter-cleanup docs | draft  | 120     | migrate      |
| migrate-adapter-ci      | RFC from adapter-test-ci + ci-gates                     | draft  | 150     | migrate      |
| migrate-fixtures        | RFC from 3 fixtures docs                                | draft  | 200     | migrate      |
| migrate-schema-ts       | RFC from 2 schema.ts migration docs                     | draft  | 150     | migrate      |
| migrate-actionpack      | RFC from actionpack-100-percent                         | draft  | 200     | migrate      |
| migrate-actionview      | RFC from actionview-100-percent                         | draft  | 250     | migrate      |
| migrate-rack            | RFC from rack-100-percent                               | draft  | 150     | migrate      |
| migrate-activesupport   | RFC from activesupport scope doc                        | draft  | 80      | migrate      |
| migrate-html-sanitizer  | RFC from html-sanitizer-plan                            | draft  | 100     | migrate      |
| migrate-system-testing  | RFC from system-testing-plan                            | draft  | 80      | migrate      |
| migrate-trailties       | RFC from 4 trailties docs                               | draft  | 250     | migrate      |
| migrate-infra           | RFC from 5 infrastructure docs                          | draft  | 200     | migrate      |
| migrate-frontiers       | RFC from 6 frontiers docs                               | draft  | 200     | migrate      |
| decommission-docs       | Delete migrated docs + docs/index.md                    | draft  | 50      | decommission |
| repoint-references      | Repoint trails README/CLAUDE/skills/loop                | draft  | 80      | decommission |
| drift-prevention-ci     | CI gate: no new docs/ trackers + CLAUDE principle       | draft  | 120     | guardrails   |

## Changelog

- 2026-06-04: initial RFC — plan the full cutover and `trails/docs` retirement.
- 2026-06-04: resolved open questions — keep `parity-verification.md` and
  `launch-roadmap.md` in place (allowlisted); no automated consumer reads
  `docs/`; dropped `migrate-launch-roadmap` (19 → 18 stories).
