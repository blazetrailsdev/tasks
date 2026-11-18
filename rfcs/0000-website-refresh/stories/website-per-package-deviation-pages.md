---
title: "Generate one docs page per published package from its ratified CLAUDE.md sections"
status: draft
updated: 2026-11-18
rfc: "0000-website-refresh"
cluster: website-docs
packages: [website]
deps: [website-pages-deploy-workflow]
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § Design 3, and the per-package table in § Motivation. Three hand-written
deviation pages exist: `docs/guides/arel-rails-deviations.md` (135 lines),
`activemodel-rails-deviations.md` (145) and `activerecord-rails-deviations.md`
(509). The activerecord page documents `wrapWithScopeProxy` (`:204-215,494`),
which no longer exists in `packages/activerecord/lib`. It says "pluggable
adapters for browser support" (`:499`) and models with `static {
this.attribute(…) }` (`:423-426`), and it cites none of the ratified sections
in `packages/activerecord/CLAUDE.md`. Fifty-one published packages have no
page. `scripts/parity/package-summary.ts` already parses root and per-package
`CLAUDE.md` sections (`claudeSections`).

## Acceptance criteria

- [ ] `docs/packages/<pkg>.md` is generated at build time for every published package. Each page has the Rails counterpart (gem and version from `vendor/`), the parity figures from `website-parity-numbers-at-build` when it has landed (otherwise "—"), and every root `CLAUDE.md` section that cites the package plus every section of `packages/<pkg>/CLAUDE.md`.
- [ ] Each section renders as its heading, its first paragraph or one-line rule, and a link to the section on GitHub at the build's commit. Section prose is not copied wholesale.
- [ ] The three `*-rails-deviations.md` pages are deleted. Their still-true prose moves to `idioms.md` or the generated page's intro. Each stale claim listed in Context is deleted, not carried.
- [ ] `idioms.md` and `guides/index.md` are re-read against the root `CLAUDE.md`, and any example that contradicts a ratified rule is fixed (for example, `static {}` models where the schema is reflected).
- [ ] The guides typecheck (`scripts/guides-typecheck/`) passes on every remaining code block.
