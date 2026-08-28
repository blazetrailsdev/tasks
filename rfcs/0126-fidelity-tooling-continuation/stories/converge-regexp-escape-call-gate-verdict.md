---
title: "converge-regexp-escape-call-gate-verdict"
status: draft
updated: 2026-08-28
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Regexp.escape` is Ruby CORE, implemented in C (`re.c` `rb_reg_s_quote`), and
JS has no `RegExp.escape`. No port can call it, so eight files had each grown
their own private copy under three different spellings — `regexpEscape`
(`inflector.ts:368`, `transliterate.ts:93`), `escapeRegExp` (`cache/store.ts`,
`number-helper/number-to-rounded-converter.ts`, `testing/deprecation.ts`,
`action-dispatch/middleware/host-authorization.ts`, `helpers/text-helper.ts`),
and `escapeRegexp` (`parameter-filter.ts:261`).

The call-set gate only sees the Ruby call name `escape`, so every one of those
faithful ports reads as a dropped call — a measurement verdict that is wrong on
main. `escape` entered the ported-call population when
`ActiveSupport::FileUpdateChecker#escape`
(`activesupport/lib/active_support/file_update_checker.rb:154`) was ported in
PR #7166, which landed seven `"call": "escape"` baseline rows for exactly that.

Rails call sites, all verified:
`HostAuthorization#sanitize_string` (`actionpack/lib/action_dispatch/middleware/host_authorization.rb:75`),
`TextHelper#highlight` / `#excerpt` (`actionview/lib/action_view/helpers/text_helper.rb:180,243`),
`Cache::Store#key_matcher` (`activesupport/lib/active_support/cache.rb:779`),
`Inflector.const_regexp` (`activesupport/lib/active_support/inflector/methods.rb:357`),
`NumberToRoundedConverter#format_number` (`activesupport/lib/active_support/number_helper/number_to_rounded_converter.rb:49`),
`ParameterFilter.precompile_filters` / `#compile_filters!` (`activesupport/lib/active_support/parameter_filter.rb:55,93`),
`Testing::Deprecation#assert_deprecated` (`activesupport/lib/active_support/testing/deprecation.rb:30`),
`Inflector#parameterize` (`activesupport/lib/active_support/inflector/transliterate.rb:123`).

## Acceptance criteria

- One exported `regexpEscape` in `activesupport/src/core-ext/regexp.ts` — the
  file placement counterpart of `active_support/core_ext/regexp.rb`, so the
  `@noRailsEquivalent PERMANENT` receipt is scored `Allowed` rather than
  hiding surface in an unmatched file. All eight private copies deleted, every
  call site importing the one function.
- `CORE_LIBRARY_ALIASES` in `scripts/api-compare/enumerable-idioms.ts` maps
  Ruby `escape` to that ONE name, read through the existing
  `jsEnumerableAliases`. Not a list of the spellings that happened to be in the
  tree: an alias list would ratify the divergence the entry exists to make
  visible, and a body escaping under a fourth name must still flag. Kept a
  separate table from `JS_ENUMERABLE_ALIASES`, whose KEYS double as
  `lint-calls.ts`'s noise list and as the anchor `LOOP_SKELETON_NAMES` derives
  through — neither applies to a name ported as an ordinary function.
- The seven `"call": "escape"` baseline rows deleted by hand (only-shrink, no
  reseed); files left with no rows removed. The unrelated `escape` rows for
  rack `escape_path` and actiondispatch `normalize_filter` (URI escaping) stay.
- The escape set is MRI's MINUS `-`, `#` and whitespace, with the reason at the
  definition: `\-` / `\#` / `\ ` are invalid identity escapes under a
  `u`-flagged JS pattern (`new RegExp("a\\-b", "u")` throws), which
  `ParameterFilter#precompileFilters` builds. All three are literal outside a
  character class in JS, so the subset matches the same strings MRI's output
  does. A `.trails.test.ts` pins it so it is not "fixed" to MRI-exact later.
- `parity:api:calls`, `:calls:args`, `:params`, `:cites` and `extra-surface`
  (including the stale-tag pass) green; activesupport, actionpack and actionview
  suites green.

## Notes

`regexpEscape` is a Ruby interpreter primitive, so its eventual home is the
`corelib` package proposed by RFC `0089-corelib-primitives` (postponed).
`core-ext/regexp.ts` is where it can live today and still be measured.
