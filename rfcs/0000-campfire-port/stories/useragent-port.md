---
title: "useragent: port the gem"
status: draft
updated: 2026-11-27
rfc: "0000-campfire-port"
cluster: campfire-deps
packages: [useragent]
deps: []
deps-rfc: []
est-loc: 650
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design. 1,531 lines, needed by platform_agent. `UserAgent.parse`,
the browser classes, `Version` comparison and operating-system detection.

Rails itself reads this gem: `ActionController::AllowBrowser`'s
`BrowserBlocker` parses with `UserAgent.parse`
(`vendor/rails/v8.0.5.2/actionpack/lib/action_controller/metal/allow_browser.rb:89-91`).
trails parses with ua-parser-js instead, and
`allow-browser-parses-with-ua-parser-js-not-the-useragent-gem` (RFC 0141) is
blocked on the operator decision to vendor and port this gem. Approving this
RFC is that decision; this story unblocks that one.

## Acceptance criteria

- [ ] useragent 0.16.11 vendored, `packages/useragent` created
- [ ] `pnpm tasks status-set allow-browser-parses-with-ua-parser-js-not-the-useragent-gem ready` run on merge, with its `blocked-by` cleared
- [ ] the new package registered as a new package needs (`ci.yml` lanes, the workspace guard fixture, `vendor/sources.ts`)
- [ ] the gem's specs ported and passing; if the port exceeds the ceiling, the browser classes not reached by platform_agent are filed as a follow-up story
