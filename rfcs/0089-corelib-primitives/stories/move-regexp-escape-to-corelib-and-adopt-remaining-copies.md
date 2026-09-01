---
title: "regexpEscape moves to corelib and the five remaining private copies adopt it"
status: closed
updated: 2026-08-31
rfc: "0089-corelib-primitives"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "superseded by 0129-ruby-compat/move-regexp-escape-to-ruby-compat"
---

## Context

PR #7169 collapsed the eight private copies of `Regexp.escape` that sat behind
Rails call sites into one exported `regexpEscape`
(`packages/activesupport/src/core-ext/regexp.ts`), and mapped Ruby `escape` to
that single name in `CORE_LIBRARY_ALIASES`
(`scripts/api-compare/enumerable-idioms.ts`).

Two things are left over.

**The home is provisional.** `Regexp.escape` is a Ruby interpreter primitive
(`re.c` `rb_reg_s_quote`), not a Rails method. It lives in `core-ext/regexp.ts`
only because that path is the file-placement counterpart of
`active_support/core_ext/regexp.rb`, which is what lets its
`@noRailsEquivalent PERMANENT` receipt be SCORED rather than vanish in an
unmatched file. Its real home is the `corelib` package this RFC proposes —
same move as `move-range-core-and-succ-to-corelib` and
`move-tempfile-and-tmpname-to-corelib`.

**Five copies remain**, all in files with no Rails call site, so #7169 left them
alone rather than widen its scope:

- `packages/activerecord/src/support/quote-regex.ts:27` (exported; used across
  `batches.test.ts` and others)
- `packages/activerecord/src/support/run-token.ts:23`
- `packages/activerecord/src/associations.test.ts:39`
- `packages/trailties/src/generators/trails-actions.ts:191`
- `scripts/mysql-grant-namespaces.test.ts:36`

Five copies of one primitive is how the eight-copy drift #7169 just paid for
started, and `src/support/**` sits outside both compare populations, so nothing
measures it.

## Acceptance criteria

- `regexpEscape` moves to `corelib` with the rest of this RFC's primitives, and
  `activesupport` re-exports or imports it so no call site changes meaning.
- The five remaining copies are deleted and their call sites import the one
  function; `packages/activerecord/src/support/quote-regex.ts` keeps
  `quoteTableName` and stops exporting an escape of its own.
- The escape set stays the documented SUBSET of MRI's — MRI escapes `-`, `#`
  and whitespace, and `\-` / `\#` / a backslash-space pair are invalid identity escapes under a
  `u`-flagged JS pattern, which `ParameterFilter#precompileFilters` builds. The
  pin in `core-ext/regexp-ext.trails.test.ts` moves with the function.
- `CORE_LIBRARY_ALIASES` still maps `escape` to exactly one name.
