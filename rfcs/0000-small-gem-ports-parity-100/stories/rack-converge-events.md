---
title: "Converge Rack::Events onto events.rb (4/14 methods, call and argument rows)"
status: draft
updated: 2026-10-15
rfc: "0000-small-gem-ports-parity-100"
cluster: rack-api
packages: [rack]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rack/v3.1.14/lib/rack/events.rb` scores 4/14. Missing: `Rack::Events#on_start`, `#on_commit`, `#on_send`, `#on_finish`, `#on_error` (the `Abstract` hooks), `EventedBodyProxy#request`, `#response`, `#each`, and `BufferedResponse#body`, `#to_a`. The call gate flags `Events#call` for not calling `make_request` / `make_response` and for the order `constructor,onStart`. The argument gate flags `on_start` (Rails passes `request, nil`; TS passes `req, res`), `on_commit`, `on_error`, `on_finish` (locals `req`/`res`/`error` instead of `request`/`response`/`e`), and `make_response`'s `new` (it drops `body`). The baseline is `scripts/api-compare/call-mismatches-exclude/rack/events.json` (3 call rows, 2 argument rows). The extra surface lists `EventResponse` as novel in `events.ts`.

## Acceptance criteria

- [ ] `parity:api` reports 14/14 for `events.rb`.
- [ ] `call-mismatches-exclude/rack/events.json` is deleted, the marks are tightened with `pnpm parity:api:calls:tighten rack/events.json`, and no events row is left in `call-arg-mismatches.json`.
- [ ] `EventResponse` is gone, or renamed to the Rails constant it stands for.
