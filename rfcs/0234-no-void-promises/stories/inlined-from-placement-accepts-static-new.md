---
title: "inlined-from-placement accepts @inlinedFrom on a static async new"
status: ready
updated: 2026-11-12
rfc: "0234-no-void-promises"
cluster: gate
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § Design 2(a). `eslint/inlined-from-placement.mjs:126` reports
`notConstructor` for a `#initialize` / `#new` tag on any member other than the
constructor. Once part of `initialize` moves into `static async new`, its
`@inlinedFrom` tags move with it, and `parity:api:inlined` and both call gates
must compare that member against the tagged Ruby bodies.

This story changes repo tooling only (`eslint/`, `eslint.config.mjs`, `scripts/`), so its `packages` is empty; it applies to every package in the RFC.

## Acceptance criteria

- [ ] The rule accepts `#initialize` and `ClassMethods#new` tags on a `static new` member of a class whose constructor is `protected`.
- [ ] `parity:api` credits the tagged hooks to `static new`, and `parity:api:calls` compares it; a fixture class proves both.
- [ ] RuleTester covers the accepted and the still-rejected placements.
