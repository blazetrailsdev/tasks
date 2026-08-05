---
title: "Date._strptime / Date.strptime: the %s and %Q that produce the :seconds frag"
status: draft
updated: 2026-08-05
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #6112 ported `rt_rewrite_frags` (date-3.4.1 `ext/date/date_core.c:3839-3872`)
into `rtRewriteFrags` in `packages/i18n/src/date.ts`. It expands a `:seconds`
frag into `:jd` + `:hour`/`:min`/`:sec`/`:sec_fraction`.

**Nothing produces a `:seconds` frag in trails.** `date__parse` never sets one
(verified against ruby 3.3.11: `Date._parse("@1000000000")` answers
`{:year=>1000, :mon=>0, :mday=>0, :hour=>0}`). The only producers are
`Date._strptime`'s `%s` (seconds since the epoch) and `%Q` (milliseconds),
`date_strptime.c` — and `Date._strptime` / `Date.strptime`
(`date_core.c` `date_s__strptime` / `date_s_strptime`, registered at
`date_core.c:9694-9695`) are not ported at all.

So the rewrite step is currently reachable only from the regression test, which
drives `dNewByFrags` with the frag directly
(`packages/i18n/src/date.trails.test.ts`, "expands a seconds frag into a jd and
a time of day, as rt_rewrite_frags does").

The date gem source is NOT vendored (C stdlib). On this host it reads at
`~/.asdf/installs/ruby/3.3.11/lib/ruby/gems/3.3.0/gems/date-3.4.1/ext/date/`;
`gem contents date` prints nothing because `date` is a default gem.

## Converged shape

`Date._strptime(str, format)` and `Date.strptime(str, format = '%F')` ported
against `date_strptime.c`'s `date__strptime`, at least far enough that `%s` and
`%Q` set the `:seconds` frag `rtRewriteFrags` already knows how to expand.

## Acceptance criteria

- [ ] `Date._strptime` answers the frag Hash ruby 3.3.11 answers for the
      directives ported, verified against the interpreter.
- [ ] `%s` and `%Q` reach `rtRewriteFrags` through `Date.strptime`.
- [ ] Coverage in `date.trails.test.ts` (`::Date` is stdlib — no Rails test to
      mirror).
