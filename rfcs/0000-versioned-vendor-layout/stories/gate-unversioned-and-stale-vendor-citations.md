---
title: "Gate unversioned and stale vendor citations"
status: ready
updated: 2026-09-25
rfc: "0000-versioned-vendor-layout"
cluster: vendor
packages:
  - activerecord
deps:
  - recite-ruby-compat-citations-a-f-against-mri-v3-3-11
  - recite-ruby-compat-citations-g-m-against-mri-v3-3-11
  - recite-ruby-compat-citations-n-z-against-mri-v3-3-11
  - recite-rails-and-gem-citations-outside-ruby-compat
  - version-the-mri-citation-lint-and-its-resolver
deps-rfc: []
est-loc: 140
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Once both sweeps have landed, nothing stops the next port from writing
`vendor/rails/activerecord/lib/...` again, and nothing makes the sweep mandatory
at the next ref bump. `pnpm vendor:recite --check` already answers both questions;
this wires it into CI as a `scripts/` test in the shape the repo's other
mechanical guards use (`scripts/non-transactional-row-writes.test.ts`,
`scripts/rails-file-structure-collisions.test.ts`).

It sits **beside** `eslint/ruby-compat-needs-mri-citation.mjs` rather than
replacing it (RFC Open question 4): that rule resolves an MRI citation to a real
file and an in-range line, which needs a fetched tree and so runs only in the
`rails-comparison` job; this gate checks the version segment for all eleven
sources from the lockfile alone. Neither subsumes the other, and the overlap on
ruby-compat's version segment is intentional redundancy, not duplication to
remove.

Per RFC Open question 2 the stale arm is red, not report-only: that is what turns
a ref bump into a finite worklist. Note that the Unit Tests CI job has no
`vendor/` checkout, so the gate must read the lockfile, never the tree.

## Acceptance criteria

- A `scripts/` test fails on any tracked citation whose version segment is missing
  or names a version other than the lockfile's active one, naming each file:line.
- It reads `vendor/sources.lock.json` only; it does not require a fetched
  `vendor/<source>/` tree, so it passes in the Unit Tests job.
- Its failure message names `pnpm vendor:recite` as the remedy.
- A/B verified: red on a deliberately unversioned citation and on a
  deliberately stale one, green on main.
- Registered wherever a new `scripts/` test must be (CI path filters and the
  vitest project list — see the repo's existing registration checklist).
