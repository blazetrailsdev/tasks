---
title: "thor: Actions.sourcePaths memoizes as actions.rb does"
status: in-progress
updated: 2026-10-04
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#8489
claim: "2026-10-04T16:08:08Z"
assignee: "port-thor-util"
blocked-by: null
closed-reason: null
---

## Context

Pairing a module member and a top-level function of one name each with its own Rails body newly
measures `thor/actions.ts#sourcePaths` in `pnpm parity:api:arms:report --package=thor`: `count +if`,
`-or`. Rails' class method is `@_source_paths ||= []` (`vendor/thor/*/lib/thor/actions.rb:22-24`);
the port tests `hasOwnProperty` and assigns.

## Acceptance criteria

- [ ] `sourcePaths` memoizes as `actions.rb:22-24` does and the row leaves the arms report.
