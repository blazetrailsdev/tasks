---
title: "DateTime's constructor fraction bounds ignore the offset and start positions argc counts"
status: done
updated: 2026-08-09
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6290
claim: "2026-08-09T18:49:36Z"
assignee: "datetime-constructor-fraction-bound-ignores-offset-and-start"
blocked-by: null
closed-reason: null
---

## Context

`num2int_with_frac` (`vendor/date/ext/date/date_core.c:3296-3303`) raises
`Date::Error, "invalid fraction"` when `argc > n` — a fraction is legal only in
the LAST argument SUPPLIED, and `argc` counts every position, `offset` and
`start` included.

PR #6285 ported that faithfully for the new `DateTime.jd` / `.ordinal` /
`.commercial` singleton builders (`packages/date/src/date.ts`), which take each
field as an optional parameter and test presence with `!== undefined`, ORing in
`offset` and `start`. The `DateTime` **constructor**
(`datetime_initialize`, `:7815-7848`) still computes its bounds the older way:

```ts
const [min, minFr] = num2intWithFrac(minute ?? 0, MINUTE_IN_SECONDS, second !== undefined);
```

— it ORs only the later fraction-bearing fields and ignores `offset` and
`start`. In Ruby the positions cannot be skipped, so passing an offset always
means `second` was passed too and the arms agree; in TS
`new DateTime(2008, 3, 1, 6, 0.5, undefined, "+09:00")` is expressible and
silently accepts the fraction MRI rejects at `argc == 7 > 5`.

## Converged shape

The constructor's three `argcGtN` arguments OR in every later position, exactly
as the three singleton builders in the same file now do:

```ts
minute !== undefined || second !== undefined || offset !== undefined || start !== undefined;
```

for the hour, and the matching suffix for the minute and the day.

## Acceptance criteria

- [ ] `new DateTime(2008, 3, 1, 6, 0.5, undefined, "+09:00")` raises
      `Date::Error, "invalid fraction"`, as `DateTime.new(2008, 3, 1, 6, 0.5, 0, "+09:00")`
      does in MRI.
- [ ] The same for an explicit `start` with no `offset`.
- [ ] The existing fraction tests in `date.trails.test.ts` still pass unchanged.
