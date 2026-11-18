---
title: "Landing package grid grouped like Rails' frameworks, with live parity figures"
status: draft
updated: 2026-11-18
rfc: "0247-website-refresh"
cluster: website-landing
packages: [website]
deps: [website-landing-page-rebuild, website-parity-numbers-at-build]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § Design 4, row 5. The current grid (`packages/website/src/routes/+page.svelte:3-8`)
names six packages, with hand-typed coverage. The grouping the RFC fixes is
Models (activerecord, activemodel, arel); Controllers & views (actionpack,
actionview, rack and the rack-\* ports); Other components (actionmailer,
actionmailbox, actiontext, activejob, activestorage, actioncable,
activesupport); Rails 8 defaults (solid-queue, solid-cache, solid-cable,
turbo, stimulus, vite-assets, vite-trails); Gems (the other gem ports); and
Tooling (activerecord-cli, trails-tsc, tse-compiler, vitest-matchers).

## Acceptance criteria

- [ ] The grid is generated from the same package list as `website-typedoc-from-package-list` (or the package summary). The grouping is one map in `packages/website/`, and a test fails if a published package is missing from it, so a new package is placed deliberately rather than defaulting to a group.
- [ ] Each tile shows the package, its Rails counterpart, its parity figures from `website-parity-numbers-at-build`, and links to its `docs/packages/<pkg>` page.
- [ ] The announcement bar / hero pill shows one headline figure from the same data, with its commit.
