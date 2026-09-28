---
title: "Port the skipped tests in base_test.rb, flash_test.rb and log_subscriber_test.rb"
status: draft
updated: 2026-09-27
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "port-actionpack-abstract-unit-test-support",
    "split-redirect-to-into-redirecting-and-flash",
    "metal-invented-registries-fold-into-rails-state",
  ]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Three Rails files, all under `vendor/rails/v8.0.2/actionpack/test/controller/`,
fully matched by name with 35 empty skip stubs between them:

- `base_test.rb`, 13 skips: `ControllerClassTests` (`:75`, 1),
  `ControllerInstanceTests` (`:107`, 3), `PerformActionTest` (`:169`, 1),
  `UrlOptionsTest` (`:203`, 3), `DefaultUrlOptionsTest` (`:256`, 2),
  `OptionalDefaultUrlOptionsControllerTest` (`:311`, 1),
  `EmptyUrlOptionsTest` (`:323`, 2)
- `flash_test.rb`, 8 skips: `FlashTest` (`:6`, 5 — sweep after a halted
  chain, `redirect_to` with and `add_flash_types` on subclasses and parents)
  and `FlashIntegrationTest` (`:250`, 3 — no cookie when flash is only read,
  the added flash-type methods, flash in the etag)
- `log_subscriber_test.rb`, 14 skips in `ACLogSubscriberTest` (`:129-413`) —
  `process_action` with parameters, wrapped parameters, path, `throw`,
  headers and filtered parameters; `append_info_to_payload` on exception; and
  six `filter_redirect` arms

`controller/base.test.ts` also holds 49 tests with no Rails counterpart. Two of
them (`render plain`, `render text`) share a name with Rails tests in
`api/renderers_test.rb` and `live_stream_test.rb`, so `pnpm parity:test`
reports them misplaced; they are trails-only and are treated like the rest.

## Acceptance criteria

- The 35 stubs are real tests with Rails' bodies.
- Tests in `base.test.ts` with no Rails counterpart move to
  `base.trails.test.ts` (it exists) or are deleted as duplicates.
- The three files report complete with 0 skipped in `pnpm parity:test`.
