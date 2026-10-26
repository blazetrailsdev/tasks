---
title: "Make AR ivar mirrors `protected` where no `Host` interface reads them"
status: draft
updated: 2026-10-26
rfc: "0000-predicate-and-underscore-naming"
cluster: ar-underscore-burndown
packages: ["activerecord"]
deps: ["rails-private-jsdoc-autofixes-public-ivar-mirrors"]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

This is the second step of the 2026-10-26 ruling: after the `@internal` autofix, an ivar mirror that no cross-file `Host` interface reads becomes TS `protected`/`private`, which is closer to Ruby. Cut from `pnpm parity:api:naming-shape --list activerecord ivarPublic`.

## Acceptance criteria

- [ ] Every AR ivar mirror not named by a `Host` interface is TS `protected`/`private`.
- [ ] The remainder carry `@internal`, and the AR `ivarPublic` count is 0.
