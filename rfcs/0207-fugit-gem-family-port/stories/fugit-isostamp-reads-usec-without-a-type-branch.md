---
title: "fugit isostamp reads t.usec without a Time/EoTime branch"
status: in-progress
updated: 2026-10-26
rfc: "0207-fugit-gem-family-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9316
claim: "2026-10-25T23:24:49Z"
assignee: "differential-fuzz-fugit-family-against-ruby"
blocked-by: null
closed-reason: null
---

## Context

`Fugit.isostamp` (`vendor/fugit/v1.11.1/lib/fugit/misc.rb:10-21`) writes
`sprintf('.%06d', t.usec)`, where `t` is a `Time` (`time || Time.now`) or an
`EtOrbi::EoTime`. The port (`packages/fugit/src/misc.ts`, `isostamp`) branches
`t instanceof Time ? t.usec : t.usec()`. The reason is that `@blazetrails/date`'s
`Time#usec` is a getter (`packages/date/src/time.ts`, `get usec()`), while
`EoTime#usec` is a method (`packages/et-orbi/src/time.ts`, `usec()`). Ruby has
one `usec` send and no branch.

## Acceptance criteria

- [ ] `Time#usec` and `EoTime#usec` share one spelling, so `isostamp` is
      `format(".%06d", t.usec…)` with no `instanceof` arm, exactly as
      `misc.rb:16` reads.
- [ ] The spelling is converged on whichever side the repo's
      zero-arg-reader rule (CLAUDE.md, "Generated attribute readers are
      properties") and the date and et-orbi ports settle. Callers of the
      changed side are updated.
