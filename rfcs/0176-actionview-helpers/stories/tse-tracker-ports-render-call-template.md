---
title: "TSETracker ports render_call_template and its next-unless-template skip"
status: done
updated: 2026-10-22
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#9249
claim: "2026-10-22T19:36:04Z"
assignee: "tse-tracker-ports-render-call-template"
blocked-by: null
closed-reason: null
---

## Context

`TSETracker#renderDependencies` (`packages/actionview/src/dependency-tracker/tse-tracker.ts`) reads the call's options through `renderCallOptions`, but it still takes the template from the `ERBTracker`-shaped regexes (`RENDER_ARGUMENTS` / `LAYOUT_DEPENDENCY`). It does not use `options[render_type]`.

Rails' `render_calls` does three things that are not ported:

- it computes `template, object_template = render_call_template(options[render_type])`;
- it skips the call with `next unless template` (`vendor/rails/v8.0.2/actionview/lib/action_view/render_parser/prism_render_parser.rb:18-19`);
- `render_call_template` (`:97-135`) accepts only a string, an interpolated string, or a variable/call read, and returns nil for anything else.

So `render (opts) + more` still yields `opts/opt`, where Rails yields nothing. The `render` scan (`split(/\brender(?:ToString)?\b/)`) also does not exclude the word `render` inside a string literal.

## Acceptance criteria

- Port `renderCallTemplate` over the option's JS text. It accepts a plain string, a backtick literal (each `${}` becomes `*`), or an identifier/member chain (the last name, pluralized/singularized), and returns null otherwise.
- `renderDependencies` reads the template from `options[renderType]` and skips the call when no template comes back. The regex arms are kept only where that keeps the `ERBTracker` answers.
- A `render` inside a string literal is not scanned.
- All 25 `dependency_tracker_test.rb` tests still pass.
