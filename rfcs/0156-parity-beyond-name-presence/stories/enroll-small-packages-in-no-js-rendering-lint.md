---
title: "Converge and enroll globalid, i18n, rack, rack-session in no-js-rendering-in-rails-messages"
status: in-progress
updated: 2026-09-24
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: trails#8041
claim: "2026-09-24T16:43:54Z"
assignee: "gate-or-retire-the-branch-name-story-fallback"
blocked-by: null
closed-reason: null
---

## Context

trails#7979 shipped `blazetrails/no-js-rendering-in-rails-messages` enrolled in arel only (`eslint.config.mjs`, only-grow).
Measured hits with the rule forced on, in non-test src: globalid 1 (`config.ts:7`), i18n 2 (`exceptions.ts:22`, `locale/fallbacks.ts:74`),
rack 2 (`utils.ts:274,300`), rack-session 2 (`abstract/id.ts:49,158`). The larger packages (activerecord 84, activesupport 62, actionpack 28)
each already have 0155 point stories for some of their sites.

## Acceptance criteria

- Each site is converged onto the Rails rendering: `inspect` via `rbInspect` or the value's own ported `inspect`, and `.class` via `rbObjClass`. Cite the Rails `file:line` for each.
- globalid, i18n, rack and rack-session are added to the rule's `files` list, and each is clean.
