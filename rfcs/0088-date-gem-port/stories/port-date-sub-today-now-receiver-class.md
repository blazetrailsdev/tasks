---
title: "port-date-sub-today-now-receiver-class"
status: done
updated: 2026-08-18
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6717
claim: "2026-08-18T19:47:46Z"
assignee: "port-date-sub-today-now-receiver-class"
blocked-by: null
closed-reason: null
---

## Context

`test_sub` (`vendor/date/test/date/test_date.rb:46-107`) is ported into
`packages/date/src/test-date.test.ts` except for two lines:

```ruby
assert_instance_of(DateSub, DateSub.today)
assert_instance_of(DateTimeSub, DateTimeSub.now)
```

RFC 0088's mapping table has `Date.today` / `DateTime.now` answer a
`Temporal.PlainDate` / `Temporal.PlainDateTime | Temporal.ZonedDateTime`
(`date.ts` `static today`, `static now`, each ending at `.toDate()` /
`.toDatetime()`), not a gem-shaped instance — so there is no receiver class
for them to carry, and MRI's `d_lite_s_alloc(klass)` under `rb_obj_class`
(`date_core.c:3789-3825`, `:8134-8236`) has no counterpart.

## Acceptance criteria

- [ ] Either the two statics answer the receiver's class (a gem-shaped
      instance), or the RFC 0088 mapping is confirmed as the reason they
      cannot and the story is closed with that citation.
- [ ] If they do, the two assertions are restored into `it("sub")` and the
      deviation note in its JSDoc is deleted.
