---
title: "ruby-compat-native-required: aryJoin row must not require .join over Symbol-string elements"
status: done
updated: 2026-10-28
rfc: "0194-ruby-compat-native-first"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9389
claim: "2026-10-27T20:39:19Z"
assignee: "enumerable-free-functions-remaining-loop-and-enumerator-sites"
blocked-by: null
closed-reason: null
---

## Context

`ruby-compat-native-required`'s `elements` check (`eslint/ruby-compat-native-required.mjs`, `elementKind`) treats every `string` element as native for `aryJoin`. A Ruby Symbol is a JS string with a leading colon, and `aryJoin` sends it `to_s` (`vendor/ruby/v3.3.11/array.c:2778` `ary_join_1` → `rb_obj_as_string`), which drops the colon; `.join` keeps it. The MySQL / PostgreSQL `build_explain_clause` options (`activerecord/lib/active_record/connection_adapters/{mysql,postgresql}/database_statements.rb`) are Symbols, and converting them reddened both adapter lanes on trails#9347. They now keep the helper behind a disable line.

## Acceptance criteria

- [ ] `aryJoin`'s row reports only where a string element cannot be a Symbol (for example a literal or template type, or a declared non-Symbol alias), or the row is narrowed so the EXPLAIN sites need no disable line.
- [ ] A rule test pins that a Symbol-typed element array is not reported.
