---
title: "Campfire example: views as .tse"
status: draft
updated: 2026-11-27
rfc: "0000-campfire-port"
cluster: campfire-app
packages: [examples, actionview]
deps:
  [campfire-helpers, campfire-controllers-top-level-and-concerns, campfire-controllers-namespaced]
deps-rfc: []
est-loc: 2350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design (The app). 90 view files, 2,347 lines, as `.tse` the way
Bookshelf ports Writebook's. Includes `layouts/action_text/contents/_content.html.erb`
(the Lexxy content wrapper), `autocompletable/users/_prompt_item.html.erb`
(`<lexxy-prompt-item sgid=…>`) and `pwa/` (manifest and service worker).
The `.jbuilder` views are `campfire-controllers-top-level-and-concerns`.

## Acceptance criteria

- [ ] every `.erb` view ported as `.tse`, file for file
- [ ] every `PENDING-VIEWS: campfire-views` skip in the controller tests is un-skipped and passes with the real views rendering, and no such marker remains

## Notes

Framework gaps the port finds are filed in the owning package's surfaced-deviations bucket and fixed there, not worked around in the app (RFC § Verification).
