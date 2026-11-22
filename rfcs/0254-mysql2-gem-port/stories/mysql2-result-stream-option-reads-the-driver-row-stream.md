---
title: "mysql2-result-stream-option-reads-the-driver-row-stream"
status: claimed
updated: 2026-11-22
rfc: "0254-mysql2-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-22T22:34:12Z"
assignee: "mysql2-result-stream-option-reads-the-driver-row-stream"
blocked-by: null
closed-reason: null
---

## Context

Split from `mysql2-result-streaming-and-cache-rows-specs-run`, which ran the `cache_rows` specs but not the streaming ones. `rb_mysql_result_each` (`vendor/mysql2/0.5.6/ext/mysql2/result.c:1060-1180`) fetches rows one at a time from `mysql_use_result` when `:stream` is true, warns `:cache_rows is ignored if :stream is true` (`:1087-1089`), and raises `Mysql2::Error` "You have already fetched all the rows for this query and streaming is true. (to reiterate you must requery)." on a second pass. `Client#query` raises while a streamed result is unfinished (`client.c` `rb_mysql_client_query`'s `active_fiber` check).

In trails `Result#each` (`packages/mysql2/lib/result.ts`) is synchronous over rows `_query` (`packages/mysql2/lib/client.ts`) has already buffered. A streamed result has to read the npm driver's row stream (`connection.connection.query(options).stream()`), so its `each` awaits; that is a signature decision for the streamed arm.

## Acceptance criteria

- [ ] `query(sql, { stream: true })` and `Statement#execute({ stream: true })` answer a Result whose `each` reads the driver's row stream, uncached, and raises the gem's error on a second pass.
- [ ] These `it.skip`s run, ported from `vendor/mysql2/0.5.6/spec/mysql2/{result,statement,client}_spec.rb`: result.test.ts "#each" "should yield different value for #first if streaming", "should throw an exception if we try to iterate twice when streaming is enabled", and the five "streaming" cases; statement.test.ts the same two "#each" cases and "should be able to stream query result"; client.test.ts "should let you query again if iterating is finished when streaming" and "should not let you query again if iterating is not finished when streaming".
