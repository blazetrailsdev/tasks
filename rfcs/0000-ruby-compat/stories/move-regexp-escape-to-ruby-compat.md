---
title: "Regexp.escape moves to ruby-compat and the three private escapeRegExp copies adopt it"
status: draft
updated: 2026-08-29
rfc: "0000-ruby-compat"
cluster: fidelity
packages: ["ruby-compat", "activesupport", "activerecord", "trailties", "actionpack", "actionview"]
deps: ["ruby-compat-package-skeleton"]
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The primitive the maintainer named explicitly, and the one the tooling has
already documented as a problem.

Canonical implementation: `packages/activesupport/src/core-ext/regexp.ts:18`
`regexpEscape`, ported from `re.c` `rb_reg_s_quote` and tagged
`@noRailsEquivalent PERMANENT`. Its JSDoc (`:11-17`) records a real and
deliberate divergence — it escapes the JS metacharacter SUBSET, because MRI also
escapes `-`, `#` and whitespace and `\-` / `\#` / `\␣` (backslash-space) are invalid identity
escapes under a `u`-flagged JS pattern, which
`ParameterFilter#precompileFilters` builds. **Carry that comment across
verbatim.** It is the justification for the body being what it is.

Three byte-identical private copies, all spelled `escapeRegExp`, all
`s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")`:

- `packages/activerecord/src/support/quote-regex.ts:27`
- `packages/activerecord/src/support/run-token.ts:23`
- `packages/trailties/src/generators/trails-actions.ts:191`

Existing consumers of the canonical export (these change only their import
path): `activesupport/src/parameter-filter.ts:86,176`,
`activesupport/src/inflector.ts:379`,
`activesupport/src/testing/deprecation.ts:38`,
`activesupport/src/transliterate.ts:76`,
`activesupport/src/cache/store.ts:800`,
`activesupport/src/number-helper/number-to-rounded-converter.ts:53`,
`actionview/src/helpers/text-helper.ts:139,176`,
`actionpack/src/action-dispatch/middleware/host-authorization.ts:211,213`.

`scripts/api-compare/enumerable-idioms.ts:78-89` already holds
`CORE_LIBRARY_ALIASES = new Map([["escape", ["regexpEscape"]]])`, and its comment
states the intent this story delivers: _"One name, not a list of the spellings
that happened to be in the tree: an alias list would ratify the divergence this
entry exists to make visible, and a body that escapes under some other name
should still flag."_ Three bodies escape under another name and nothing flags.
This story is what makes the comment true.

**Prior art — read it first.** RFC 0126's
`converge-regexp-escape-call-gate-verdict` (done, PR #7169) is the direct
predecessor: it converged **eight** private copies across activesupport,
actionpack and actionview onto the single `core-ext/regexp.ts` export and added
the `CORE_LIBRARY_ALIASES` entry. Its own closing note says _"`regexpEscape` is a
Ruby interpreter primitive, so its eventual home is the `corelib` package
proposed by RFC 0089 (postponed). `core-ext/regexp.ts` is where it can live today
and still be measured."_ This story is that eventual home. The three copies left
(activerecord ×2, trailties ×1) were outside that story's declared packages,
which is why they survived — and why a name-based lint, not another sweep, is
what stops the fourth.

It also pinned the MRI-subset escape set with a `.trails.test.ts` specifically so
it would not be "fixed" to MRI-exact later. **That test moves with the code and
keeps its name.**

Note `quote-regex.ts` is otherwise an adapter-dispatch module; `escapeRegExp`
is an unrelated passenger in it and simply leaves.

## Acceptance criteria

- `regexpEscape` lives at `packages/ruby-compat/src/regexp.ts` (or the file the
  package's layout settles on), with the JS-subset divergence comment carried
  over intact and a `vendor/ruby/re.c:LINE` citation for `rb_reg_s_quote` added.
- `activesupport/src/core-ext/regexp.ts` becomes a re-export shim so
  `@blazetrails/activesupport`'s public surface is unchanged; the
  `activesupport/src/index.ts` export keeps working.
- All three private `escapeRegExp` copies deleted and their call sites import
  `regexpEscape` from `@blazetrails/ruby-compat`.
- No behaviour change: the escaped character set is exactly today's.
- The three `escapeRegExp` rows in the
  `no-ruby-compat-reimplementation` exclude JSON are deleted (or, if that
  story has not landed, this story's PR body records the three rows it will be
  seeded without).
- `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args`,
  `parity:api:extra` show no new rows; `pnpm parity:api:extra --package
ruby-compat` reports exactly the one added export.
- Test files for the moved code move with it; `activesupport`'s
  `core-ext/regexp-ext.test.ts` / `regexp-ext.trails.test.ts` keep their names
  (test names are how `parity:test` matches — never rename).
