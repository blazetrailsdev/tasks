---
title: "Time#to_date goes through the public Date constructor, not d_simple_new_internal's seat"
status: done
updated: 2026-08-10
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6331
claim: "2026-08-10T12:06:36Z"
assignee: "converge-time-to-date-onto-d-simple-new-internal"
blocked-by: null
closed-reason: null
---

## Context

Sibling of `converge-time-to-datetime-seat-and-bignum-year-in-to-time` (#6320),
which converged `Time#toDatetime` onto the seat. `Time#toDate` still has the
divergence that story removed from its neighbour.

`time_to_date` (`vendor/date/ext/date/date_core.c:8872-8892`) is:

```c
y = f_year(self);
m = FIX2INT(f_mon(self));
d = FIX2INT(f_mday(self));
decode_year(y, -1, &nth, &ry);
ret = d_simple_new_internal(cDate, nth, 0, GREGORIAN, ry, m, d, HAVE_CIVIL);
get_d1(ret);
set_sg(dat, DEFAULT_SG);
```

The port (`packages/date/src/time.ts`, `toDate`) is one line:

```ts
return new Date(this.year, this.mon, this.day, Date.GREGORIAN).newStart().toDate();
```

So it drops `decode_year` entirely — the public `Date` constructor re-derives
`nth` through `validGregorianP` / `validCivilP` and re-validates a civil date
the C has already established is buildable, which is the exact thing
`d_simple_new_internal` exists to skip (`date_core.c:3036-3050`: "writes an
already-resolved day straight into a fresh `SimpleDateData` and validates
nothing"). `newStart()` then rebuilds a second object where the C mutates one
field.

## Converged shape

Mirror the `toDatetime` convergence next door. `set_sg`
(`date_core.c:5787-5800`) runs `get_s_jd(x)` and `clear_civil(x)` BEFORE
storing the new `sg` on the simple arm, so the `HAVE_CIVIL` the flags word
names is resolved to a day under the `GREGORIAN` the build used and discarded
— exactly the reasoning recorded at `Time#toDatetime`'s call site. That makes
the converged body:

```ts
const y = this.year;
const m = this.mon;
const d = this.day;

const [nth, ry] = decodeYear(y, -1);

return new Date(SEAT, nth, cCivilToJd(ry, m, d, Date.GREGORIAN), Date.ITALY).toDate();
```

`SEAT`, `decodeYear` and `cCivilToJd` are already exported from `./date.ts` by
PR 6320 exports these, so this needs no new export.

## Acceptance criteria

- [ ] `Time#toDate` builds through `d_simple_new_internal`'s seat with the
      `decode_year` the C calls, not through the public `Date` constructor.
- [ ] `Time.utc(1582, 10, 13).to_date` still reads `1582-10-03` — the
      `GREGORIAN`-then-`set_sg` reading `test_date_conv.rb`'s
      `test_to_date__from_time` asserts, already ported in
      `packages/date/src/test-date-conv.test.ts`.
- [ ] No new export from `./date.ts`.
