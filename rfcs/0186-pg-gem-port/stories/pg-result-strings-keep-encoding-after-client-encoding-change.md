---
title: "pg: result strings keep the encoding they were fetched under"
status: in-progress
updated: 2026-11-25
rfc: "0186-pg-gem-port"
cluster: result-and-coders
packages: ["pg"]
deps: []
deps-rfc: []
est-loc: 150
priority: 3
pr: trails#10745
claim: "2026-11-25T14:52:59Z"
assignee: "pg-result-fmod-ftable-ftablecol-no-column-cases"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test --package pg --missing` (origin/main 20bec076f5) reports `vendor/pg/v1.6.2/spec/pg/connection_spec.rb:2325` "returns the results in the correct encoding even if the client_encoding has changed since the results were fetched" as missing. The example sets `internal_encoding = 'EUC-JP'`, runs `exec_params`, switches back to utf-8, and expects `res[0]['column1']` to remain EUC-JP-encoded. In Ruby that means a result records the encoding it was fetched under (`pgresult` `enc_idx`, `ext/pg_result.c`).

JS strings carry no encoding, so the first job is to decide which way to go:

1. Port it. `Result` records the client encoding at fetch time and decodes values with it, for example through `TextDecoder("euc-jp")` over the raw bytes, and the test asserts the decoded string plus the recorded encoding name.
2. If node-pg has already decoded the bytes to UTF-16 before `Result` sees them, so that (1) cannot be faithful, add a `PERMANENT` skip whose reason names that mechanism, in the same form as the other pg permanent skips.

## Acceptance criteria

- The example is either ported and passing, or a PERMANENT skip with a cited reason. Either way `connection_spec.rb` no longer shows it as Miss.
- If ported, no invented API: the encoding accessor follows the gem's name (`internal_encoding`).
