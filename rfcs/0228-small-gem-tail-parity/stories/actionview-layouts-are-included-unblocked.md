---
title: 'Run actionview''s "layouts are included" now that its blocker is done'
status: ready
updated: 2026-11-10
rfc: "0228-small-gem-tail-parity"
cluster: null
packages:
  - "actionview"
deps: []
deps-rfc: []
est-loc: 40
priority: 2
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

- [ ] The test runs with its Rails body, its BLOCKED line removed, and passes.
- [ ] If it still fails, the cause is fixed when it is a ported arm under
      100 LOC. Otherwise a new story is filed in this RFC and the skip's
      `BLOCKED:` line names it.
- [ ] Measured outcome: actionview's skipped count goes from 46 to 45, with its
      41 `PERMANENT-SKIP`s unchanged, or stays 46 with the new blocker named.
