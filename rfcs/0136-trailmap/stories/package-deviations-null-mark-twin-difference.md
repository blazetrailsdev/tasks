---
title: "trailmap: /packages/:name/deviations renders a mark with null value, matched and total differently in trails and Rails"
status: ready
updated: 2026-11-06
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rails/script/tandem /packages/activerecord/deviations`, run against `stats-job.db`, reports DIFF on main (found while working on trailmap#123). A `package_mark_stats` row whose `value`, `matched` and `total` are all NULL renders differently in the two apps:

- trails, `app/controllers/packages-controller.ts` (`deviations`, the `latest:` line): `` `${last.matched} / ${last.total}` `` gives `<strong>null / null</strong>`.
- Rails, `rails/app/controllers/packages_controller.rb` (`deviations`, `MarkRow.new(... latest:)`): `"#{last.matched} / #{last.total}"` gives `<strong>/</strong>`.

Neither output is useful. Expected shape: the two apps render the same text, such as `—`, for a mark with no value.

## Acceptance criteria

- [ ] Both apps render the same placeholder for a mark whose value, matched and total are all NULL.
- [ ] A test on each side covers that row.
- [ ] `script/tandem /packages/activerecord/deviations` reports SAME.
