---
title: "ActiveRecord tests drop no promises"
status: ready
updated: 2026-11-12
rfc: "0234-no-void-promises"
cluster: tests
packages: [activerecord]
deps:
  [
    reset-column-information-is-awaited,
    no-floating-promises-repo-wide-ignore-void-false,
    no-swallowed-rejection-lint-rule,
  ]
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § Open questions (resolved: tests are gated). After
`reset-column-information-is-awaited`, about 180 activerecord test sites
remain across ~95 files (`void new Reaper(...)`, `void Klass;`, empty
`.catch` in `adapters/postgresql/*.test.ts`, `reaper.test.ts`,
`connection-pool.trails.test.ts`, and others). The mechanical ones become
`await`; a `void Klass;` that only silences unused-variable lint is not a
promise and is left to the rule.

## Acceptance criteria

- [ ] activerecord's `floating` and `swallowed` test counts reach 0. If the diff exceeds the LOC ceiling, ship by directory and file a follow-up story with the remaining file list.
- [ ] No test changes what it asserts; each awaited promise that now rejects is a real failure, fixed or filed.

## Definition of done

An `eslint-disable`, a receipt tag, or a raised mark does not close this story.
