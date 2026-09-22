---
title: "Converge DelegateClass instanceof onto Ruby Class#=== (Time::Value caught by when-Time arms)"
status: draft
updated: 2026-09-22
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `DelegateClass(::Time)` (`vendor/ruby/lib/delegate.rb:394-411`) builds a subclass of `Delegator`, not of `Time`, so `Time === Type::Time::Value.new(t)` is false and a `case value when Time` arm does not match the wrapper. trails' `DelegateClass` (`packages/ruby-compat/src/delegate.ts`, `export function DelegateClass`) deliberately shares `superclass.prototype`, so `instanceof superclass` is TRUE.

This silently diverged in `ActiveRecord::ConnectionAdapters::MySQL::Quoting#type_cast` (`activerecord/lib/active_record/connection_adapters/mysql/quoting.rb:105`): the `when Time` arm caught `Type::Time::Value` (`activerecord/lib/active_record/type/time.rb:8`), so it never reached abstract `type_cast`'s `quoted_time` arm (`abstract/quoting.rb:103`), and MariaDB prepared-statement binds on TIME columns sent a full datetime. trails#7944 patched that one site with `!(value instanceof TimeValue)`, which is a per-call-site workaround for the delegator's semantics.

Other `instanceof RubyTime` arms that a `Type::Time::Value` can reach and that may have the same issue: `packages/activerecord/src/connection-adapters/abstract/quoting.ts:85,114,238,248,255,273`, `postgresql/quoting.ts:290`.

## Acceptance criteria

- Decide the converged shape: either `DelegateClass` stops answering `instanceof superclass` (matching Ruby's `Class#===`), with callers that relied on it migrated, or every `when Time`-mirroring arm that a delegator can reach is audited against its Rails `case` and fixed.
- If the delegator changes, remove the `!(value instanceof TimeValue)` guard in `mysql/quoting.ts` `typeCast`.
- A test showing `Type::Time::Value` binds quote as `quoted_time` on each adapter's `typeCast`.
