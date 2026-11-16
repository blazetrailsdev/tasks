---
title: "activesupport notifications and log subscribers typed without any"
status: draft
updated: 2026-11-16
rfc: "0000-activerecord-actionpack-type-polish"
cluster: type-polish-neighbours
packages: [activesupport]
deps: [type-polish-count-double-casts]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/lib/log-subscriber.ts` (9 hits), `subscriber.ts`
(6), `notifications.ts` (6) and the tagged-logging casts
(`TaggedFormatter`, 3) carry `any` payloads. Every `ActiveRecord::LogSubscriber`
and `ActionController::LogSubscriber` inherits them. Rails:
`active_support/log_subscriber.rb`, `subscriber.rb`, `notifications.rb`,
`tagged_logging.rb`.

## Acceptance criteria

- [ ] Combined hits in those files fall by at least 60%.
- [ ] `Notifications::Event#payload` and subscriber callbacks take
      `Record<string, unknown>` (or a generic payload) instead of `any`.
- [ ] Subclass log subscribers in activerecord and actionpack still
      typecheck with no new cast.
