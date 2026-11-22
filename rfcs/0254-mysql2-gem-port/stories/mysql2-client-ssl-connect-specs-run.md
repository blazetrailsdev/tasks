---
title: "mysql2 SSL connect specs run"
status: ready
updated: 2026-11-22
rfc: "0254-mysql2-gem-port"
cluster: null
packages: ["mysql2"]
deps: []
deps-rfc: []
est-loc: 120
priority: 8
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The gem specs are fully enrolled (`packages/mysql2/test/{client,error,result,statement}.test.ts` carry all 276 `it` names), but 183 are `it.skip`. For mysql2 to reach 100% test parity every skip must either run or carry a skip reason that is a genuine Node/JS impossibility (CLAUDE.md "Runtime facts Node does not expose", "A String has no encoding tag either"). The skips below cite "not in the RFC 0254 surface table" or an RFC 0254 Non-goal; that is a scope choice, not an impossibility, and this story retires it. Where porting a spec needs gem surface the package does not ship yet, port that surface (Ruby half scored by parity:api, C half under its gem name, no receipt). Where a spec is genuinely unportable after investigation, keep the skip but replace its comment with the concrete Node/driver fact, and say so in the PR.

`client.test.ts` "SSL" skips (2, "SSL is outside the RFC 0254 surface"): "should set ssl_mode option #{ssl_mode}", "should be able to connect via SSL options". `parse_ssl_mode` already landed (story `mysql2-parse-ssl-mode-raises-name-error`); this is the connect side, mapping `ssl_mode` / `sslkey`/`sslcert`/`sslca` onto the npm `ssl` option. Needs an SSL-enabled MariaDB in CI or a gated skip with the CI fact.

## Acceptance criteria

- [ ] Both SSL skips run and pass (or are gated on an SSL-capable server the CI lane provides).
