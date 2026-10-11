---
title: "activerecord: Mysql2::Client is a class over the npm connection; every driver error is a Mysql2::Error"
status: draft
updated: 2026-10-11
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left open by `mysql2-client-takes-the-gem-layout-initialize-flags-statement-result-error`, which split
`packages/activerecord/src/mysql2/` into `client.ts`, `error.ts`, `result.ts` and `statement.ts` and
took `parity:api` for the `mysql2` package from 2/33 to 12/33.

`Mysql2::Client` is still a decorated npm connection (`mysql2Client`), and its gem methods are
`this`-typed functions. What that leaves:

- `Client#initialize` (`vendor/mysql2/0.5.6/lib/mysql2/client.rb:21-98`) is the exported function
  `initialize`, called on a plain wrapper object by `Mysql2.Client.new`. `parity:api` credits a
  `constructor` only, so it reads as missing. A JS constructor cannot await the `connect` the gem's
  `initialize` ends with (`client.rb:97`), so the class needs a decision on where the awaited connect
  goes. `pg/connection.ts` is the precedent: a `Connection` class behind a Proxy that forwards to the
  npm client, built by an awaited `connect`.
- `query_options` and `read_timeout` (`attr_reader`, `client.rb:3`) are properties `connect` copies
  onto the npm connection. `parity:api` reports them `DeclOnly`, because they are members of the
  `Mysql2Client` interface and of no class.
- `initialize` skips `initialize_ext`, `self.charset_name =` (`client.rb:50`), and the whole SSL block:
  `parse_ssl_mode`, `find_default_ca_path`, `ssl_set`, `ssl_mode=` (`client.rb:52-58,100-109,126-136`).
  node-mysql2 names charsets and takes TLS options differently, and `find_default_ca_path` needs an
  async `File.exist?`.
- The setter loop (`client.rb:35-47`) stores `reconnect`, `local_infile`, `write_timeout`,
  `default_file`, `default_group`, `secure_auth`, `init_command`, `enable_cleartext_plugin` and
  `default_auth` on the wrapper and `connect` reads none of them.
- `connect`, `driverError`, `options` and `storeResult` in `client.ts` stand in for
  `ext/mysql2/client.c` and carry `@noRailsEquivalent CONVERGEABLE` against this story.
- `Mysql2::Error` is the gem's class only for an error the server numbered: `driverError` raises
  `Error.new_with_args` (`error.rb:54-57`) when the npm error has a positive `errno`. A client-side
  failure (`ECONNREFUSED`, `PROTOCOL_CONNECTION_LOST`, a read timeout) is still the npm error, branded
  through `DRIVER_ERRORS` and a `Symbol.hasInstance` on `Error`. libmysql numbers those `CR_*`
  (2002, 2003, 2005, 2013, `error.rb:28-44`), and the gem raises a read timeout as
  `Mysql2::Error::TimeoutError` with no number. Until they are numbered,
  `Mysql2Adapter#translateException` matches npm `code` strings through `isMysql2DriverTimeout` and
  `isMysql2ConnectionError` where Rails tests `is_a?(Mysql2::Error::TimeoutError)` and
  `is_a?(Mysql2::Error::ConnectionError)`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/mysql2_adapter.rb:172-184`).
  `new_with_args` is passed no `server_version`.
- `query_info`, `info` (`client.rb:150-162`), `Result#server_flags` (`result.rb:3`),
  `Mysql2::Util.key_hash_as_symbols` (`lib/mysql2.rb`) and `field.rb` are not ported.
- `Statement#_execute` formats a Time bind through `quotedDate`; `ext/mysql2/statement.c:382-420`
  builds a `MYSQL_TIME` and has not been compared. `abandonResultsBang` has an empty body and
  `setServerOption` hand-builds a `COM_SET_OPTION` packet.
- `adapters/abstract-mysql-adapter/connection.test.ts` and `adapter-username-key.trails.test.ts` pass
  the deprecated `user:` key, which now prints the gem's deprecation warning (`client.rb:75-80`).

## Acceptance criteria

- [ ] `Mysql2::Client` is a class whose `constructor` is `Client#initialize`, and `query_options` and
      `read_timeout` are credited by `parity:api`.
- [ ] Every error `Mysql2::Client` raises is a `Mysql2::Error` built by `new_with_args`, `DRIVER_ERRORS`
      and the `Symbol.hasInstance` are gone, and `Mysql2Adapter#translateException` is Rails' body.
- [ ] No `@noRailsEquivalent CONVERGEABLE mysql2-client-is-a-class-over-the-npm-connection` receipt
      remains.
