---
title: "tzinfo: split lib/index.ts into one file per lib/tzinfo/*.rb so parity:api pairs it"
status: in-progress
updated: 2026-11-09
rfc: "0223-package-layout-mirrors-a-rails-gem"
cluster: null
packages: ["tzinfo"]
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: trails#9920
claim: "2026-11-09T15:20:25Z"
assignee: "establish-connection-reads-database-url-set-after-boot"
blocked-by: null
closed-reason: null
---

## Context

trails#9825 enrolled tzinfo in `parity:api`, and it scores 0 of 371 methods. The whole port is one file, `packages/tzinfo/lib/index.ts`, while the gem spreads its classes across `vendor/tzinfo/v2.0.6/lib/tzinfo/*.rb` (`timezone.rb`, `data_timezone.rb`, `linked_timezone.rb`, `timezone_period.rb`, `offset_timezone_period.rb`, `transitions_timezone_period.rb`, `timezone_offset.rb`, `timezone_proxy.rb`, `country.rb`, `data_source.rb`, …). `parity:api` pairs by file, so nothing in it can match.

## Converged shape

One TS file per `.rb` under `packages/tzinfo/lib/tzinfo/`. Each class (`TZInfo::Timezone`, `TZInfo::TimezonePeriod`, `TZInfo::TimezoneOffset`, …) lives in the file that mirrors its `.rb`, with the gem's public method names. The Intl-backed data source stays behind a `DataSource` that mirrors `data_source.rb`.

## Acceptance criteria

- [ ] `pnpm parity:api --package tzinfo` matches every method the stand-in already implements, in its mirrored file.
- [ ] `activesupport`'s imports of tzinfo still resolve.
