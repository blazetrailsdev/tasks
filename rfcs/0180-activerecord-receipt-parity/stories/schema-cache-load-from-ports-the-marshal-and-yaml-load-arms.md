---
title: "activerecord: SchemaCache._load_from ports the Marshal and YAML.unsafe_load arms"
status: done
updated: 2026-10-09
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#8703
claim: "2026-10-09T02:02:50Z"
assignee: "schema-cache-load-from-ports-the-marshal-and-yaml-load-arms"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-ca-root` audit: the receipt below was `PERMANENT`, no CLAUDE.md section ratifies it, and it is re-tagged `CONVERGEABLE` onto this story.

`SchemaCache._load_from` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/schema_cache.rb:228-242`) is

```ruby
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
```

trails#8520 (story `ruby-compat-has-no-marshal-for-schema-cache-and-debug`)
ported the `.dump` (Marshal) arm and deleted the `@missingRailsCall load`
receipt; the YAML arm now reads bytes through `File.binread` and
`forceEncoding(file, Encoding.UTF_8)`. `packages/activerecord/src/connection-adapters/schema-cache.ts`'s `_loadFrom` diverged in two further ways:

- The YAML arm calls the npm `yaml` parser directly with a custom-tag table, then builds the cache by hand through `initWith`, where Rails' `YAML.unsafe_load` revives the `!ruby/object:ActiveRecord::ConnectionAdapters::SchemaCache` node itself. activesupport's `yaml.ts` already ports `ToRuby#init_with` revival.
- The whole body sits in a `try` / `catch` that answers `null` for any error. Rails has no rescue here: a corrupt cache file raises.

## Acceptance criteria

- [ ] `_loadFrom` has Rails' guard and both arms in Rails' order, with the YAML arm going through trails' `YAML.unsafe_load` port and no swallowing `catch`.
- [ ] `pnpm parity:api:calls` green with no new row.
- [ ] `packages/activerecord/src/connection-adapters/schema-cache.test.ts` still passes, including the gzip and dump-reload cases.

## Verification

```bash
pnpm parity:api:calls && pnpm vitest run packages/activerecord/src/connection-adapters/schema-cache.test.ts
```
