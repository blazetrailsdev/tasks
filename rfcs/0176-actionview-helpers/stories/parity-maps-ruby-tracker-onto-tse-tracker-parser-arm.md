---
title: "parity:api measures ruby_tracker.rb against TSETracker's parser arm"
status: claimed
updated: 2026-10-28
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-10-28T11:49:47Z"
assignee: "parity-maps-ruby-tracker-onto-tse-tracker-parser-arm"
blocked-by: null
closed-reason: null
---

## Context

trails#9368 folded `ActionView::DependencyTracker::RubyTracker` (`vendor/rails/v8.0.2/actionview/lib/action_view/dependency_tracker/ruby_tracker.rb:5-39`) into `TSETracker`'s `parserClass` arm (`packages/actionview/src/dependency-tracker/tse-tracker.ts`). This follows the owner ruling that no Ruby-named class persists. `parity:api` now does not measure `ruby_tracker.rb` at all:

- Adding `RUBY_FILE_TS_OVERRIDES["actionview:dependency_tracker/ruby_tracker.rb"] = "dependency-tracker/tse-tracker.ts"` makes `parity:api:extra` report `erb_tracker.rb`'s constants (`RENDER_ARGUMENTS`, `LAYOUT_DEPENDENCY`, …) and `TSETracker` itself as "moved".
- Adding `TS_CLASS_RENAMES.RubyTracker = "TSETracker"` does the same.

Two Ruby classes cannot map onto one TS class (`scripts/parity/conventions.ts`).

## Acceptance criteria

- The comparer can credit two Ruby classes (`ERBTracker`, `RubyTracker`) onto one TS class in one file without flagging either side's members as moved.
- `ruby_tracker.rb`'s `render_dependencies` / `explicit_dependencies` / readers are measured against `TSETracker`, and the call gates compare its parser arm against `ruby_tracker.rb:27-35`.
