---
title: "trails: api:compare writes no rows for nine gem ports that test:compare measures"
status: ready
updated: 2026-11-06
rfc: "0136-trailmap"
cluster: packages-missing-data
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

At the latest synced commit (pr 9770), test:compare has rows for `did-you-mean`, `et-orbi`, `mini-magick`, `mini-mime`, `net-smtp`, `rack-session`, `rack-test` and `ruby-compat`, but api:compare has none. Most of these have a `rails_counterpart` in `package_meta`, so they are enrolled in api:compare's `SOURCES` and presumably carry `compareApi: false` or point at a gem source api:compare skips. Their `/packages/<name>` API tile is empty. The fix is in trails (`scripts/api-compare/config.ts`), with a test there. trailmap needs no change once the rows exist.

## Acceptance criteria

- Each package listed above has an `api_compare_stats` row on the first merged trails commit after the fix. Where a package cannot be compared, the reason is recorded in api-compare's config and shows in that package's `package_meta` description.
- A trails test asserts every package with test:compare rows is either enrolled in api:compare or explicitly excluded with a reason.
