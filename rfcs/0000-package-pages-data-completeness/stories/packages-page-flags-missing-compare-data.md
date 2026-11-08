---
title: "trailmap (repo blazetrailsdev/trailmap): after each sync, report packages with a counterpart but no api or tests rows"
status: draft
updated: 2026-11-07
rfc: "0000-package-pages-data-completeness"
cluster: trailmap-checks
packages: []
deps: [sources-tests-excluded-reason]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

This story lives in the trailmap repo. On 2026-11-07 the page showed "no data"
for 11 packages, from four different causes: a sync parser regex, NULL
`compare_keys`, `compareTests: false`, and a missing vendor source. Nothing
reported any of them. `PackageMeta#compareKeys()`
(`app/models/package-meta.ts:28`) and `ratioFor` in
`app/controllers/packages-controller.ts` already compute what each tile reads.
trailmap#127 already mails a failed sync.

## Acceptance criteria

- [ ] After a sync, a check lists every `package_meta` row at the latest
      commit where `rails_counterpart` is non-NULL, there are no
      `api_compare_stats` or `test_compare_stats` rows under its compare keys,
      and the description carries no `Not in parity:api:` /
      `Not in parity:test:` reason. A non-empty list is mailed the way a failed
      sync is.
- [ ] A test seeds one package with each shape (complete, missing api with no
      reason, missing tests with a reason) and asserts that only the
      no-reason one is reported.
- [ ] The check runs against a fixture of the 2026-11-07 snapshot, which has
      no api rows for did-you-mean, et-orbi, mini-magick, mini-mime, net-smtp,
      rack-session, rack-test, solid-cable and solid-queue, and NULL
      `compare_keys` for actionpack. It reports exactly those 10 packages.
- [ ] The PR lands in blazetrailsdev/trailmap, and this story is closed with
      `tasks done <id> --pr trailmap#N`.
