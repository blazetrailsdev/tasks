---
title: "autolink: port rails_autolink"
status: draft
updated: 2026-11-27
rfc: "0000-campfire-port"
cluster: campfire-deps
packages: [autolink]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design. 173 lines. Campfire's `MessagesHelper#auto_link_text`
(`app/helpers/messages_helper.rb:122-130`) calls `auto_link(text, html: { target: "_blank" })`.
The gem adds `auto_link` to `ActionView::Helpers::TextHelper`.

## Acceptance criteria

- [ ] rails_autolink 1.1.8 vendored, `packages/autolink` adding `autoLink`, `autoLinkUrls`, `autoLinkEmailAddresses` to TextHelper
- [ ] the gem's `test_rails_autolink.rb` ported and passing
- [ ] the new package registered as a new package needs (`ci.yml` lanes, the workspace guard fixture, `vendor/sources.ts`)
