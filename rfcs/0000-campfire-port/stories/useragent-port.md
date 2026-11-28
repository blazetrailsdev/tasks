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

## Acceptance criteria

- [ ] useragent 0.16.11 vendored, `packages/useragent` created
- [ ] the gem's specs ported and passing; if the port exceeds the ceiling, the browser classes not reached by platform_agent are filed as a follow-up story
