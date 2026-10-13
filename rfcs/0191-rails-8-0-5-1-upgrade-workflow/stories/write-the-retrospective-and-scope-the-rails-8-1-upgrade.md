---
title: "Write the retrospective and scope the Rails 8.1 upgrade from the v8.0.5.1 base"
status: draft
updated: 2026-10-13
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: close
packages: [scripts]
deps: [retire-the-rails-ledger-and-prune-v8-0-2]
deps-rfc: []
est-loc: 0
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § 8 "The next bump". This RFC stops at `v8.0.5.1`. The 8.1 upgrade is a
follow-up RFC, written once this bump has shown how the procedure behaves.
A first measurement of `v8.0.2` → `v8.1.4` exists (728 DRIFT and 125 STALE
pins in 288 files, thirteen gates red) and is superseded by a measurement from
the `v8.0.5.1` base, which should be smaller by roughly the 132 bodies this
bump already re-verified. Docs and RFC prose only.

## Acceptance criteria

- [ ] A retrospective is added to this RFC as a section and a dated Changelog
      entry: dry-run prediction against what happened, per gate; each gate
      that was "not exercised" and how it behaved at the flip; ledger rows
      opened, days to empty and PRs merged, read from the stats DB; every
      change made to the tooling along the way; any rule of § 3 that turned
      out wrong.
- [ ] The latest `v8.1.x` tag is re-resolved from rails/rails, and
      `pnpm parity:bump:dry-run --source rails --ref <that tag>` is run from
      the `v8.0.5.1` base, with its report committed so the stats sync
      imports it.
- [ ] A new RFC, `rfcs/0000-rails-8-1-upgrade-workflow/`, is opened as its own
      PR in the tasks repo. It reuses this RFC's procedure by reference, and
      carries: the new dry-run tables; its own flip, tag, generate, re-read
      and close stories; the dependent-source bumps the 8.1 lock moves; and
      the two questions this RFC defers to it, the version scheme and the
      release timing, with § 6's analysis.
- [ ] `vendor/README.md`'s runbook is corrected for anything the
      retrospective found.

## Definition of done

This story bumps nothing and ports nothing.
