---
title: "Entry check: the data layer is at 100% on Rails 8.0.2 and every gate is green"
status: draft
updated: 2026-10-13
rfc: "0000-rails-8-1-upgrade-workflow"
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
Whether RFC 0175 must close first is the RFC's Open question 5; this story
carries `deps-rfc` on it and drops that edge if the owner rules otherwise.

## Acceptance criteria

- [ ] `API_COMPARE_FORCE=1 pnpm parity:api` and `pnpm parity:test` are run on
      current `main` and the three packages' rows are recorded in the story.
- [ ] The latest `main` CI run is green.
- [ ] The count of open stories whose body cites a Rails `file:line` is
      recorded, since those go stale at the flip.
- [ ] The owner's ruling on Open question 5 is recorded in the RFC, and one
      branch below is applied.
- [ ] **If closing RFC 0175 is required:** arel, activemodel and activerecord
      are at 100% of methods and of tests, RFC 0175 is closed, and this
      story's `deps-rfc` edge stays.
- [ ] **If it is not required:** the `deps-rfc` edge is removed with
      `tasks set-deps-rfc`, and each shortfall from 100% is listed with the
      open story that owns it. Those stories are carried across the flip; this
      story does not wait for them.
- [ ] In either branch, if RFC 0175's only open stories are blocked ones when
      this RFC's tooling has merged, they are listed and carried, per RFC § 4.

## Definition of done

This story changes no gate and ports nothing. A shortfall is reported, not
fixed here.
