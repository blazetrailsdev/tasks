---
title: "Port Rack::Cache::Options"
status: draft
updated: 2026-09-28
rfc: "0168-rack-cache-gem-port"
cluster: null
packages: ["rack-cache"]
deps: ["port-rack-cache-key", "port-rack-cache-storage"]
deps-rfc: []
est-loc: 230
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rack-cache/v1.17.0/lib/rack/cache/options.rb` (169 lines). `Options` is
a module (`:10`, `extend self`) that `Context` `include`s (`context.rb:10`). Port
it with `include()` from `@blazetrails/activesupport` / ruby-compat (CLAUDE.md
"Module mixins"). It stores every option in a hash under the key
`"rack-cache.<name>"`. `Context#call!` copies that hash into the Rack env
(`context.rb:60`), and the stores read it back from there (`meta_store.rb:69`,
`request.env['rack-cache.use_native_ttl']`).

- `self.option_accessor(key)` (`:13-18`) defines three methods per option:
  reader, `x=` writer, and `x?` predicate (`!! options[name]`, a real boolean).
  It is called for 12 options (`:31-112`): `verbose`, `storage`, `metastore`,
  `cache_key`, `entitystore`, `default_ttl`, `ignore_headers`,
  `private_headers`, `allow_reload`, `allow_revalidate`, `use_native_ttl`,
  `fault_tolerant`. The test adds a 13th, `option_accessor :foo`, by reopening
  the module (`test/options_test.rb:4-6`). So the port must let a caller add an
  accessor after load, not only list the 12 statically. Port the `define_method`
  loop the way trails ports other generated-accessor macros. The predicate is
  `isX`.
- `option_name(key)` (`:20-26`, `module_function`) maps a **Symbol** to
  `"rack-cache.#{key}"`, passes a **String** through, and raises `ArgumentError`
  otherwise. Control flow turns on Symbol vs String, so this is exactly the case
  CLAUDE.md "A Ruby Symbol is a JS string" names: a Symbol is `":foo"` and
  `option_name` strips the colon. The tests send both (`set :bar` vs
  `set 'foo.bar'`, `options_test.rb:18-26`).
- `options` / `options=` (`:118-130`) and `set(option, value=self, &block)`
  (`:132-140`). `set` takes a Hash, a key and value, or a key and block, and
  uses `value=self` as the "not given" sentinel. Port that sentinel faithfully.
  A TS default parameter would swallow an explicit `undefined`.
- private `initialize_options` (`:143-159`) seeds `@default_options`, including
  `'rack-cache.cache_key' => Key` and `'rack-cache.storage' => Storage.instance`.
  That is why this story depends on `port-rack-cache-key` and
  `port-rack-cache-storage`. Also private `read_option` / `write_option`
  (`:161-167`).

Tests: `test/options_test.rb` (79 lines, 10 cases) →
`packages/rack-cache/src/options.test.ts`. Its `MockOptions` class
(`:8-14`) is a host that includes the module.

## Acceptance criteria

- [ ] `src/options.ts` ports `Options` as an includable module, with
      `optionAccessor` able to add accessors after load, the 12 accessors, and
      Symbol/String `optionName`.
- [ ] `options.test.ts` ports all 10 cases with Rails-identical names.
- [ ] `pnpm parity:api` reports `options.rb` complete (generated accessors are
      credited however the repo credits `define_method` loops), and the call
      gates add no row.
