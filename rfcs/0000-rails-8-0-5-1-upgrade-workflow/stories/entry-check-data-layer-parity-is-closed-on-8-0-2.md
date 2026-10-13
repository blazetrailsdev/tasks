---
title: "Entry check: the data layer is at 100% on Rails 8.0.2 and every gate is green"
status: draft
updated: 2026-10-13
rfc: "0000-rails-8-0-5-1-upgrade-workflow"
cluster: entry
packages: [arel, activemodel, activerecord]
deps: []
deps-rfc: ["0175-activerecord-test-parity-100"]
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § 4. The `rails-8.0.2` tag is meant to mark a complete data layer. On
2026-10-13 (trails `25cc7a1876`): arel 1052/1052 methods and 739/739 tests,
activemodel 821/821 and 1037/1037, activerecord 6980/6980 and 8801/8830.
The owner ruled on 2026-10-13 that RFC 0175 closes before the flip.

## Acceptance criteria

- [ ] `API_COMPARE_FORCE=1 pnpm parity:api` and `pnpm parity:test` are run on
      current `main` and the three packages' rows are recorded in the story.
- [ ] The latest `main` CI run is green.
- [ ] The count of open stories whose body cites a Rails `file:line` is
      recorded, since those go stale at the flip.
- [ ] arel, activemodel and activerecord are at 100% of methods and of
      tests, and RFC 0175 is closed. The owner ruled on 2026-10-13 that
      RFC 0175 finishes before the flip (RFC § 4, criterion 4), so this
      story's `deps-rfc` edge stays.

## Definition of done

This story changes no gate and ports nothing. A shortfall is reported, not
fixed here.
