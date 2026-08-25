---
title: "Wave 4f: the activesupport residue"
status: done
updated: 2026-08-19
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: ["activesupport"]
deps: []
deps-rfc: []
est-loc: 700
pr: 6731
claim: "2026-08-18T23:41:17Z"
assignee: "wave-4f-activesupport-residue"
blocked-by: null
closed-reason: null
---

# Wave 4f: the activesupport residue (161 rows)

## Context

Waves 1-3 of this RFC are all `done`, so per the Rollout section Wave 4 is now
due: "the rest of the head and then the <=3-row tail". Re-measured against
`origin/main` on 2026-08-17 over `scripts/api-compare/call-mismatches-exclude/**`
at `kind: "set"`, restricted to `activerecord` / `arel` / `activesupport`:

**900 rows across 213 files** (down from the RFC's 1,134 / 217 baseline of
2026-08-14) — activerecord 739, activesupport 161, arel 0.

Wave 4 is filed as one story per file cluster so the slices stay
non-overlapping and standalone from `main`, the way waves 1-3 were. This one is
the whole `activesupport` share, which waves 1-3 never touched.

### The slice

161 rows across 53 activesupport shards — 63 of them in <=3-row files, so this
cluster is roughly 60% head / 40% tail:

    module-ext.json            13
    time-ext.json              13
    time-with-zone.json        12
    cache/file-store.json      11
    duration.json               8
    cache.json                  7
    callbacks.json              7
    hash-utils.json             7
    encrypted-file.json         6
    enumerable-utils.json       6
    core-ext/file/atomic.json    4
    values/time-zone.json        4
    + 41 shards with 1-3 rows each

Two cautions specific to this package:

- The time cluster (`time-ext`, `time-with-zone`, `values/time-zone`,
  `duration`, `core-ext/date-and-time/zones`) is 30+ rows sharing one
  vocabulary; do it as a single slice so the dispositions stay consistent.
  Note `time-ext.ts` rows were the subject of a false-positive episode —
  `time-ext-to-fs-omits-strftime-calls` was filed and then closed as a phantom
  produced by a partially-regenerated artifact. **Measure with
  `API_COMPARE_FORCE=1 pnpm parity:api --calls` before believing any row here**;
  see the ready story `call-mismatches-partial-regen-invents-phantom-rows`.
- `module-ext.ts` and `callbacks.ts` rows are dominated by `define_method` /
  `set_callback` metaprogramming (9 and 8 in-scope occurrences of those two
  names respectively), where the TS port necessarily uses a different
  mechanism. These are the most likely reviewed-reason exits in the whole RFC —
  but the reason must be written per site against the Rails body, not
  class-wide.

The class rules from the RFC apply unchanged: **a class-wide action requires a
receiver split** — join to the Ruby call site via `output/rails-api.json` and
split by receiver before writing a shared reason or a bulk conversion.

## Acceptance criteria

- [ ] Every row in the listed shards is either converged (the TS body makes the
      call Rails makes, verified against the Rails source line) or leaves as a
      reviewed one-line per-site reason / a `@missingRailsCall` tag at the call
      site. No widened allowlist, no new row.
- [ ] Rows deleted by hand via `serializeBaseline`, then
      `pnpm parity:api:calls:tighten <shard>` for each shard touched. No
      `--write`, no reseed, ever.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
- [ ] All three adapter lanes green (activesupport is adapter-independent, but
      the gate is shared).
- [ ] Split across more than one PR if the LOC ceiling demands it — ship the
      first slice and file the rest rather than exceeding the ceiling.
