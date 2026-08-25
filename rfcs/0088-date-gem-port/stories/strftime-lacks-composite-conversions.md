---
title: "strftime is missing %T and the other composite/week-based conversions"
status: done
updated: 2026-08-07
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6193
claim: "2026-08-07T19:20:43Z"
assignee: "strftime-lacks-composite-conversions"
blocked-by: null
closed-reason: null
---

## Context

`packages/date/src/date.ts`'s `strftime` conversion table (the `switch (spec)`
at `date.ts:330-520`) covers
`%Y %C %y %m %d %e %j %F %x %A %a %B %b %h %u %w %H %k %I %l %M %S %L %N %s %p %P %z %Z %n %t %%`
and nothing else.

`vendor/date/ext/date/date_strftime.c` also handles the composite and
week-based specs that `date__strptime` already _parses_ on the way in —
notably `%T` (`date_strftime.c` `case 'T'` -> `"%H:%M:%S"`), plus
`%R`, `%r`, `%X`, `%c`, `%D`, `%v`, `%G`, `%V`, `%U`, `%W`, `%Q` and `%+`.

Surfaced in PR for `strptime-sec-fraction-numerator-is-a-number`: a round-trip
test written as `DateTime.strptime(s, "%FT%T.%N").strftime("%FT%T.%20N")`
parses fine and then emits the literal `%T` back, because the _input_ side has
`case "T"` (`date.ts:2342`) and the output side does not. The test was written
against `%H:%M:%S` instead; this story closes the actual gap.

`%F` and `%x` at `date.ts:366-370` are the shape to copy — they recur into
`strftime` with the expansion string, exactly as the C's `STRFTIME()` macro does.

## Acceptance criteria

- [ ] `strftime` handles every spec `date_strftime.c` does that
      `dateStrptimeInternal` already parses, `%T` first.
- [ ] Each arm cites its `date_strftime.c` line and is pinned by a case in
      `date.trails.test.ts` verified against a live `ruby -rdate -e`.
- [ ] `DateTime.strptime(s, "%FT%T.%N").strftime("%FT%T.%20N")` round-trips.
