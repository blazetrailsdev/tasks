---
title: "Port rack-cors test/unit/cors_test.rb and its .ru configs"
status: done
updated: 2026-11-18
rfc: "0244-rack-cors-gem-port"
cluster: rack-cors
packages: [rack-cors]
deps: [rack-cors-gem-port]
deps-rfc: []
est-loc: 650
priority: null
pr: trails#10306
claim: "2026-11-18T17:51:53Z"
assignee: "rack-cors-unit-test-suite"
blocked-by: null
closed-reason: null
---

## Context

`test/unit/cors_test.rb` in `cyu/rack-cors` v3.0.0 is a Minitest spec
(549 lines, 53 examples). `load_app` (`:67-79`) builds each app as
`Rack::Builder.new { use CaptureResult; eval File.read("#{name}.ru"); … }`,
over `test/unit/test.ru`, `insecure.ru` and `non_http.ru`. It also uses
`Rack::MockResponse.infect_an_assertion` (`:52-60`) and Mocha's `stubs` /
`expects` (`:219-222`).

## Acceptance criteria

- `cors_test.rb` ports as `packages/rack-cors/test/unit/cors.test.ts`, with
  every `describe` / `it` name unchanged.
- Each `.ru` ports as a `.ts` module exporting a function that `load_app`
  calls with the `Rack::Builder` as its argument, in place of Ruby's `eval`,
  as the port's constructor passes its block
  (`packages/rack/lib/builder.ts:30-39`).
- The `infect_an_assertion` custom assertions become local `expect` helpers.
  Mocha stubs become `vi.fn` / `vi.spyOn`.
- `pnpm parity:test rack-cors` matches all 57 Rails examples (53 here and 4
  from `dsl_test.rb`).
