---
title: "Dry-run each dependent source the Rails 8.0.5.2 lock moves, beyond the sanitizer chain, and file one bump story per source"
status: draft
updated: 2026-10-13
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: post-flip
packages:
  [
    scripts,
    rack-session,
    thor,
    pg,
    sqlite3,
    zeitwerk,
    mini-magick,
    solid-queue,
    solid-cable,
    trailties,
  ]
deps: [flip-the-rails-ref-to-v8-0-5-1]
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § 1 "Dependent sources" (table re-read 2026-11-10). Rails `v8.0.5.2`'s
`Gemfile.lock` resolves these compared sources past their pin in
`vendor/sources.lock.json`: rack-session 2.1.0 → 2.1.1 (2 commits, lib
+8/-2), thor 1.3.2 → 1.4.0 (35 commits, lib +48/-16), sqlite3 2.6.0 → 2.7.3,
pg 1.5.9 → 1.6.2, zeitwerk 2.7.2 → 2.7.3 (16 commits, lib +367/-287),
mini_magick 5.2.0 → 5.3.1 (11 commits, lib +9/-9), and, through Rails'
development `Gemfile` only, solid_queue 1.1.3 → 1.2.1 and solid_cable 3.0.7 →
3.0.12. racc (anchor) moves 1.8.0 → 1.8.1; minitest 5.27.0 → 6.0.0 and
rails-dom-testing 2.2.0 → 2.3.0 are read-anchors. rack (pinned 3.2.8 against
the lock's 3.2.1), i18n and globalid already lead the lock and do not move.

The gemspec-forced chain (nokogiri, loofah, rails-html-sanitizer) is out of
scope here: it has its own three stories.

## Acceptance criteria

- [ ] Each target tag is confirmed upstream (`git ls-remote --tags`) and to be
      what `vendor/rails/v8.0.5.2/Gemfile.lock` resolves.
- [ ] `pnpm parity:bump:dry-run` is run for each compared source above and its
      report committed.
- [ ] The owner is asked, with the reports in hand, whether a gem stops at the
      8.0.5.2 lock's version or waits and moves once, to the 8.1 lock's
      version, with the 8.1 upgrade, and whether dev-Gemfile-only gems
      (solid_queue, solid_cable) follow the rule at all. The answer is
      recorded in the RFC's Resolved list.
- [ ] One story per source that moves is filed in this RFC with
      `pnpm tasks new … --body-file`, smallest first, then one for the
      read-anchors together. Each names its target tag and commit SHA, its
      dry-run numbers, whether it needs a ledger or fits one PR, and a step
      retaking that source's pin floor before its flip.
- [ ] `deps` are wired with `tasks set-deps`: each on
      `flip-the-rails-ref-to-v8-0-5-1`, and none on another gem unless its
      gemspec requires it.

## Definition of done

This story bumps nothing.
