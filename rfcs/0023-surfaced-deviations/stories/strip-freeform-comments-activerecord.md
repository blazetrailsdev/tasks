---
title: "strip-freeform-comments-activerecord"
status: draft
updated: 2026-08-21
rfc: "0023-surfaced-deviations"
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
closed-reason: null
---

## Context

`eslint/no-freeform-comments` is now registered in `eslint.config.mjs`, scoped
to `packages/arel/src` and `packages/activemodel/src` — the two packages whose
comment backlog has been swept. Its autofix DELETES; it keeps JSDoc, Rails
references, tool directives (including this repo's own `boundary:` /
`@boundary-file:`, read by `no-native-date`), and Rails' own comments matched
against the generated `eslint/rails-verbatim-comments.json`.

`activerecord` is not in scope yet, and the rule's `files` list is the gate.
Widening it is this story.

The sweep across the first two packages deleted 463 comment blocks and kept 22,
all of which sit on a declaration and became JSDoc. The bar that produced that
ratio, worth reusing verbatim:

- A comment that restates the line or branch it sits on goes, whatever its
  subject — including one that narrates a TypeScript deviation. Documenting a
  deviation more eloquently is ratifying it, not converging it.
- What survives, survives as JSDoc on a declaration or as a Rails citation.
  Do not reach for the `keep:` escape hatch to preserve body-level prose.
- A comment recording deferred work or a known-divergent shape becomes a story,
  not a better comment. The arel sweep produced exactly one
  (`converge-sql-literal-yaml-onto-encode-with`).

## Acceptance criteria

- [ ] `packages/activerecord/src/**/*.ts` added to the `no-freeform-comments`
      block's `files` in `eslint.config.mjs`.
- [ ] `pnpm eslint --fix packages/activerecord/src` applied, and the resulting
      deletions reviewed rather than taken on trust.
- [ ] `pnpm eslint packages/activerecord/src` clean, and a second `--fix` run
      is a no-op.
- [ ] `pnpm typecheck` clean; the AR test files touched run green (not the
      whole suite — see CLAUDE.md).
- [ ] Any deferred work or known deviation found in a deleted comment is filed
      as its own story with the trails/Rails `file:line`.
- [ ] `eslint/rails-verbatim-comments.json` not hand-edited (regenerate with
      `pnpm rails-comments:manifest`).
