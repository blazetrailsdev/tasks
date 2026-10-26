---
title: "Gate naming-shape debt against the merge-base, with no mark file"
status: draft
updated: 2026-10-26
rfc: "0000-predicate-and-underscore-naming"
cluster: naming-shape-gate
packages: ["scripts"]
deps: ["naming-shape-labels-in-extract-ts-api"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

This follows the `parity:api:sends` contract (trails#9129): the base tree is the mark. Take the changed src `.ts` files under enrolled packages from `git diff -M --name-status $(git merge-base origin/main HEAD) HEAD`, label HEAD and base (`git show`), and fail if any debt dimension rises in any file. Where a split or merge cannot be paired, fall back to a per-package sum. There is no mark file, no tighten step and no reseed, so parallel burndown PRs share no file.

## Acceptance criteria

- [ ] `scripts/api-compare/lint-naming-shape.ts` plus `pnpm parity:api:naming-shape`, wired into the `rails-comparison` CI job.
- [ ] `ENROLLED = ["activerecord"]`, only-grow.
- [ ] `--list [pkg] [dimension]` prints rows with Ruby `file:line` and a remedy, and writes gitignored `output/naming-shape.json`.
- [ ] A fixture adding one invented public `_foo` reds the gate, and a pure rename of a debt-carrying file does not.
