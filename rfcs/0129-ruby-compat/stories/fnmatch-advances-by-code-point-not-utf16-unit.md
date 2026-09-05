---
title: "File.fnmatch advances by code point, as MRI's Inc/rb_enc_mbclen does"
status: done
updated: 2026-09-05
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 11
pr: 7518
claim: "2026-09-05T11:02:18Z"
assignee: "async-overrides-of-synchronous-rails-adapter-methods"
blocked-by: null
closed-reason: null
---

## Context

`File.fnmatch` (`packages/ruby-compat/src/file.ts`, landed in #7483) ports MRI's
`fnmatch` / `fnmatch_helper` / `bracket` (`vendor/ruby/dir.c:411,317,240`)
faithfully except for one thing: MRI advances both cursors a whole character at
a time, and the port advances them one UTF-16 code unit at a time.

MRI uses `Inc(s, send, enc)` and `rb_enc_precise_mbclen`
(`dir.c:353,371,378,390`) so that `?`, a `[...]` bracket, and an ordinary
literal each consume exactly one character. The port writes `s++` and
`pattern[p] === string[s]`, which is one UTF-16 code unit — so an astral
character (anything above U+FFFF, a surrogate pair in JS) is consumed as two.

Concretely, MRI answers `true` for `File.fnmatch("?", "\u{1F600}")` and the port
answers `false`, because `?` eats one half of the surrogate pair and the second
half is left unmatched. The same applies to `[\u{1F600}]` in `bracket`, whose
`memcmp(t1, s, r)` compares `r = rb_enc_mbclen` bytes (`dir.c:293`).

The deviation is stated in the JSDoc on `File.fnmatch` at the declaration; this
story is to remove it rather than keep explaining it. No call site is affected
today — `HashResolver#template_glob`
(`vendor/rails/actionview/lib/action_view/testing/resolvers.rb:26-30`) matches
ASCII template paths — which is why it was not blocking.

## Converged shape

Iterate by code point rather than code unit. `String.prototype.codePointAt(i)`
plus an advance of `cp > 0xffff ? 2 : 1` is the JS spelling of `Inc(s, send,
enc)`; the three sites are `fnmatch_helper`'s `'?'` arm, its `'['` arm, and its
ordinary-literal arm (`dir.c:353,371,384-390`), plus `bracket`'s `t1`/`t2`
single-character reads (`dir.c:262-272`). Keep MRI's names and branch order;
this is a change to how the cursors move, not to the control flow.

## Acceptance criteria

- [ ] `?`, `[...]` and an ordinary literal each consume one code point, not one
      UTF-16 code unit, in `packages/ruby-compat/src/file.ts`.
- [ ] The UTF-16 caveat is deleted from `File.fnmatch`'s JSDoc, since it no
      longer applies.
- [ ] `file.trails.test.ts` grows astral cases whose expected values are
      captured from MRI (`ruby` is on PATH), at minimum `fnmatch("?", "\u{1F600}")`,
      `fnmatch("[\u{1F600}]", "\u{1F600}")` and a `*`-plus-astral case; the
      existing 29 ASCII cases stay green.
- [ ] `pnpm parity:api:extra:gate` unchanged — ruby-compat is pinned at
      `novel: 0`, so no new public name.
