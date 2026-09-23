---
title: "The cache-build action cannot hit on a source-changing PR — 647s of redundant compile per run"
status: draft
updated: 2026-09-23
rfc: "0157-ci-cost-round-2"
cluster: caching-install
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`cache-build-dist-across-jobs` (trails#3392, done 2026-06-15) added
`.github/actions/cache-build` so jobs would stop recompiling the workspace. It
**cannot hit on any PR that changes source**, which is the case it was built
for.

The key is an exact content hash with no `restore-keys`:

```text
build-v1-${{ runner.os }}-${{ hashFiles('packages/**/src/**', 'tsconfig*.json', 'packages/*/tsconfig.json', 'pnpm-lock.yaml') }}
```

Any edit under `packages/**/src/**` changes the key, so the restore misses and
every job recompiles from scratch. Confirmed in the `Unit Tests` job log of
green `main` run 35872727737 (2026-09-23):

```text
Run ./.github/actions/cache-build
  Cache not found for input keys: build-v1-Linux-f60646f8354e14411457ead555420b97396773e72f9cb422491006f85417f82b
```

The cache therefore only helps re-runs of an **unchanged** commit, plus whatever
sibling jobs start after the first one finishes saving. On a normal
source-changing PR its contribution is zero, minus ~3s of restore overhead per
job.

### What it costs

Same run, `Run pnpm build` step across all jobs:

| job                                 | `pnpm build` |
| ----------------------------------- | ------------ |
| Active Record SQLite :memory: Tests | 64s          |
| Active Record PostgreSQL Tests (1)  | 64s          |
| Active Record MariaDB Tests (2)     | 64s          |
| Rails API/Test Comparison           | 63s          |
| Active Record SQLite Tests (1)      | 63s          |
| Active Record SQLite Tests (2)      | 62s          |
| Active Record MariaDB Tests (1)     | 61s          |
| Build & Type Check                  | 59s          |
| Active Record PostgreSQL Tests (2)  | 57s          |
| Guides Code Type Check              | 48s          |
| Unit Tests                          | 42s          |
| **total**                           | **647s**     |

**10.8 minutes of runner time per run**, and ~60s of it sits on the critical
path of every long-pole AR lane before the suite starts.

### The obvious fix is wrong

Adding `restore-keys` so a near-miss restores a warm-but-stale tree is unsafe
here, and the existing action's comment already says exact-match is deliberate.
The concrete hazard: `tsc --build` treats a restored `.tsbuildinfo` as
authoritative and **skips projects it considers up to date**, so a changed
exported signature in one package can leave a consumer package uncompiled and
its breakage invisible. This is a known, bitten failure mode in this repo — it
is why `tsc --build --force` is the prescribed local check after a cross-package
signature change. A stale-buildinfo restore would put exactly that blind spot
into CI, which is the one place it must not exist.

So this story is **not** "improve the cache". The cache is doing the only safe
thing available to it.

### The two real remedies

1. **Make the compile ~10× cheaper — RFC `0125-typescript-7-ground-floor`.**
   Measured on this repo: cold full `tsc --build` 91.75s (5.9.3) → 8.47s
   (7.1-dev), **10.8×**. That turns 647s into roughly 60s across the same eleven
   jobs with the cache's safety property untouched, and needs no CI change at
   all. `flip-build-to-ts7` is the terminal story there and now carries this
   measurement; it is blocked on three API ports and on 7.1 stable
   (**2026-11-24**, slipped from 2026-11-10).

2. **Build once, distribute the artifact** — the fallback the original story's
   Notes already anticipated ("fall back to the `actions/upload-artifact` →
   `download-artifact` pattern"). One job runs an authoritative
   `tsc --build --force` and uploads `packages/*/dist`; consumers download it.
   This is safe where `restore-keys` is not, because there is exactly one full
   build per run rather than a stale one per job. The cost is the `needs:` edge
   the original story explicitly refused — it serializes ~90s before the AR
   fan-out, trading ~9 min of runner time for roughly +40s of wall clock.

Remedy 1 strictly dominates if TS 7 lands; remedy 2 is the hedge if it slips
past the point where the runner-time cost matters.

## Acceptance criteria

This story is **findings + decision**, not an implementation. It closes when:

- [ ] The measurement above is confirmed on at least one further run (it is a
      single-run observation today) and recorded.
- [ ] A decision is recorded between remedy 1 (wait for TS 7) and remedy 2
      (artifact hand-off), with the deciding factor named — most likely the
      expected landing date of `flip-build-to-ts7` against 7.1 stable.
- [ ] If remedy 2 is chosen, it is filed as its own implementation story with
      the measured wall-clock/runner-time trade stated, and subject to RFC
      0028's measurement protocol (merge only on a measured win).
- [ ] If remedy 1 is chosen, this story closes pointing at `flip-build-to-ts7`,
      and `cache-build`'s action comment gains a line saying the miss is
      expected and structural, so the next reader does not "fix" it with
      `restore-keys`.

## Non-goals

- Adding `restore-keys` to `cache-build`, for the reason above.
- Removing `cache-build`. It still earns its place on re-runs of an unchanged
  commit (CI re-run after a flake, a `workflow_dispatch` on the same SHA) and
  costs ~3s when it misses.
