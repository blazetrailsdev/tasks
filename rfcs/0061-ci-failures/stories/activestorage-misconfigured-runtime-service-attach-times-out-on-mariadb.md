---
title: "activestorage-misconfigured-runtime-service-attach-times-out-on-mariadb"
status: ready
updated: 2026-11-24
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# activestorage: "raises error when misconfigured service is defined at runtime" times out on MariaDB

## Context

`packages/activestorage/test/models/attached/one.test.ts:889` timed out at the 5000ms default on
the Active Record MariaDB Tests (1) shard (trails#10645, run 45213972628, job 137830342638), on a PR
that touched only `packages/sqlite3`. The test attaches `video.mp4` to a `becomes(ExtraAttached)`
record whose `service: () => "unknown"` lambda is resolved at attach time and must reject with
`Cannot configure service "unknown" for ...#featuredVlog`. It took 5768ms, while its siblings take
under 130ms. So the attach path probably waits on work (analysis/upload of the video, or a
connection checkout on the MariaDB lane) before it reaches the service lookup that raises.

Rails: `vendor/rails/v8.0.5.2/activestorage/test/models/attached/one_test.rb`
("raises error when misconfigured service is defined at runtime"), with
`activestorage/lib/active_storage/attached/model.rb` resolving the service lambda in `has_one_attached`.

## Acceptance criteria

- [ ] Root-cause why the attach takes more than 5s on MariaDB before raising, and fix it so the raise happens where Rails' does (before any upload work).
- [ ] The test passes reliably on the MariaDB lane without raising its timeout.
