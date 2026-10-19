---
title: "Converge actionpack's port-side API residue (formats, Error, Journey Utils, RouteSet#inspect, parse_formatted_parameters arity)"
status: done
updated: 2026-10-19
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#9049
claim: "2026-10-19T00:01:51Z"
assignee: "actionpack-api-port-residue"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api` on trails `main` @ `87094a5097` reports these port-side residue rows for actionpack. No story owns them. (`Mime::Type#to_ary`/`to_a` belongs to RFC 0141's `mime-type-to-ary-and-to-a-unported`, `http/rack_cache.rb` to RFC 0123's `port-rails-meta-and-entity-stores`, and the `MemCacheStore < Dalli` inheritance row to the mem-cache stories.)

- **abstractcontroller methods 176/178**: `AbstractController::Base#formats` and `#formats=` are missing. Rails declares them as `attr_internal :formats` (`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/base.rb:48`), and `packages/actionpack/src/abstract-controller/base.ts` has no `formats` accessor (only `rendering.ts` lists `"_formats"`).
- **abstractcontroller inheritance 3/4**: `error.ts:Error ruby<StandardError> ts<class missing>`. Rails' class is `AbstractController::Error` (`abstract_controller/error.rb`), but trails exports `AbstractControllerError`.
- **actiondispatch inheritance**: `journey/router/utils.ts:Utils ruby<(none)> ts<class missing>`. Rails has `class Utils` (`journey/router/utils.rb:8`) with class methods, but trails exports free functions (`normalizePath`, `escapePath`, …).
- **actiondispatch methods**: `RouteSet#inspect` is missing. Rails has `alias inspect to_s` (`routing/route_set.rb:37`).
- **actiondispatch arity 1092/1094**: `parseFormattedParameters` takes `(parsers, fallback)` in both `http/parameters.ts` and `http/request.ts`, but Rails takes `(parsers)`.

## Acceptance criteria

- Each row is converged onto Rails' shape: the accessor pair, the class at its Rails name, the `Utils` class, the `inspect` alias, and the one-parameter signature. Any row that can't converge gets a reasoned receipt instead.
- `pnpm parity:api --package abstractcontroller` reports 178/178 with inheritance 4/4. `--package actiondispatch` reports no `route_set.rb` miss, no `Utils` inheritance row and arity 1094/1094.
