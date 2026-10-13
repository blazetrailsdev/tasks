---
title: "Generate the Rails 8.1 burn-down RFC: one story per drifted file, plus the new and removed surface"
status: draft
updated: 2026-10-13
rfc: "0000-rails-8-1-upgrade-workflow"
cluster: post-flip
packages: [scripts]
deps: [flip-the-rails-ref-to-v8-1-4, generate-the-rails-8-0-5-1-burn-down-stories]
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

RFC § 7, item 4, and § 2. This RFC holds no porting stories. Measured from
`v8.0.2` (the rehearsal's re-measurement replaces these), the work is: 288 Ruby files with a drifted or stale pin (activerecord 127,
activesupport 47, actiondispatch 35, arel 20, trailties 17, actioncontroller
14, actionview 13, activemodel 11, activerecord-test-support 4), 839 defs
added and 227 removed upstream, 1,239 tests added and 115 removed, and 187
arel tests moved to new describe paths.

## Acceptance criteria

- [ ] The generator built by `generate-the-rails-8-0-5-1-burn-down-stories`
      is run for `v8.0.5.1` → `v8.1.4`, and any change it needed is listed.
      It reads the seeded ledger and the comparers' missing lists and
      writes story files, one per Ruby source file, each with: the ledger rows
      it owns, the `git diff --no-index` command for that file between
      `vendor/rails/v8.0.2/` and `vendor/rails/v8.1.4/`, the TS file, the
      matching test file's added, removed and changed tests, and acceptance
      criteria ending in `body-pins.ts --pin <ruby-file>` and an empty ledger
      for that file.
- [ ] The stories are authored as a new RFC, `rfcs/0000-rails-8-1-burn-down/`
      in the tasks repo, opened as its own PR. A file whose work exceeds one
      PR is split by the script along method groups, not left oversized.
- [ ] Story `deps` follow arel, activemodel, activesupport, activerecord,
      actionpack, actionview, trailties, so a file's stories depend on the
      stories for files it calls into where the ledger shows both changed.
- [ ] Upstream files that are new, and new activejob and trailties surface
      trails has not started, are listed in the new RFC's Non-goals or given
      stories, with the choice stated.
- [ ] After that RFC merges, each ledger row's `story` field is filled in by
      a follow-up PR on trails, and the ledger gate reds on a row without one.
- [ ] Rails 8.1's dependency changes (`json` added to activesupport, `tsort`
      to railties, `benchmark` dropped) are noted in the new RFC.

## Definition of done

Hand-writing the stories does not close this story.
