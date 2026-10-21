---
title: "Rack::Response#buffered_body! checks close with native typeof"
status: draft
updated: 2026-10-20
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 5
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rack::Response::Helpers#buffered_body!` closes the body after copying it: `body.close if body.respond_to?(:close)` (`vendor/rack/v3.1.14/lib/rack/response.rb:349`). trails' `bufferedBodyBang` (`packages/rack/src/response.ts:223`) spells this `if (rbObjRespondTo(body, "close")) body.close();`.

Owner ruling 2026-10-20 (closing `rack-buffered-body-respond-to-each` as FALSIFIED): a rack body's `respond_to?` check is native JS, not ruby-compat send/respond_to. Ten lines earlier, at `:214`, the same method already checks `each` as `typeof this._body.each === "function"`.

## Acceptance criteria

- [ ] `response.ts:223` reads `if (typeof body.close === "function") body.close();`.
- [ ] `rbObjRespondTo` is dropped from `response.ts`'s imports if nothing else uses it.
- [ ] `pnpm parity:api:calls` and `:calls:args` stay green for response.rb. If the gate asks for `respond_to?`, find out how it credits the `each` check and use the same form.
- [ ] `packages/rack/src/response.test.ts` passes.
