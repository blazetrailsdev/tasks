---
title: "Views call renderMarkdown, pluralize and the partial shorthand"
status: draft
updated: 2026-10-30
rfc: "0136-trailmap"
cluster: null
packages: ["actionview"]
deps: ["story-pages-and-dashboard-render-through-instance-assigns"]
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Items 1 (markdown), 5 (pluralization) and 6 (partial calls) of the numbered list in the Context of `render-trailmap-pages-through-helpers-assigns-and-route-helpers`. Measured 2026-10-30: 50 `render({ partial` calls, 5 count ternaries, 9 `renderMarkdown` references in controllers.

`MarkdownHelper` has to be added to the helper stand-in in `test/support/controller-test-case.ts`.

## Acceptance criteria

- No controller imports `renderMarkdown`.
- Count phrases use `pluralize`, and partials use `render(name, locals)`.
- The page tests pass with no assertion changes.
