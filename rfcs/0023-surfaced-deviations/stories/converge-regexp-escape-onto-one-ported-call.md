---
title: "Converge Regexp.escape onto one ported call"
status: closed
updated: 2026-08-30
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "done-by-#7169: the seven baseline rows it names were converged there, and its stated home (RFC 0089 corelib, postponed) is superseded by RFC 0129 — Regexp.escape now lives at packages/ruby-compat/src/regexp.ts (PR #7237)"
---

## Context

PR #7166 ported `ActiveSupport::FileUpdateChecker`, whose private `escape`
(`vendor/rails/activesupport/lib/active_support/file_update_checker.rb:146-148`)
put the call name `escape` into the ported-call population for the first time.
That surfaced seven PRE-EXISTING divergences: Ruby bodies calling
`Regexp.escape` whose TS ports do the same escaping under a different name, so
the call-set gate scores the Rails call as omitted. All seven were baselined by
PR #7166 with a shared reason; the rows are the debt.

| baseline row                                                                    | Ruby call site                                 | TS spelling                                          |
| ------------------------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------- |
| `activesupport/cache.json` `key_matcher`                                        | `cache.rb:1027`                                | `escapeRegExp` (`cache/store.ts:173`)                |
| `activesupport/inflector.json` `const_regexp`                                   | `inflector/methods.rb:360`                     | `regexpEscape` (`inflector.ts:386`)                  |
| `activesupport/number-helper/number-to-rounded-converter.json` `format_number`  | `number_helper/number_to_rounded_converter.rb` | `escapeRegExp` (`number-to-rounded-converter.ts:63`) |
| `activesupport/parameter-filter.json` `compile_filters!` / `precompile_filters` | `parameter_filter.rb`                          | `escapeRegexp` (`parameter-filter.ts:261`)           |
| `activesupport/testing/deprecation.json` `assert_deprecated`                    | `testing/deprecation.rb:40`                    | `escapeRegExp` (`testing/deprecation.ts:38`)         |
| `activesupport/transliterate.json` `parameterize`                               | `inflector/transliterate.rb:135`               | inline `.replace(/[.\*+?^${}()                       | [\]\\\-#\s]/g, "\\$&")` (`transliterate.ts:75`) |

Each site is a real, correct escape — the divergence is that four file-local
helpers and one inline replace stand where Ruby has one core call, so no ported
`escape` is reachable from any of them.

## Converged shape

One `regexpEscape` — Ruby's `Regexp.escape` is a core-library method, so it
belongs wherever the corelib primitives land (RFC 0089) rather than being
redefined per file. Each of the six files calls that one function; the five
duplicate local definitions and the inline replace are deleted. The call then
resolves to a single ported name at every site.

## Acceptance criteria

- One shared `Regexp.escape` port; the five file-local `escapeRegExp` /
  `escapeRegexp` / `regexpEscape` definitions and `transliterate.ts`'s inline
  replace are gone.
- All seven `call: "escape"` rows are deleted from
  `scripts/api-compare/call-mismatches-exclude/activesupport/**` (only-shrink;
  delete the rows by hand, do not reseed).
- `pnpm parity:api:calls:tighten` narrows the stale per-file marks that deleting
  those rows leaves behind.
- Behavior is unchanged: `transliterate.ts`'s character class must keep escaping
  everything Ruby's `Regexp.escape` does at that site.
