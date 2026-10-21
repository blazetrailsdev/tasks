---
title: "CI ratchet: new Module / superMethod / Module imports can only go down"
status: done
updated: 2026-10-21
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: tooling
packages: ["scripts"]
deps: []
deps-rfc: []
est-loc: 120
priority: 1
pr: trails#9190
claim: "2026-10-21T20:14:55Z"
assignee: "module-count-ratchet-blocks-new-ruby-compat-modules"
blocked-by: null
closed-reason: null
---

## Context

`new Module(` / `.superMethod(` counts have dropped from 210 / 148 (RFC 0197 baseline) to 123 / 146 non-test lines on origin/main (2026-10-21). Nothing stops a new port from adding another one. Before the class is deleted, conversions should be locked in.

## Acceptance criteria

- A lint rule or a `scripts/` ratchet (like the `parity:api:extra` marks) counts `new Module(`, `.superMethod(` and ruby-compat `Module` imports per package outside ruby-compat, and fails CI when a count rises.
- The ratchet's marks only go down (a `:tighten` command narrows them). The marks are deleted together with the class in `delete-ruby-compat-module-class-final`.
