---
title: "Sweep free-form comments out of activerecord (slice 1: relation/)"
status: done
updated: 2026-08-22
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: 6843
claim: "2026-08-21T22:32:56Z"
assignee: "strip-freeform-comments-activerecord"
---

## Context

`blazetrails/no-freeform-comments` landed in trails#6822, registered in
`eslint.config.mjs` for `packages/arel/src` and `packages/activemodel/src`
only. Its autofix DELETES; it keeps JSDoc, references that point AT the Ruby,
and tool directives (including this repo's own `boundary:` / `@boundary-file:`,
read by `no-native-date`). There is no opt-out marker — the `keep:` hatch was
removed unused.

Widening the rule's `files` to activerecord is the remaining work, and it is a
campaign, not one PR. **Measured on the merge commit** with the rule in report
mode over `packages/activerecord/src`:

    TOTAL 4725 blocks / 10039 comment lines

    3714 lines  1749 blocks  (root)
    1580 lines   719 blocks  connection-adapters
    1512 lines   657 blocks  associations
     634 lines   211 blocks  support
     624 lines   340 blocks  adapters
     494 lines   256 blocks  relation
     372 lines   157 blocks  type-virtualization
     323 lines   168 blocks  encryption
     233 lines   168 blocks  test-helpers
     115 lines    58 blocks  sqlite
      83 lines    42 blocks  tasks
      61 lines    38 blocks  attribute-methods
      61 lines    24 blocks  test-fixtures
      54 lines    33 blocks  validations
      51 lines    31 blocks  scoping
      35 lines    16 blocks  database-configurations
      34 lines    27 blocks  migration
      25 lines    17 blocks  type
      10 lines     3 blocks  cases
       6 lines     1 blocks  persistence
       6 lines     3 blocks  testing
       5 lines     1 blocks  coders
       4 lines     3 blocks  trailties
       2 lines     2 blocks  locale
       1 lines     1 blocks  middleware

Every deletion is a LOC deletion, so even a single directory can exceed the
per-PR ceiling; `(root)`, `connection-adapters` and `associations` each need
several slices of their own.

**This story is slice 1: `packages/activerecord/src/relation/**`(494 lines,
256 blocks).** File follow-on slice stories as you go rather than widening this
one — the rule's`files` list is the gate, so it can be extended one glob at a
time and stays green in between.

## The bar this sweep established

From the arel/activemodel pass (506 flagged, 12 kept, 0 escape-hatch):

- A comment that restates the line or branch it sits on goes, whatever its
  subject — including one narrating a TypeScript deviation. Documenting a
  deviation more eloquently ratifies it instead of converging it.
- What survives, survives as JSDoc **carrying a tag or a Rails citation**, not
  as bare prose that was reformatted to `/** */`. That bypass is real and is
  tracked separately as `close-jsdoc-bypass-in-no-freeform-comments`.
- Rails' OWN comments are deleted too. The Ruby is vendored and cited, so a
  copy is a second place that goes stale when upstream edits it.
- A comment recording deferred work or a known-divergent shape becomes a
  story, not a better comment.

## Acceptance criteria

- [ ] `packages/activerecord/src/relation/**/*.ts` added to the
      `no-freeform-comments` block's `files` in `eslint.config.mjs`.
- [ ] `pnpm eslint --fix` applied over that glob and the deletions reviewed
      rather than taken on trust.
- [ ] `pnpm eslint packages/activerecord/src/relation` clean, and a second
      `--fix` run is a no-op.
- [ ] `pnpm typecheck` clean; the AR test files touched run green (not the
      whole suite — see CLAUDE.md).
- [ ] Watch for deletions that empty a block (`catch {}`) and trip `no-empty`;
      express the fallback in code rather than restoring the comment.
- [ ] Any deferred work or known deviation found in a deleted comment is filed
      as its own story with the trails/Rails `file:line`.
- [ ] Follow-on slice stories filed for the directories not covered here.
