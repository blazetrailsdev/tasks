---
title: "Port rqrcode for the Writebook example QR codes"
status: draft
updated: 2026-11-24
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
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

Writebook shows QR codes for public book links, join links and session-transfer links (`vendor/writebook/v1.2.9/app/controllers/qr_code_controller.rb`, `app/models/qr_code_link.rb`, `app/helpers/invitations_helper.rb#qr_code_image`) using the rqrcode gem. trails has no port, so `examples/electron-writebook` omits `QrCodeController`, `QrCodeLink`, the `qr_code` route and the QR dialogs in `books/publications/_publication`, `users/_invite` and `users/_transfer`.

## Acceptance criteria

- rqrcode (and rqrcode_core) are ported, or a ratified npm-backed equivalent exists.
- The example ports `QrCodeLink`, `QrCodeController`, `resources :qr_code` and the three QR dialogs.
