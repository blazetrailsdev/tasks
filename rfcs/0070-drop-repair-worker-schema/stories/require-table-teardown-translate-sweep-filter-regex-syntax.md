---
title: "require-table-teardown: translate SIMILAR TO / POSIX regex syntax in sweep filters"
status: in-progress
updated: 2026-07-29
rfc: "0070-drop-repair-worker-schema"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5578
claim: "2026-07-29T17:35:47Z"
assignee: "require-table-teardown-translate-sweep-filter-regex-syntax"
blocked-by: null
closed-reason: null
---

## Context

`sweepPrefixMatchers` in `eslint/require-table-teardown.mjs` now reads `LIKE`,
`ILIKE`, `SIMILAR TO` and the regex operators `~` / `~*` (#5555, #5561, #5573).
Two under-accepting gaps remain, both deliberate in #5573 and both recorded in
the rule header's KNOWN GAPS paragraph — a real sweep goes unrecognised and its
creates report `missingTeardown` (noise, not a leak):

- `SIMILAR TO` refuses a pattern containing an unescaped `| * + ? ( ) [ ] { }`
  (`similarMetacharUnreadable` in `likePrefixMatcher`). Refusing rather than
  mis-reading is correct — reading `'ex*_%'` as a literal asterisk would credit
  `ex*A`, a name the sweep does not select, which is a leak — but a filter like
  `SIMILAR TO '(ex|tmp)_%'` is a perfectly real prefix sweep over two prefixes
  and currently credits nothing. Translating the SQL-standard subset (it is a
  small grammar: alternation, grouping, the three quantifiers, bracket
  expressions) would yield one matcher per alternative branch.
- The regex operators read only a metachar-free literal past the `^`, plus an
  optional trailing `.*` (`REGEXP_LITERAL_RE`). `~ '^ex_[0-9]+'` or
  `~ '^(ex|tmp)_'` is anchored and IS a prefix filter, but credits nothing.
  POSIX ERE is not JS regex syntax (bracket expressions, back references,
  `{n,m}` bounds differ), so the translation must be explicit, not a pass-through
  to `new RegExp`.

The anchor requirement itself is NOT part of this: an unanchored `~ 'ex_'`
matches mid-name and must keep crediting nothing.

Rails reference: Arel emits all of these from the same node family —
`visit_Arel_Nodes_Matches` / `visit_Arel_Nodes_Regexp` in
`vendor/rails/activerecord/lib/arel/visitors/postgresql.rb`.

As with `ILIKE` and `SIMILAR TO` before it, no file in the tree writes such a
sweep today, so this stays pre-emptive — triage accordingly.

## Acceptance criteria

- A `SIMILAR TO` pattern using alternation/grouping/quantifiers yields matchers
  covering exactly the names it selects, or stays refused with the header
  documenting why that spelling was left out.
- An anchored `~` / `~*` pattern with POSIX syntax past the `^` is translated
  rather than refused, and a construct whose JS meaning differs from its POSIX
  meaning is refused rather than mistranslated.
- No spelling is ever widened: a matcher must never credit a name the filter
  does not select (that direction is a leak, not noise).
- Unanchored regex filters and every negated form still yield no matcher.
- Rule tests pin each newly accepted and each still-rejected pattern; the KNOWN
  GAPS paragraph is updated to match what is actually read.
