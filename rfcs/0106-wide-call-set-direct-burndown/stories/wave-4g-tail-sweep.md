---
title: "Wave 4g: the <=3-row tail sweep"
status: ready
updated: 2026-08-21
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: ["activerecord", "activesupport"]
deps:
  [
    "wave-4a-relation-family-residue",
    "wave-4b-adapters-residue",
    "wave-4c-ar-core-residue",
    "wave-4d-associations-residue",
    "wave-4e-schema-migration-tasks-residue",
    "wave-4f-activesupport-residue",
  ]
deps-rfc: []
est-loc: 700
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Wave 4g: the <=3-row tail sweep (227 rows across 137 files)

## Context

Waves 1-3 of this RFC are all `done`, so per the Rollout section Wave 4 is now
due: "the rest of the head and then the <=3-row tail". Re-measured against
`origin/main` on 2026-08-17 over `scripts/api-compare/call-mismatches-exclude/**`
at `kind: "set"`, restricted to `activerecord` / `arel` / `activesupport`:

**900 rows across 213 files** (down from the RFC's 1,134 / 217 baseline of
2026-08-14) — activerecord 739, activesupport 161, arel 0.

### The slice

The mechanical sweep the RFC's Rollout step 4 describes, re-measured on
2026-08-17: **227 rows across 137 files that carry 3 or fewer rows each** — 25%
of the remaining 900. By cluster:

    activerecord core        96
    activesupport            63
    adapters                 39
    associations             22
    relation-family           6
    schema/migration          1

This runs **after** waves 4a-4f, so it inherits their class dispositions instead
of re-deriving them. That sequencing is the entire reason it is filed as a
separate story, and it is encoded as a `deps` edge — the sweep is not
schedulable until the six cluster stories are done.

By the time this story is claimed, the recurring names should already have a
settled disposition from the earlier waves — the re-measured in-scope frequency
head is `first` 41, `new` 38, `empty?` 32, `fetch` 27, `any?` 25, `merge` 19,
`map` 16, `include?` 16. The sweep's job is to **apply** those decisions, not to
make new ones. If a tail row does not fit any settled class, that is a signal to
stop and file it, not to invent a fresh reason string.

The RFC's non-goals bind hardest here: this is not a reason-review campaign, not
a mechanical loosening, and not a licence to ratify. A row exits by convergence
or by a per-site reason reached against the Rails body — never by a name-keyed
bulk edit.

## Acceptance criteria

- [ ] Every one of the 227 tail rows is either converged or leaves as a reviewed
      one-line per-site reason / a `@missingRailsCall` tag at the call site.
- [ ] Rows deleted by hand via `serializeBaseline`, then
      `pnpm parity:api:calls:tighten <shard>` for each shard touched. No
      `--write`, no reseed, ever.
- [ ] **RFC exit condition met**: `scripts/api-compare/call-mismatches-exclude/**`
      reports 0 rows with `kind: "set"` for `activerecord`, `arel` and
      `activesupport`. There is no partial-credit exit.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
- [ ] Measure with `API_COMPARE_FORCE=1 pnpm parity:api --calls` throughout.
- [ ] Split across more than one PR — 137 files will not fit one ceiling.
