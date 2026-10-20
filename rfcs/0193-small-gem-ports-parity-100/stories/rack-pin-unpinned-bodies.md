---
title: "rack: converge and pin the 25 unpinned bodies (events, reloader, headers, response, …)"
status: claimed
updated: 2026-10-20
rfc: "0193-small-gem-ports-parity-100"
cluster: rack-api
packages: ["rack"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-10-20T15:54:00Z"
assignee: "did-you-mean-pin-registry-and-null-checker-bodies"
blocked-by: null
closed-reason: null
---

## Context

Measured on trails `main` @ `5c642754f3` (2026-10-20, forced `pnpm parity:api --calls` after `pnpm build`): rack reports `pins: 457/482 (25 unpinned)`. The RFC's Verification requires 0 unpinned. The unpinned name-matched pairs (from `scripts/api-compare/output/body-hashes.json` minus `scripts/api-compare/body-pins.json`) are mostly bodies ported after the floor pin:

- `events.rb` (7): `on_error`, `on_commit`, `on_start`, `on_finish`, `each`, `to_a`, `on_send` (from `rack-converge-events`)
- `reloader.rb` (7): `initialize`, `call`, `reload!`, `safe_load`, `rotation`, `figure_path`, `safe_stat` (from `rack-port-reloader`)
- `headers.rb` (3): `[]`, `[]=`, `[]`
- `response.rb` (3): `finish`, `[]`, `[]`
- `directory.rb` `DIR_FILE_escape`, `multipart.rb` `<<`, `null_logger.rb` `<<`, `request.rb` `has_header?`, `version.rb` `release`

## Acceptance criteria

- [ ] Each pair's TS body is read against its vendored rack body (`vendor/rack/v3.1.x/lib/rack/<file>`) and converged where it diverges; then pinned with `tsx scripts/api-compare/body-pins.ts --pin <ruby-file>`. No pin is taken over a body that still diverges.
- [ ] A forced `pnpm parity:api` reports rack `pins: N/N (0 unpinned)`.
