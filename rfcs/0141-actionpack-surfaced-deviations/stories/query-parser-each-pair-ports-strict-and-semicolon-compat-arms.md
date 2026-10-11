---
title: "QueryParser.each_pair ports the strict_query_string_separator and semicolon-compat arms"
status: draft
updated: 2026-10-11
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::QueryParser.each_pair`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/query_parser.rb:22-36`) picks its
splitter in four arms: `separator` given; `elsif strict_query_string_separator` -> `DEFAULT_SEP`;
`elsif SEMICOLON_COMPAT && s.include?(";")` -> deprecation warning when the setting is `nil`,
then `COMPAT_SEP`; `else DEFAULT_SEP`. `COMPAT_SEP` and `SEMICOLON_COMPAT` are constants at
`query_parser.rb:9,14`.

trails' `QueryParser.eachPair` (`packages/actionpack/src/action-dispatch/http/query-parser.ts`)
has only the `separator` arm and the `DEFAULT_SEP` fallback. `strictQueryStringSeparator` is
declared with `cattrAccessor` (trails#8795) and assigned by the railtie, but nothing reads it,
and `COMPAT_SEP` / `SEMICOLON_COMPAT` are absent.

## Acceptance criteria

- `eachPair` has Rails' four arms in Rails' order, reading `strictQueryStringSeparator`, with
  `COMPAT_SEP` and `SEMICOLON_COMPAT` ported at their Rails names and the deprecation message
  verbatim (`query_parser.rb:32`).
- The Rails tests covering semicolon separators in
  `actionpack/test/dispatch/request/query_string_parsing_test.rb` are ported or un-skipped.
