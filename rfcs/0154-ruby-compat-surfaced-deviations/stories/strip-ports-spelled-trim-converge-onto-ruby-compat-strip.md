---
title: "Converge Ruby .strip ports spelled .trim() onto ruby-compat strip"
status: draft
updated: 2026-10-02
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
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

Ruby `String#strip` (`vendor/ruby/v3.3.11/string.c:10020` `rb_str_strip`) removes only
leading and trailing NUL and ASCII whitespace (tab, LF, VT, FF, CR, space). JS `String#trim` also
removes NBSP (U+00A0), U+FEFF, U+2028/2029 and every Unicode space separator, and does not
remove NUL. So a `.strip` ported as `.trim()` alters input Ruby keeps:
`" yes ".strip` is unchanged in Ruby and `"yes"` after `trim()`.

trails#8372 added the faithful spelling: `strip(str)` exported from `@blazetrails/ruby-compat`
(`packages/ruby-compat/src/string/method-table.ts`, over the `LSTRIP` / `RSTRIP` regexes the
`STRING_METHOD_TABLE` already used), and converged the one site it touched
(`Thor::Shell::Basic#ask_simply`, `vendor/thor/v1.3.2/lib/thor/shell/basic.rb:339`). The
reviewer rejected "`.trim()` as elsewhere in the repo" as a justification, so every other
`.strip` port spelled `.trim()` is the same deviation.

Scale: the Rails lib trees of the ported gems plus Thor hold 50 `.strip`, 4 `.rstrip` and
1 `.lstrip` calls (`grep -rhoE "\.(strip|lstrip|rstrip)\b"` over
`vendor/rails/v8.0.2/{activesupport,activemodel,activerecord,actionpack,actionview,railties}/lib`
and `vendor/thor/v1.3.2/lib`). trails' `packages/*/src` (non-test) holds 148 `.trim()` calls;
only those whose Rails line is a `.strip` are in scope. Git-merge-tool's
`` `git config merge.tool`.rstrip `` (`shell/basic.rb:379`) is not ported yet and must use the
faithful spelling when it is.

`packages/trailties/src/thor/shell/terminal.ts:32` is NOT an instance: Ruby is
`` `stty size`.split[1].to_i `` (`shell/terminal.rb:32`) with no `strip`; its `.trim()` stands
in for whitespace `split`'s leading-separator handling and is a different question.

`lstrip` / `rstrip` have no ruby-compat export yet (only the `STRING_METHOD_TABLE` entries);
add each beside `strip`, with a `@noRailsEquivalent PERMANENT` receipt, only when a ported
call site needs it (ruby-compat rule 1).

## Acceptance criteria

- [ ] Every non-test `.trim()` / `.trimStart()` / `.trimEnd()` in `packages/*/src` whose Rails
      counterpart line is `.strip` / `.lstrip` / `.rstrip` calls ruby-compat's `strip` (or a
      newly exported `lstrip` / `rstrip`) instead. Each converted site is checked against its
      `vendor/` `file:line`.
- [ ] A `.trim()` with no Rails `.strip` behind it is left alone (or filed separately if it is
      itself a deviation).
- [ ] At least one regression test per package touched shows NBSP or U+FEFF surviving where
      Ruby keeps it, failing on the baseline.
- [ ] If the audit is larger than one PR, ship one package and file the rest per package.
