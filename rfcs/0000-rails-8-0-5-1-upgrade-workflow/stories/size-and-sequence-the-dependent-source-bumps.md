---
title: "Dry-run each dependent source Rails 8.1.4 moves and file one bump story per source"
status: draft
updated: 2026-10-13
rfc: "0000-rails-8-0-5-1-upgrade-workflow"
cluster: post-flip
packages: [scripts, rack, rack-session, pg, sqlite3, trailties]
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

RFC § 1 "Dependent sources". Rails `v8.0.5.1`'s `Gemfile.lock` resolves five
compared sources past their pin in `vendor/sources.lock.json`: rack 3.1.14 →
3.2.1, rack-session 2.1.0 → 2.1.1, thor 1.3.2 → 1.4.0, sqlite3 2.6.0 → 2.7.3
and pg 1.5.9 → 1.6.2. Two read-anchors move too: minitest 5.27.0 → 6.0.0 and
rails-dom-testing 2.2.0 → 2.3.0. bcrypt-ruby, date, rack-test, i18n, globalid,
msgpack, mysql2, did_you_mean and ruby do not move. None of these has been
sized: the diffs measured on 2026-10-13 were against the versions the 8.1.4
lock resolves, which are later.

## Acceptance criteria

- [ ] Each tag is confirmed to exist upstream and to be what `Gemfile.lock`
      at `vendor/rails/v8.0.5.1/` resolves.
- [ ] `pnpm parity:bump:dry-run` is run for each of the five compared sources
      and its report committed.
- [ ] One story per source is filed in this RFC with `pnpm tasks new`,
      smallest first, then one for the two read-anchors together. Each names
      its target tag, its dry-run numbers, and whether it needs a ledger or
      fits one PR.
- [ ] Each story includes retaking that source's pin floor before its flip
      (thor has none).
- [ ] The owner is asked whether a gem should stop at the version the 8.0.5.1
      lock resolves or wait and move once, to the 8.1 lock's version, with
      the 8.1 upgrade. The answer is recorded in the RFC.

## Definition of done

This story bumps nothing.
