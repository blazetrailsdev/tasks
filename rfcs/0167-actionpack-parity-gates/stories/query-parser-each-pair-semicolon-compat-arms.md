---
title: "query-parser-each-pair-semicolon-compat-arms"
status: draft
updated: 2026-10-19
rfc: "0167-actionpack-parity-gates"
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

Rails' `ActionDispatch::QueryParser.each_pair` picks its splitter in four arms (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/query_parser.rb:25-37`): `COMMON_SEP[separator]` / a built pattern when a separator is given, `DEFAULT_SEP` when `strict_query_string_separator`, `COMPAT_SEP` (with a deprecation warning while `strict_query_string_separator.nil?`) when `SEMICOLON_COMPAT && s.include?(";")`, else `DEFAULT_SEP`. trails' `QueryParser.eachPair` (`packages/actionpack/src/action-dispatch/http/query-parser.ts`) ports only the first and last arms; `COMPAT_SEP`, `SEMICOLON_COMPAT` and the deprecation are absent.

## Acceptance criteria

- `eachPair` takes Rails' four splitter arms in Rails' order, with `COMPAT_SEP`, `SEMICOLON_COMPAT` (from the Rack release) and the `ActionDispatch.deprecator.warn` message.
- The `query_parser_test.rb` / `request_test.rb` semicolon cases that depend on them are ported and pass.
