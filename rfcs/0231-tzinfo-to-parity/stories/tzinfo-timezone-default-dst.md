---
title: "tzinfo-timezone-default-dst"
status: draft
updated: 2026-11-21
rfc: "0231-tzinfo-to-parity"
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

## Context

`Timezone.default_dst` / `default_dst=` (`vendor/tzinfo/v2.0.6/lib/tzinfo/timezone.rb`, `@@default_dst = nil` and its class accessors) is unported. `period_for_local(local_time, dst = Timezone.default_dst)` (`timezone.rb:494`), `local_to_utc`, `local_time` / `local_datetime` / `local_timestamp` default `dst` to it. trails' `Timezone#periodForLocal` and `#localToUtc` (`packages/tzinfo/lib/timezone.ts`) default `dst` to `null`.

## Acceptance criteria

- [ ] `Timezone.defaultDst` / `setDefaultDst` ported at the Rails names, with `tc_timezone.rb`'s default_dst tests.
- [ ] Every `dst = Timezone.default_dst` parameter defaults to `Timezone.defaultDst`.
