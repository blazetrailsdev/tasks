---
title: "port-test-switch-hitter-construction-rest"
status: closed
updated: 2026-08-10
rfc: "0088-date-gem-port"
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
closed-reason: "Superseded by PR #6317, which ported all ten scoped TestSH tests rather than the five it first shipped: test_jd/test_ordinal/test_commercial read back through the Temporal seat's own readers, test_fractional needed Date.jd/.ordinal/.commercial/.civil to run their argument through num2num_with_frac/num2int_with_frac and add_frac (date_core.c:3374, :3441, :3524, :3625), and test_strftime needed Errno::ERANGE off date_strftime_alloc's 1024*flen bound (date_core.c:7081-7097, date_strftime.c:579) plus Date.today (date_s_today, :3789-3826). test_switch_hitter.rb is 10/18 credited, the whole of lines 7-299."
---

## Context

Split out of `port-test-switch-hitter-construction` (PR TBD), which ported
`TestSH`'s `test_new`, `test_canon24oc`, `test_zone`, `test_to_s` and
`test_inspect` into `packages/date/src/test-switch-hitter.test.ts`, and with
them `Date`'s fractional-`mday` constructor arm (`date_core.c:3524`,
`:3557`'s `add_frac`), `Date#strftime`'s `"%Y-%m-%d"` default
(`d_lite_strftime`, `date_core.c:7245-7249`) and `DateTime#strftime`'s
`"%Y-%m-%dT%H:%M:%S%:z"` one (`dt_lite_strftime`, `:8721-8726`).

Five tests of the file's first half are still missing, all blocked on the same
seam rather than on the assertions themselves:

- `test_jd`, `test_ordinal`, `test_commercial` (`test_switch_hitter.rb:69-186`)
  read `#mon`/`#mday`/`#hour`/`#offset`/`#yday`/`#cwyear` back off
  `Date.jd` / `.ordinal` / `.commercial` and their `DateTime` counterparts.
  Those statics answer the `Temporal` seat (RFC 0088, `vendor/sources.ts:212-221`),
  which has none of those readers, and there is no gem-shaped spelling of them
  the way `Date.new` is the gem-shaped spelling of `Date.civil`. Porting these
  needs a decision on how a gem test reaches the gem-shaped object for a static
  that is not also a constructor — NOT a converge-the-return-type change.
- `test_fractional` (`:187-260`) additionally needs `Date.jd` /
  `DateTime.jd` / `.ordinal` / `.commercial` to accept a `Float`- or
  `Rational`-shaped argument through `num2num_with_frac`
  (`date_core.c:3286-3294`); `Date.jd` is typed `number | bigint` today and
  truncates nothing.
- `test_strftime` (`:290-299`) asserts `Errno::ERANGE` out of
  `Date.today.strftime('%100000z')` and `Date.new(1 << 10000).strftime('%Y')`,
  and the `'%s'` / `'%Q'` epoch conversions for `Date.new(1850)`. The port has
  no `Errno::ERANGE` and `date_strftime.c`'s width bound is not ported.

`test_canon24oc` (`:262-275`) is credited but partial: only the
`DateTime.new(2001,2,2,24)` arm is ported, since the other three go through the
`Temporal`-answering statics above. Finishing it belongs with `test_jd` /
`test_ordinal` / `test_commercial`.

## Acceptance criteria

- [ ] `test_jd`, `test_ordinal`, `test_commercial`, `test_fractional` and
      `test_strftime` are ported into
      `packages/date/src/test-switch-hitter.test.ts` under their Ruby names,
      and `pnpm parity:test --package date` credits them.
- [ ] `test_canon24oc`'s three remaining arms are restored.
- [ ] No `Temporal` return is converged back to a Ruby-shaped one to silence an
      assertion-value mismatch (`vendor/sources.ts:212-221`) — the gate is how
      a gem test reaches the gem-shaped object, not what the statics answer.
- [ ] Real failures are fixed in `packages/date/src`, not by adjusting the test.
