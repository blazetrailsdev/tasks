---
title: "register-render-parser-and-ruby-tracker-as-permanently-unported"
status: draft
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/actionview/CLAUDE.md` § "`TSETracker` answers what `RubyTracker`
answers" records the repo-owner ruling (2026-10-18) that **no trails handler
compiles to Ruby, so there is no `RubyTracker`** and `TSETracker` answers the
three `dependency_tracker_test.rb:274-302` tests instead.

That ruling is not reflected in the parity register, so four Ruby files still
score as unported surface against actionview's 95.8%:

| Ruby file                               | methods counted missing |
| --------------------------------------- | ----------------------- |
| `render_parser/ripper_render_parser.rb` | 35                      |
| `dependency_tracker/ruby_tracker.rb`    | 9                       |
| `render_parser.rb`                      | 3                       |
| `render_parser/prism_render_parser.rb`  | 3                       |

That is **50 of actionview's 129 missing methods and 4 of its 6 missing
files** — all of it ruled permanently unported. `scripts/parity/unported-files/actionview.ts`
has rows for `template/handlers/builder.rb` and `helpers/atom_feed_helper.rb`
but none for these.

## Acceptance criteria

- `scripts/parity/unported-files/actionview.ts` carries a row per file above,
  each `PERMANENT`, each citing the `packages/actionview/CLAUDE.md` section and
  the ruling date, with the Rails path.
- `pnpm parity:api` shows actionview's missing-method count down by ~50 and its
  file count up by 4, with the reason surfacing as "intentionally excluded".
- `scripts/parity/unported-files.test.ts` stays green, and no row uses a
  substring pattern that over-matches a ported sibling (see the
  substring-overmatch trap).
- `ruby-tracker-tests-need-a-tracker-or-a-ruling` is already `done`; this story
  only records its outcome in the register.
