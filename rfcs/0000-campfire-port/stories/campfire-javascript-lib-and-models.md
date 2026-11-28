---
title: "Campfire example: JavaScript lib and models, including the Lexxy extension"
status: draft
updated: 2026-11-27
rfc: "0000-campfire-port"
cluster: campfire-app
packages: [examples, vite-trails]
deps: [vendor-campfire-source, lexxy-engine-port]
deps-rfc: []
est-loc: 1950
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design (The app). `app/javascript/lib/` (1,368 lines) and `models/`
(546), including `lib/rich_text/campfire_extension.js` (`extends Lexxy.Extension`),
`lib/rich_text/cite_node.js` (`Lexxy.Lexical.ElementNode`),
`models/message_formatter.js` and `models/client_message.js`.

## Acceptance criteria

- [ ] every listed file copied as written, except import specifiers Vite needs, each receipted
- [ ] `pnpm build:assets` succeeds with both JavaScript stories landed
