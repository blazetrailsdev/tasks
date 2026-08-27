---
title: "strip-english-comments-arel-nodes"
status: closed
updated: 2026-08-27
rfc: "0124-arel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "superseded by strip-english-comments-enrolled-packages (PR #7132): the rule-driven sweep re-swept every enrolled tree at once, so the per-directory slicing table does not apply"
---

## Context

Sibling slice of `strip-english-comments-arel-visitors` (RFC 0124), which
established the keep/delete definition and shipped the `visitors/` slice.

**Policy, 2026-08-27 (maintainer): trails carries no English-language comments.**
The only comments that survive are our JSDoc flags and the tool directives the
toolchain reads — with no narrative prose around them.

This slice is **packages/arel/src/nodes/**, measured 2026-08-27 at **333 prose lines**.

**Keep** — a comment must be one of:

- A JSDoc tag: `@internal`, `@noRailsEquivalent`, `@missingRailsCall`,
  `@missingRailsArgs`, `@nie disposition=`, together with the reason argument
  the tag requires (`parity:api:extra` and `lint-missing-rails-call-reasons`
  read it).
- A Rails citation: a `Mirrors:` line or a `<file>.rb:<lines>` reference,
  standing alone.
- A tool directive: `eslint-*`, `@ts-*`, `prettier-ignore`, coverage pragmas,
  `boundary:` / `@boundary-file:`.

**Delete** — every English sentence: standalone `//` narration, prose
paragraphs inside a JSDoc block, prose clauses attached to a citation (keep the
`Mirrors: X`, drop the clause), and descriptive JSDoc summaries.

## Acceptance criteria

- [ ] Every prose comment under `packages/arel/src/nodes/` is gone.
- [ ] Every `Mirrors:` line, `.rb` citation, JSDoc tag with its required reason
      argument, and tool directive is preserved verbatim.
- [ ] A JSDoc block reduced to nothing is removed entirely, not left as an
      empty `/** */`.
- [ ] No behaviour change: no code edits beyond comment removal, no renames, no
      reformatting of surviving lines beyond collapsing the blocks they sit in.
- [ ] `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args` and
      `parity:api:extra --package arel` are unchanged; `parity:api:extra:gate`
      stays at arel novel 0.
- [ ] `pnpm lint` clean; no new eslint-disable.
