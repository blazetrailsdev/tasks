---
title: "Type Options' accessors on Context so include needs no casts"
status: done
updated: 2026-11-22
rfc: "0168-rack-cache-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#10592
claim: "2026-11-22T19:34:13Z"
assignee: "rack-cache-context-types-options-accessors"
blocked-by: null
closed-reason: null
---

## Context

`Rack::Cache::Context` does `include Rack::Cache::Options` (`vendor/rack-cache/v1.17.0/lib/rack/cache/context.rb:10`), so every `option_accessor` reader (`options.rb:96-110`: `verbose`, `storage`, `default_ttl`, `ignore_headers`, `private_headers`, …) and `options` (`options.rb:118-120`) is public on a `Context`. In trails#10582, `include(Context, Options)` installs them at run time, but `Included<Options>` (`packages/ruby-compat/lib/include.ts:1484`) maps function members only. Typing them on the class with `declare` lines was flagged as novel extra surface. As a result, `packages/rack-cache/lib/context.ts` reads each one through `(this as unknown as Options)` (about 12 sites), and `test/cache.test.ts` reads `object.options` the same way, where Ruby writes `object.options`.

## Acceptance criteria

- [ ] Includer-side typing carries a class module's accessor properties (extend `Included<>`, or teach `parity:api:extra` that a `declare` of an included module's member is not novel).
- [ ] The `as unknown as Options` casts in `context.ts` and `cache.test.ts` are gone, and `context.options[...]` type-checks as in Ruby.
