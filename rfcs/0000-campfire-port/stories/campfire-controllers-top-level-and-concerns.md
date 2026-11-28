---
title: "Campfire example: controller concerns and top-level controllers with their tests"
status: draft
updated: 2026-11-27
rfc: "0000-campfire-port"
cluster: campfire-app
packages: [examples, actionpack]
deps:
  [
    campfire-models-rooms-memberships-accounts,
    campfire-models-users-messages-push,
    campfire-models-opengraph-and-caches,
    geared-pagination-port,
    rqrcode-port,
    jbuilder-port,
  ]
deps-rfc: []
est-loc: 2450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design (The app). `app/controllers/concerns/` (437 lines) and the
controllers directly under `app/controllers/` (387 lines, including
`accounts_controller.rb` with `set_page_and_extract_portion_from` and
`qr_code_controller.rb` with RQRCode); their tests directly under
`test/controllers/` plus `concerns/` (about 1,650 lines). `.jbuilder` views
rendered by these controllers belong here, not in the views stories.

## Acceptance criteria

- [ ] every listed controller and concern ported file for file
- [ ] every listed test file ported and passing

## Notes

Framework gaps the port finds are filed in the owning package's surfaced-deviations bucket and fixed there, not worked around in the app (RFC § Verification).
