---
title: "activerecord: NullPool's trap raises NoMethodError on then/toJSON probes"
status: ready
updated: 2026-10-18
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 60
priority: 24
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced on trails#8786. Ruby's `NullPool`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:14-48`)
is an ordinary object, so `Kernel#then` (`vendor/ruby/v3.3.11/kernel.rb`, `Kernel#then`) is defined
on it and never reaches `method_missing`.

trails' `NullPool` constructor (`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts`)
returns a Proxy whose `get` trap now reads `KERNEL_METHODS` names through to the target, except the
names in `PROTOCOL_PROBES` (`then`, `catch`, `finally`, `toJSON`, `asymmetricMatch`, …), which still
raise `NoMethodError`. `connection-pool.trails.test.ts` ("raises NoMethodError for every send it has
no method for") pins the raise for `then`, `toJSON`, `asymmetricMatch` and `nodeType`. Root CLAUDE.md
§ "Ruby protocol methods with a different JS mechanism" says an unanswered name on a Proxy row reads
`undefined`; here it raises, and for `then` Ruby would answer.

## Acceptance criteria

- [ ] Decide what a JS protocol probe on a `NullPool` answers, against the rule in root CLAUDE.md
      (an unanswered name reads `undefined`), and make the trap and the test agree with it.
- [ ] `await pool` and `JSON.stringify({ pool })` on a pool-less adapter do not raise
      `NoMethodError`, or the reason they must is recorded as a receipt at the trap.

## Audit 2026-10-22

Still present: the trap reads `KERNEL_METHODS.has(prop) && !PROTOCOL_PROBES.has(prop)`
(`connection-adapters/abstract/connection-pool.ts:82`).
