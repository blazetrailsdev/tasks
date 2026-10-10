---
title: "activerecord: Mysql2::Client takes the gem's layout (initialize, parse_flags_array, Statement, Result, Error)"
status: draft
updated: 2026-10-10
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The story `mysql2-client-scores-against-the-vendored-mysql2-gem` vendored the mysql2 gem at `0.5.6`
(`vendor/mysql2/0.5.6/`), registered `mysql2` as a nested api-compare package and moved the client to
`packages/activerecord/src/mysql2/client.ts`. `parity:api` reads `mysql2 — 2/33 methods, files 1/7`:
only `Client.default_query_options` and `Client#query` (`lib/mysql2/client.rb:5-19,144-148`) are credited.

What is still not the gem's shape:

- `Mysql2.Client.new` is `newClient`, which translates the config for `mysql.createConnection`. It is
  not `Client#initialize` (`lib/mysql2/client.rb:21-98`): no `Mysql2::Util.key_hash_as_symbols`, no
  `connect_timeout` default, no `parse_ssl_mode`, `find_default_ca_path` or `parse_connect_attrs`.
- `withoutDefaultIgnoreSpace` and the `CLIENT_FLAGS` bit filter stand in for `parse_flags_array`
  (`lib/mysql2/client.rb:111-124`). The npm driver takes flag names, the gem computes an integer from
  `@query_options[:connect_flags]`; the port has to compute the gem's integer and then hand the driver
  names, without changing which flags reach the server.
- `Result`, `Statement` and `Mysql2.Error` live in `client.ts`. The gem has `lib/mysql2/result.rb`,
  `statement.rb` and `error.rb` (`Error::CODES`, `ConnectionError`, `TimeoutError`, `new_with_args`,
  `error.rb:4-100`). `Statement#execute` (`statement.rb:3-7`) wraps `_execute`.
- `query_options` and `read_timeout` (`attr_reader`, `client.rb:3`) are properties of the decorated npm
  connection and are not credited, and `query_info` / `info` (`client.rb:150-162`) are not ported.
- `Statement#execute` formats a Time bind through `quotedDate`; `ext/mysql2/statement.c` has not been
  compared. `abandonResultsBang` has an empty body. `setServerOption` hand-builds a `COM_SET_OPTION`
  packet.
- `warningCount` reads the count from the EOF packet by wrapping the npm connection's `handlePacket`,
  because node-mysql2 drops that field (`lib/commands/query.js`, `row`).

## Acceptance criteria

- [ ] `packages/activerecord/src/mysql2/` has `result.ts`, `statement.ts` and `error.ts` mirroring the
      gem's files, and `parity:api` credits `Statement#execute` and `Error`'s members.
- [ ] `Client#initialize` and `parse_flags_array` are ported at their gem names, with a test showing the
      flags that reach `mysql.createConnection` are unchanged for an Integer, an Array and an absent
      `flags`.
- [ ] `query_options` and `read_timeout` are credited, or the reason they cannot be is recorded here.
