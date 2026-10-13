---
title: "Dry-run each dependent source Rails 8.1.4 moves and file one bump story per source"
status: draft
updated: 2026-10-13
rfc: "0000-rails-8-1-upgrade-workflow"
cluster: post-flip
packages: [scripts, rack, rack-session, bcrypt, pg, sqlite3, trailties]
deps: [flip-the-rails-ref-to-v8-1-4]
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

RFC § 1. Rails `v8.1.4`'s `Gemfile.lock` resolves six compared sources past
their pin in `vendor/sources.lock.json`: rack 3.1.14 → 3.2.6 (23 lib files
+976/-683, 457 pins), rack-session 2.1.0 → 2.1.2 (4 files +357/-126, 57
pins), thor 1.3.2 → 1.5.0 (8 files +97/-21, 0 of 367 pairs pinned), sqlite3
2.6.0 → 2.9.4 (3 files, 115 pins), pg 1.5.9 → 1.6.3 (6 files) and bcrypt-ruby
3.1.20 → 3.1.22 (1 file). Three read-anchors move too: minitest 5.27.0 →
6.0.6, rails-dom-testing 2.2.0 → 2.3.0, date 3.4.1 → 3.5.1. rack-test, i18n,
globalid, msgpack, mysql2, did_you_mean and ruby do not move.

## Acceptance criteria

- [ ] Each tag is confirmed to exist upstream and to be what `Gemfile.lock`
      at `vendor/rails/v8.1.4/` resolves.
- [ ] `pnpm parity:bump:dry-run` is run for each of the six compared sources
      and its tables recorded.
- [ ] One story per source is filed in this RFC with `pnpm tasks new`, in the
      order bcrypt-ruby, sqlite3, pg, thor, rack-session, rack, then one for
      the three read-anchors together. Each names its target tag, its dry-run
      numbers, and whether it needs a ledger or fits one PR.
- [ ] Each story includes retaking that source's pin floor before its flip
      (thor has none).
- [ ] The bcrypt-ruby bump is flagged as the rehearsal of the single-PR path.

## Definition of done

This story bumps nothing.
