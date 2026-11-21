---
title: "Mysql2::Result#each is ported and the result_spec #each examples run"
status: ready
updated: 2026-11-21
rfc: "0254-mysql2-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0254 § "The measured split" lists `Mysql2::Result#each` (`vendor/mysql2/0.5.6/ext/mysql2/result.c:1229-1236`, `rb_mysql_result_each`, with `Enumerable` included) on the shipped surface. `packages/mysql2/lib/result.ts` has `toA`, `fields`, `size`, `count` and `free`, but no `each`.

Because of that, the `result_spec.rb` `#each` examples (`spec/mysql2/result_spec.rb:53-104`: "should yield rows as hash's", "...with symbol keys if :symbolize_keys was set to true", "should be able to return results as an array") and "should respond to #each" (`:17-19`) are `it.skip` in `packages/mysql2/test/result.test.ts` under a not-in-surface `PERMANENT-SKIP:` line, which is wrong.

## Acceptance criteria

- [ ] `Result#each(options = {}, block)` yields each row, honoring per-call `as:` / `symbolizeKeys:`, as `rb_mysql_result_each` does, and answers `toEnum` without a block.
- [ ] The four examples above are un-skipped, ported and green on the MariaDB lane.
