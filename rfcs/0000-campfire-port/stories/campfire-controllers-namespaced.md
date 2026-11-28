---
title: "Campfire example: accounts, autocompletable, messages, rooms, sessions and users controllers with their tests"
status: draft
updated: 2026-11-27
rfc: "0000-campfire-port"
cluster: campfire-app
packages: [examples, actionpack]
deps: [campfire-controllers-top-level-and-concerns]
deps-rfc: []
est-loc: 2400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design (The app). `app/controllers/{accounts,autocompletable,messages,rooms,sessions,users}/`
(767 lines; `accounts/users_controller.rb:5` and
`autocompletable/users_controller.rb:3` paginate with geared_pagination) and
the matching `test/controllers/` directories (about 1,630 lines).

## Acceptance criteria

- [ ] every listed controller ported file for file
- [ ] every listed test file ported; the JSON, redirect and `head` assertions pass, and each case that asserts on rendered HTML is parked as `it.skip` under a `PENDING-VIEWS: campfire-views` line, since the HTML templates arrive in `campfire-views`

## Notes

Framework gaps the port finds are filed in the owning package's surfaced-deviations bucket and fixed there, not worked around in the app (RFC § Verification).
