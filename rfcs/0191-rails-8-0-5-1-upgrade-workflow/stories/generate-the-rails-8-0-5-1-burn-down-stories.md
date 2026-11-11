---
title: "Build the burn-down story generator and generate the 8.0.5.2 stories"
status: draft
updated: 2026-10-13
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: post-flip
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

RFC § 7, item 4. This RFC holds no porting stories. Target `v8.0.5.2`; the
slug predates the retarget. Measured at `v8.0.5.1` on 2026-10-13, the work
was 82 Ruby
files with a drifted or stale pin (activerecord 35, activesupport 12, arel 11,
actiondispatch 9, actionview 6, actioncontroller 5, trailties 3, activemodel
1), 46 defs added and 22 removed upstream, and 112 tests added, 5 removed and
36 changed in place; `v8.0.5.2` adds about 36 files (RFC § 1 delta table)
and five more packages. The dry run at `v8.0.5.2` (2026-11-11) seeds 197
pair rows in 102 Ruby files and 37 test rows, with 256 tests added, 14 removed
and 46 changed upstream: on the order of 130–150 files' work, cut into about 20–25 package stories. The seeded ledger is
the authority. The generator
is reused by the 8.1 upgrade.

## Acceptance criteria

- [ ] A script reads the seeded ledger and the comparers' missing lists and
      writes story files, one per package, each with: the ledger rows it
      owns, and per Ruby file the `git diff --no-index` command between the
      two version directories, the TS file, and the matching test file's
      added, removed and changed tests. Acceptance criteria end in
      `body-pins.ts --pin` for each of the package's files, an empty ledger
      for the package, and each upstream-added test ported or recorded as not
      ported with its reason. The LOC ceiling is waived in each story.
- [ ] A package too large to review as one PR is split along subsystem
      directories, never below one Ruby file: activerecord by subsystem
      (associations, relation and query, connection adapters, migrations and
      schema, core and attributes), and actionview with the helpers that
      depend on `bump-rails-html-sanitizer-to-v1-7-2` in their own story. The
      split threshold is a generator argument.
- [ ] The stories are authored as a new RFC,
      `rfcs/0000-rails-8-0-5-2-burn-down/` in the tasks repo, opened as its
      own PR, with `deps` in the order arel, activemodel, activesupport,
      activerecord, actionpack, actionview, actioncable, activejob,
      actionmailer, activestorage, actionmailbox, actiontext, trailties.
- [ ] The stories for `actionview/lib/action_view/helpers/sanitize_helper.rb`
      and `text_helper.rb` carry a cross-RFC dep on
      `bump-rails-html-sanitizer-to-v1-7-2` (RFC § 1, Order).
- [ ] After that RFC merges, each ledger row's `story` field is filled in,
      and the ledger gate reds on a row without one.
- [ ] The generator has tests, and takes the source and the two refs as
      arguments with nothing specific to 8.0.5.2 in it.

## Definition of done

Hand-writing the stories does not close this story.
