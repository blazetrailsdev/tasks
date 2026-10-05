---
title: "activerecord: SchemaCache._load_from reads YAML through Psych.unsafe_load with no rescue"
status: ready
updated: 2026-10-05
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
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

Left over from `activerecord-converge-missing-control-flow-arms-connection-adapters-part-2`.
`pnpm parity:api:arms:report --package=activerecord --direction=missing` still shows:

- `connection-adapters/schema-cache.ts#_loadFrom` — `-if +try +rescue`

Rails (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/schema_cache.rb:228-242`):

```ruby
def self._load_from(filename)
  return unless File.file?(filename)

  read(filename) do |file|
    if filename.include?(".dump")
      Marshal.load(file)
    else
      if YAML.respond_to?(:unsafe_load)
        YAML.unsafe_load(file)
      else
        YAML.load(file)
      end
    end
  end
end
```

The port (`packages/activerecord/src/connection-adapters/schema-cache.ts`, `static _loadFrom`) differs
in two ways:

- The YAML arm does not go through `Psych`. It calls the `yaml` package's `parse` with the file-local
  `RUBY_OBJECT_TAGS` custom tags and then builds a `SchemaCache` by hand with `initWith`, so there is
  no `respond_to?(:unsafe_load)` arm. `Psych.unsafeLoad` exists
  (`packages/ruby-compat/src/psych.ts:134`); what is missing is `ToRuby` reviving
  `!ruby/object:ActiveRecord::ConnectionAdapters::SchemaCache` (and the column / index / type-metadata
  classes in `RUBY_OBJECT_CLASSES`) through `init_with`, which is what Rails' `unsafe_load` does.
- The whole body sits in a `try { … } catch { return null }` Rails does not have: a corrupt or
  unreadable dump raises out of `_load_from` in Rails. It also carries
  `@inventedArm forceEncoding — PERMANENT`; re-check that receipt once the read goes through Psych.

## Acceptance criteria

- [ ] `_loadFrom` is `return unless File.file?`, then `read` with the `.dump` / `respond_to?(:unsafe_load)`
      arms, each a single `Marshal.load` / `YAML.unsafe_load` / `YAML.load` call.
- [ ] No `try` / `catch` in the body; a caller that needs a missing-or-corrupt dump to read as "no
      cache" gets that where Rails gets it (`SchemaReflection#load_cache`, `schema_cache.rb:116-121`).
- [ ] The arms report shows no row for the pair in either direction.
- [ ] `connection-adapters/schema-cache.test.ts` stays green, including the YAML round-trip tests.
