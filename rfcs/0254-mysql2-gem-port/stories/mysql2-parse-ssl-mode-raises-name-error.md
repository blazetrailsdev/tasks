---
title: "parse_ssl_mode raises NameError on an illegal constant name; default-CA arm tested"
status: draft
updated: 2026-11-21
rfc: "0254-mysql2-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Mysql2::Client#parse_ssl_mode` (`vendor/mysql2/0.5.6/lib/mysql2/client.rb:99-108`) checks `Mysql2::Client.const_defined?(m)`. A string that is not a valid constant name (for example `"verify ca"`) makes `const_defined?` raise `NameError`. `packages/mysql2/lib/client.ts` `parseSslMode` checks `Object.hasOwn(Client, m)` and falls through to `warn`, so a malformed `ssl_mode` warns where Ruby raises.

Also untested: `findDefaultCaPath` (`client.rb:127-134`) feeding `opts[:sslca]` when `ssl_mode` is VERIFY_CA / VERIFY_IDENTITY and no `sslca` is given (`client.rb:50-53`).

## Acceptance criteria

- [ ] `parseSslMode` raises `NameError` with Ruby's message (`wrong constant name ...`) for a name that is not a constant name, and warns only for a well-formed unknown one.
- [ ] `packages/mysql2/test/client.trails.test.ts` covers the NameError arm and the default-CA arm reaching `sslSet`.
