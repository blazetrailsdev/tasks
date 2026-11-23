---
title: "mysql2 'streaming ended due to a timeout' spec runs or carries a verified skip"
status: done
updated: 2026-11-23
rfc: "0254-mysql2-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#10640
claim: "2026-11-23T13:32:34Z"
assignee: "mysql2-local-infile-ports-infile-c"
blocked-by: null
closed-reason: null
---

## Context

`result_spec.rb` "should raise an exception if streaming ended due to a timeout" (`vendor/mysql2/0.5.6/spec/mysql2/result_spec.rb`, streaming context) is `it.skip` in `packages/mysql2/test/result.test.ts`. trails#10609 ran it against MariaDB 11 and MySQL 8, and it never raised. The ~2.6 MB result fits in Linux's autotuned TCP buffers, so pausing npm mysql2's socket (`Query#stream` → `connection.pause()`, `mysql2/lib/base/connection.js:607`) never blocks the server's write, and `net_write_timeout` never fires.

## Acceptance criteria

- [ ] Find out why libmysqlclient hits the timeout and Node does not: socket receive buffer, client read size, or whether the gem's own CI actually passes this spec. Then either run the spec as written, or keep the skip with the verified fact.
