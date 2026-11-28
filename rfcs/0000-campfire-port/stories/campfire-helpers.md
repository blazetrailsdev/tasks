---
title: "Campfire example: helpers with their tests"
status: draft
updated: 2026-11-27
rfc: "0000-campfire-port"
cluster: campfire-app
packages: [examples, actionview]
deps: [campfire-models-users-messages-push, rails-autolink-port, lexxy-engine-port]
deps-rfc: []
est-loc: 1260
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design (The app). `app/helpers/` (838 lines): `MessagesHelper`
(`auto_link`, `messages_helper.rb:122-130`), `ContentFilters`,
`RichTextHelper` (`tag.lexxy_prompt`, `rich_text_helper.rb:5-9`),
`RoomsHelper`; tests `test/helpers/` (423 lines).

## Acceptance criteria

- [ ] every helper ported file for file
- [ ] every helper test ported and passing

## Notes

Framework gaps the port finds are filed in the owning package's surfaced-deviations bucket and fixed there, not worked around in the app (RFC § Verification).
