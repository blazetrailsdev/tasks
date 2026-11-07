---
title: "Port the api-only generators override and mailer-views tests (generators_test.rb:154-177)"
status: draft
updated: 2026-11-07
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9837 added `Generators.apiOnlyBang` (`vendor/rails/v8.0.2/railties/lib/rails/generators.rb:113-126`) and the `api_only!` call in `configureBang` (`:69`). It ported `generators_test.rb:135` ("api only generators hide assets, helper, js and css namespaces and set api option") into `packages/trailties/src/application/generators.test.ts`.

Two Rails tests in the same file are still unported:

- "api only generators allow overriding generator options" (`vendor/rails/v8.0.2/railties/test/application/generators_test.rb:154-167`). It exercises the ordering in `configure!`: `api_only!` runs first, then `options.deep_merge! config.options` lets an explicit `config.generators.helper = true` / `template_engine = :my_template` override it.
- "api only generator generate mailer views" (`:169-177`). It covers the `options[:mailer][:template_engine] ||= :erb` arm (in trails `"tse"`).

## Acceptance criteria

- Both tests are ported into `packages/trailties/src/application/generators.test.ts` with their Rails names verbatim.
- Each test restores the global `Generators.options()` and `hiddenNamespaces()` state it mutates.
