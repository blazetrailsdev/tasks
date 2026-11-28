---
title: "platform-agent: port platform_agent"
status: draft
updated: 2026-11-27
rfc: "0000-campfire-port"
cluster: campfire-deps
packages: [platform-agent]
deps: [useragent-port]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design. 119 lines. Campfire's `ApplicationPlatform < PlatformAgent`
(`app/models/application_platform.rb`) defines `ios?`, `android?`,
`mac?`, `chrome?` and others on top of it.

## Acceptance criteria

- [ ] platform_agent 1.0.1 vendored, `packages/platform-agent` created
- [ ] the gem's tests ported and passing
