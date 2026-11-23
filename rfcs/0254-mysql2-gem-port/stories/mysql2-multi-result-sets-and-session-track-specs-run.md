---
title: "mysql2 multiple-result-set and session_track specs run"
status: done
updated: 2026-11-23
rfc: "0254-mysql2-gem-port"
cluster: null
packages: ["mysql2"]
deps: []
deps-rfc: []
est-loc: 250
priority: 6
pr: trails#10616
claim: "2026-11-23T00:54:06Z"
assignee: "mysql2-client-spec-surface-skips-run"
blocked-by: null
closed-reason: null
---

## Context

The gem specs are fully enrolled (`packages/mysql2/test/{client,error,result,statement}.test.ts` carry all 276 `it` names), but 183 are `it.skip`. For mysql2 to reach 100% test parity every skip must either run or carry a skip reason that is a genuine Node/JS impossibility (CLAUDE.md "Runtime facts Node does not expose", "A String has no encoding tag either"). The skips below cite "not in the RFC 0254 surface table" or an RFC 0254 Non-goal; that is a scope choice, not an impossibility, and this story retires it. Where porting a spec needs gem surface the package does not ship yet, port that surface (Ruby half scored by parity:api, C half under its gem name, no receipt). Where a spec is genuinely unportable after investigation, keep the skip but replace its comment with the concrete Node/driver fact, and say so in the PR.

`client.test.ts` skips citing "multi-result sets and session_track are outside the RFC 0254 surface" (13): "Multiple results sets" (7: failing statement raises, returns multiple sets, does not interfere, raise with outstanding results, `#abandon_results!`, `#more_results?`, with stored procedures), "session_track" (5). Needs `more_results?` / `next_result` / `store_result` / `session_track` under their gem names (C half).

## Acceptance criteria

- [ ] The listed skips run and pass, ported from `vendor/mysql2/0.5.6/spec/mysql2/client_spec.rb`.
- [ ] Any that cannot run (e.g. session_track if the npm driver does not surface the OK-packet tracker) keep a skip whose comment names the concrete driver fact.
