---
title: "Drop dead Temporal.PlainTime arm from PostgreSQL quotedDate yearOf"
status: ready
updated: 2026-09-16
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#7813 narrowed `quoted_time` to `Type::Time::Value` / Time / TimeWithZone and dropped the `Temporal.PlainTime` arms from abstract `quote` / `typeCast`, matching `activerecord/lib/active_record/connection_adapters/abstract/quoting.rb` (`when Type::Time::Value then quoted_time`).

`packages/activerecord/src/connection-adapters/postgresql/quoting.ts` `yearOf` still carries `if (value instanceof Temporal.PlainTime) return 2000;`, and `TemporalDateLike` (abstract/quoting.ts) still lists `Temporal.PlainTime`. Nothing reaches `quotedDate` with a PlainTime any more. Rails' PostgreSQL `quoted_date` (`postgresql/quoting.rb:143-150`) reads `value.year` directly, with no per-type helper.

## Acceptance criteria

- Drop the `Temporal.PlainTime` arm from `yearOf` and from `TemporalDateLike`. Where the receiver allows it, converge `quotedDate` onto Rails' `value.year` read with no `yearOf` helper.
- PG quoting tests pass.
