---
title: "mysql2 Result#field_types, server_flags and Enumerable specs run"
status: claimed
updated: 2026-11-22
rfc: "0254-mysql2-gem-port"
cluster: null
packages: ["mysql2"]
deps: []
deps-rfc: []
est-loc: 150
priority: 7
pr: null
claim: "2026-11-22T22:34:12Z"
assignee: "mysql2-result-stream-option-reads-the-driver-row-stream"
blocked-by: null
closed-reason: null
---

## Context

The gem specs are fully enrolled (`packages/mysql2/test/{client,error,result,statement}.test.ts` carry all 276 `it` names), but 183 are `it.skip`. For mysql2 to reach 100% test parity every skip must either run or carry a skip reason that is a genuine Node/JS impossibility (CLAUDE.md "Runtime facts Node does not expose", "A String has no encoding tag either"). The skips below cite "not in the RFC 0254 surface table" or an RFC 0254 Non-goal; that is a scope choice, not an impossibility, and this story retires it. Where porting a spec needs gem surface the package does not ship yet, port that surface (Ruby half scored by parity:api, C half under its gem name, no receipt). Where a spec is genuinely unportable after investigation, keep the skip but replace its comment with the concrete Node/driver fact, and say so in the PR.

`result.test.ts` skips citing "Field / field_types / server_flags are outside the RFC 0254 surface" (7): "#field_types" (4: method exists, correct types, proper order, json on mysql 8.0) and "server flags" (3: query_was_slow, no_index_used, no_good_index_used). Also "should return an array of frozen strings" (#fields), "should raise a TypeError ... doesn't wrap a result set", "should have included Enumerable", "#count aliased as #size" (surface-table skips). Needs `Result#field_types`, `attr_reader :server_flags` (`result.rb:3`, flip its `SCOPED_SKIP_GROUPS` row to scored) and `Mysql2::Field` if a spec reads it.

## Acceptance criteria

- [ ] The listed `it.skip`s in `packages/mysql2/test/result.test.ts` run and pass; `server_flags` is scored by `parity:api --package mysql2`.
- [ ] Any that cannot run keep a skip whose comment names the concrete Node/driver fact.
