---
title: "port-date-marshal-legacy-dump-arms"
status: closed
updated: 2026-08-18
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
closed-reason: "Superseded: the case 2 / case 3 arms and old_to_new / decode_day / div_day / div_df landed in PR #6710 alongside the rest of marshalLoad, so there is nothing left to carry."
---

## Context

`Date#marshalLoad` (`packages/date/src/date.ts`) ports `d_lite_marshal_load`
(`vendor/date/ext/date/date_core.c:7553-7625`) with only its `case 6` arm and
the `default:` raise. The C's `case 2` (1.6.x dumps) and `case 3` (1.8.x /
1.9.2 dumps) arms both go through `old_to_new` (`date_core.c:3105-3137`), which
needs `decode_day` (`:1101-1109`) and its `div_day` / `div_df` — none of which
are ported in `date.ts` yet. `Date.marshalDumpOld` (`d_lite_marshal_dump_old`,
`:7507-7526`, `NDEBUG`-gated) is the writer for the 3-element form.

Ported in PR for story `port-test-date-sub-class-propagation`, whose
`test_sub` only exercises the 6-element round trip.

## Acceptance criteria

- [ ] `decode_day`, `div_day`, `div_df` and `old_to_new` are ported.
- [ ] `marshalLoad` carries the C's `case 2` and `case 3` arms, including the
      `"fraction of offset is ignored"` / `"invalid offset is ignored"`
      warnings and the `"invalid day fraction"` raise.
- [ ] The unported-arms note in `marshalLoad`'s JSDoc is deleted.
