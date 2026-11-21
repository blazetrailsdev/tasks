---
title: "tasks: drop the builder three from action-pack-assertions' park criterion"
status: draft
updated: 2026-11-21
rfc: "0255-last-mile-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 5
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10512 ported action-pack-assertions' three "rendering xml" tests
(`vendor/rails/v8.0.2/actionpack/test/controller/action_pack_assertions_test.rb:504-517`), so the builder
half of `action-pack-assertions-port-render-file-tests-and-park-the-builder-three` is done. Its park
criterion still names them, and `packages/actionpack/test/action-controller/controller/action-pack-assertions.test.ts:169`
still carries the `BLOCKED:` line for the two render-file tests.

## Acceptance criteria

- [ ] That story's acceptance criteria drop the builder three and cover only the two render-file tests.
