---
title: "Port Timeout.timeout and Timeout::Error to ruby-compat"
status: draft
updated: 2026-10-05
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `Timeout.timeout(sec) { ... }` (`vendor/ruby/v3.3.11/lib/timeout.rb`)
has no port in `@blazetrails/ruby-compat`. Rails tests use it as a
catastrophic-backtracking guard, e.g.
`vendor/rails/v8.0.2/actionpack/test/controller/http_token_authentication_test.rb:94-103`
("authentication request with evil header"):

    Timeout.timeout(1) do
      get :index
    end

trails#8537 ported that call with a test-local object in
`packages/actionpack/src/action-controller/controller/http-token-authentication.test.ts`:

    const Timeout = {
      async timeout(sec, block) {
        const started = performance.now();
        await block();
        if (performance.now() - started > sec * 1000) throw new Error("execution expired");
      },
    };

JS cannot interrupt a synchronous body, so an elapsed-time check after the block
is the nearest shape; a vitest per-test timeout does not fire while the event
loop is blocked. The local copy raises a bare `Error` where Ruby raises
`Timeout::Error` ("execution expired"), and every other Rails test that calls
`Timeout.timeout` will need the same thing.

## Acceptance criteria

- ruby-compat exports `Timeout.timeout(sec, block)` and `Timeout.Error`
  (`Timeout::Error < RuntimeError`, message "execution expired"), cited to
  `vendor/ruby/v3.3.11/lib/timeout.rb` and receipted per the package's rules.
- It awaits the block and raises `Timeout.Error` when the block took longer
  than `sec` seconds; `sec` of `nil` / 0 runs the block unguarded, as Ruby does.
- `http-token-authentication.test.ts` imports it and drops its local `Timeout`.
- `grep -rn "Timeout.timeout" vendor/rails/v8.0.2/*/test` call sites already
  ported with a vitest timeout or an ad-hoc guard are listed in the PR body
  (convert those that fit; file the rest).
