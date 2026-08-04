---
title: "i18n-date-subx-cb-decomposition"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6092
claim: "2026-08-04T20:56:04Z"
assignee: "i18n-date-subx-cb-decomposition"
blocked-by: null
closed-reason: null
---

## Context

`date_parse.c` `subx` (`date-3.4.1/ext/date/date_parse.c:318-337`) is
`subx(str, rep, pat, hash, cb)`: it runs the match itself, splices `rep` over
it, and dispatches to the sub-parser's `_cb`. Every sub-parser is one
`SUBS(str, pat, parse_X_cb)` line (`date_parse.c:340-343`) over that.

`packages/i18n/src/date.ts` ports `subx` as `subx(str, m)` — the splice half
only — because most ported sub-parsers inlined their `_cb` body rather than
extracting it (`parseIso`, `parseSla`, `parseDot`, `parseYear`, `parseMon`,
`parseMday`, `parseJis`, `parseVms11`/`12`, `parseIso21`-`26`). With no `_cb`
to hand it, `subx` cannot take one. `parseEu`, `parseUs`, `parseDdd`,
`parseTime` and `parseFrag` DO have their `_cb` and could pass it today.

Introduced by PR #6085 (which ported `subx`'s removal so `parse_frag` has a
leftover to read); the missing `_cb` decomposition predates it (PR #6075).

## Acceptance criteria

- Each sub-parser named above extracts its `date_parse.c` `_cb` under the
  Rails name (`parse_iso_cb`, `parse_sla_cb`, …), one Rails method to one TS
  function, as `parseEuCb` / `parseUsCb` / `parseDddCb` already are.
- `subx` takes `date_parse.c:318-337`'s parameters — `(str, rep, pat, hash,
cb)` — running the match and dispatching, and every sub-parser body reduces
  to the one `SUBS` line.
- `s3e` stays `s3e(hash, y, m, d, bc)` (`date_parse.c:80-81`), called from
  the `_cb`s that call it in C.
- No regression in `packages/i18n/src/date.trails.test.ts`.
