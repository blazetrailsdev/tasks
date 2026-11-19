---
title: "Port WebConsole::Request, WhinyRequest and Permissions"
status: draft
updated: 2026-11-19
rfc: "0250-web-console-gem-port"
cluster: port
packages: [web-console]
deps: [vendor-web-console-gem]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`lib/web_console/request.rb`, `whiny_request.rb`, `permissions.rb` and their
tests (`test/web_console/request_test.rb`, `whiny_request_test.rb`,
`permissions_test.rb`) under `vendor/web-console/v4.3.0/`.

## Acceptance criteria

- [ ] The three classes are ported and their 15 tests pass.
