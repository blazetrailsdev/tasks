---
title: 'Run actionview''s "layouts are included" now that its blocker is done'
status: draft
updated: 2026-11-09
rfc: "0000-small-gem-tail-parity"
cluster: null
packages:
  - "actionview"
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/actionview/test/actionpack/abstract/abstract-controller.test.ts:277`
`test.skip("layouts are included")` is marked `BLOCKED:
layouts-inherited-writes-layout-method-at-first-construction`, and that story is
done (0141). actionview's other open skips are owned by
`html-sanitizer-port-scrubbers` and `html-sanitizer-safe-list-sanitize-css`
(0123) or are `PERMANENT-SKIP`.

## Acceptance criteria

- [ ] The test runs with its Rails body, its BLOCKED line removed.
