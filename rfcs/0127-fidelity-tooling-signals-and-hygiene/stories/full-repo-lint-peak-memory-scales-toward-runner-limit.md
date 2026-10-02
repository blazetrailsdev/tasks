---
title: "Full-repo lint peaks at 8.2 GB in one process; the heap limit has been bumped twice"
status: draft
updated: 2026-10-02
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The full-repo lint (`pnpm lint`, `eslint .`, the `Lint` job's push path and
the `__ALL__` fallback in `.github/workflows/ci.yml`) is a single node process
whose heap grows with the repo. It aborted main with exit 134
(`FATAL ERROR: Ineffective mark-compacts near heap limit`) at b03ec13f,
3382b9d6 and a011ce4, each time pausing the spawn loop.

PRs 8377 and 8379 raised `--max-old-space-size` from 6144 to 10240 MB in
`package.json` (`lint`, `lint:files`). That is a ceiling bump, not a fix: the
limit was 4.5 GB by default, then 6144 MB (PR 5700, 2026-07-31), now 10240 MB.

Measured on a clean checkout of 3382b9d6 (story red-3382b9d6):

- 6144 MB limit: OOM, exit 134, peak RSS 6.7 GB, 7:56 wall.
- 12288 MB limit: exit 0, peak RSS 8.2 GB, 7:40 wall.
- 10240 MB limit: exit 0, peak RSS 8.2 GB, 7:58 wall.

The hosted `ubuntu-latest` runner has 16 GB, so there is roughly one more
bump of headroom before the runner itself OOM-kills the process. The likely
dominant cost is the repo-wide typed-lint block in `eslint.config.mjs`
(`files: ["**/*.ts"]` with `parserOptions.projectService`, feeding
`@typescript-eslint/no-unnecessary-type-assertion`), which keeps every
package's program alive in one process. That attribution is unmeasured.

Nothing warns before the limit is hit: the job is green until the commit that
crosses it, and that commit is an arbitrary unrelated PR.

## Acceptance criteria

- Attribute the peak: measure the full lint's peak RSS with the typed-lint
  block disabled, so the fix targets the real consumer.
- Bring the full lint's peak RSS down so it no longer scales toward the
  runner's 16 GB in one process — e.g. ESLint's `--concurrency`, or running
  the lint per package, whichever the measurement supports. Record before and
  after peak RSS and wall time in the PR body.
- No rule is dropped and no file leaves lint scope to get there.
- The `Lint` job reports its peak RSS (e.g. `/usr/bin/time -v`) so drift
  toward the limit is visible in the job log before it reds main.
- Update the heap-limit comment above `defineConfig` in `eslint.config.mjs`
  to match whatever limit remains.
