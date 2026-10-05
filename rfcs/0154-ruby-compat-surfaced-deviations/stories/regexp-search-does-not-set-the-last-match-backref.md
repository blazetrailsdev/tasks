---
title: "rb_reg_search does not set $~: only String#=~ writes the last-match backref, and $N has no reader"
status: draft
updated: 2026-10-05
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8544 added `lastMatchGetter()` (`$&`, `last_match_getter`,
`vendor/ruby/v3.3.11/re.c:1989`) to `packages/ruby-compat/src/string/method-table.ts`, for
`Thor::Arguments#parse_numeric` (`vendor/thor/v1.3.2/lib/thor/parser/arguments.rb:142-146`).
Its `$~` is a module-level `backref` that only `rbStrMatch` (`String#=~`) writes.

MRI sets `$~` in `rb_reg_search_set_match` (`re.c:1746-1783`: `rb_backref_set(Qnil)` on a
failed search at `:1750,1763`, `rb_backref_set(match)` at `:1783`), so every Regexp search
writes it: `String#match`, `match?` excepted, `scan`, `sub`, `gsub`, `index`, `=~` on a Regexp
receiver, `Regexp#match`. ruby-compat's `rbRegSearch`
(`packages/ruby-compat/src/string/support.ts:195`) is that function's port and writes nothing.
So `"a" =~ /a/; "b".match(/x/); $&` is `nil` in MRI and `"a"` in ruby-compat.

There are also no `$1`..`$9` / `$~` readers (`match_getter`, `rb_reg_nth_match`,
`re.c:1894-1990`), which is why `Thor::Arguments#no_or_skip?`
(`arguments.rb:59-62`, `arg =~ /re/; $2`) is ported as a local `exec` reading `match?.[2]`
(`packages/trailties/src/thor/parser/arguments.ts`, `isNoOrSkip`) rather than line for line.

## Acceptance criteria

- [ ] `rbRegSearch` writes the backref on every search, nil on failure, as
      `rb_reg_search_set_match` does; `rbStrMatch` stops writing its own.
- [ ] ruby-compat exports the `$~` and `$N` readers, each with a `@noRailsEquivalent PERMANENT`
      receipt and `re.c` citation, and a `.trails.test.ts` case per reader checked against MRI.
- [ ] `isNoOrSkip` is `matchOperator(arg, re)` then the `$2` reader, two statements as in
      `arguments.rb:59-62`.
