---
title: "Rehearsal: build the burn-down story generator and generate the 8.0.5.1 stories"
status: draft
updated: 2026-10-13
rfc: "0000-rails-8-1-upgrade-workflow"
cluster: rehearsal
packages: [scripts]
deps: [flip-the-rails-ref-to-v8-0-5-1]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § 7, item 4. The generator is built here, on the small bump, and reused
unchanged by `generate-the-rails-8-1-burn-down-stories`. The 8.0.5.1 work is
on the order of 169 changed bodies and 46 added defs.

## Acceptance criteria

- [ ] A script reads the seeded ledger and the comparers' missing lists and
      writes story files, one per Ruby source file, each with: the ledger rows
      it owns, the `git diff --no-index` command for that file between the two
      version directories, the TS file, the matching test file's added,
      removed and changed tests, and acceptance criteria ending in
      `body-pins.ts --pin <ruby-file>` and an empty ledger for that file.
- [ ] A file whose work exceeds one PR is split along method groups.
- [ ] The stories are authored as a new RFC,
      `rfcs/0000-rails-8-0-5-1-burn-down/` in the tasks repo, opened as its
      own PR, with `deps` in the order arel, activemodel, activesupport,
      activerecord, actionpack, actionview, trailties.
- [ ] After that RFC merges, each ledger row's `story` field is filled in,
      and the ledger gate reds on a row without one.
- [ ] The generator has tests, and takes the source and the two refs as
      arguments with nothing specific to 8.0.5.1 in it.

## Definition of done

Hand-writing the stories does not close this story.
