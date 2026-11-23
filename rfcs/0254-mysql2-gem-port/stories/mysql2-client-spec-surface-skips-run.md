---
title: "mysql2 client_spec skips citing the RFC surface table run (escape, info, select_db, query options, local_infile...)"
status: claimed
updated: 2026-11-23
rfc: "0254-mysql2-gem-port"
cluster: null
packages: ["mysql2"]
deps: []
deps-rfc: []
est-loc: 400
priority: 4
pr: null
claim: "2026-11-23T00:54:06Z"
assignee: "mysql2-client-spec-surface-skips-run"
blocked-by: null
closed-reason: null
---

## Context

The gem specs are fully enrolled (`packages/mysql2/test/{client,error,result,statement}.test.ts` carry all 276 `it` names), but 183 are `it.skip`. For mysql2 to reach 100% test parity every skip must either run or carry a skip reason that is a genuine Node/JS impossibility (CLAUDE.md "Runtime facts Node does not expose", "A String has no encoding tag either"). The skips below cite "not in the RFC 0254 surface table" or an RFC 0254 Non-goal; that is a scope choice, not an impossibility, and this story retires it. Where porting a spec needs gem surface the package does not ship yet, port that surface (Ruby half scored by parity:api, C half under its gem name, no receipt). Where a spec is genuinely unportable after investigation, keep the skip but replace its comment with the concrete Node/driver fact, and say so in the PR.

`client.test.ts` skips citing "not in the RFC 0254 surface table" (51), grouped:

- connect/options: defaults file (2), default flags, init_command after reconnect, terminate connections on close, numeric-only database name, plaintext password, connect_attrs program_name / custom (2), `#set_server_option` invalid value, `#automatic_close` (3)
- `#query`: only accepts strings, query options not retained / changeable (2), results as array, symbolized keys, closed connection on read error, no second query before fetching, `:read_timeout`, connection-corrupting timeouts, close on exception
- `:local_infile` (3); `#query_info` (3)
- `escape` / `#escape` (10), `#info` / `.info` (2), `#server_info` requires an open connection, `#last_id` (2), `#select_db` (4), `#socket` (5)

RFC 0254 Non-goals list `select_db`, `thread_id`, `query_info`, `escape`; porting them here is the gem surface the specs exercise (C half under gem names, gating nothing), not a change to trails' synchronous `quoteString`.

## Acceptance criteria

- [ ] The listed `it.skip`s in `packages/mysql2/test/client.test.ts` run and pass, ported from `vendor/mysql2/0.5.6/spec/mysql2/client_spec.rb`, adding the gem methods they need to `packages/mysql2/lib/client.ts`.
- [ ] Any that cannot run (e.g. `#socket` file descriptor) keep a skip whose comment names the concrete Node/driver fact.
