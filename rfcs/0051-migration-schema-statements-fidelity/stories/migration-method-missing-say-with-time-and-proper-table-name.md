---
title: "Port Migration#method_missing's say_with_time wrapper and proper_table_name rewriting"
status: done
updated: 2026-07-31
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 5769
claim: "2026-07-31T23:10:41Z"
assignee: "migration-method-missing-say-with-time-and-proper-table-name"
blocked-by: null
closed-reason: null
---

## Context

`Migration#methodMissing` (`packages/activerecord/src/migration.ts`, the
instance method near the strategy dispatch added by PR #5743) now routes
through `executionStrategy.respondToMissing` / `.methodMissing`, matching
`vendor/rails/activerecord/lib/active_record/migration.rb:1055-1056`.

It still omits the rest of Rails' `method_missing` body
(`migration.rb:1044-1058`):

- the whole call is wrapped in
  `say_with_time "#{method}(#{format_arguments(arguments)})"`, so schema
  statements dispatched this way announce and time themselves;
- unless `connection.respond_to? :revert`, and unless the arguments are empty
  or the method is one of `:execute`, `:enable_extension`,
  `:disable_extension`, `arguments[0]` is rewritten via
  `proper_table_name(arguments.first, table_name_options)`, and for
  `:rename_table` (or `:remove_foreign_key` with a non-Hash second arg)
  `arguments[1]` is rewritten too.

trails has `sayWithTime`, `formatArguments`, `properTableName`, and
`tableNameOptions` already; they are simply not wired into this path. The gap
predates #5743 (the pre-refactor body was a bare `conn[name].apply(...)`) and
was flagged in that PR's review as out of scope.

## Acceptance criteria

- [ ] `Migration#methodMissing` wraps the strategy dispatch in `sayWithTime`
      with Rails' `"#{method}(#{formatArguments(args)})"` label.
- [ ] The `properTableName` argument rewriting reproduces Rails' guards: the
      `connection.respond_to? :revert` escape, the empty-arguments /
      `execute` / `enableExtension` / `disableExtension` exemptions, and the
      second-argument rewrite for `renameTable` and non-Hash
      `removeForeignKey`.
- [ ] Tests cover the announce/timing wrapper and the prefix/suffix rewriting
      through the method-missing path.
