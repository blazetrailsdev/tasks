---
title: "trailties-encrypted-edit-interrupt-flake"
status: ready
updated: 2026-11-22
rfc: "0061-ci-failures"
cluster: null
packages: []
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

Seen on trails#10527 (run 44959392416, job 137014769679), in a PR that does not
touch trailties: `packages/trailties/test/commands/encrypted.test.ts` >
"edit command does not display save confirmation message if interrupted" got
`File encrypted and saved.` in its output. The test interrupts a spawned
editor subprocess, so it is timing-sensitive
(`vendor/rails/v8.0.2/railties/test/commands/encrypted_test.rb`).

## Acceptance criteria

- [ ] The interrupt reaches the edit command before it saves, deterministically.
- [ ] The test passes on 20 consecutive runs.
