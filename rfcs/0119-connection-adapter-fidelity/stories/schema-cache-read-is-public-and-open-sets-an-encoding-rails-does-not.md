---
title: "SchemaCache.read is public where Rails privatises it, and #open sets an encoding Rails does not"
status: ready
updated: 2026-09-08
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of #7586 (`make-schema-cache-gzip-callers-async`), which
touched both members while making them async. Two deviations in
`packages/activerecord/src/connection-adapters/schema-cache.ts` against
`vendor/rails/activerecord/lib/active_record/connection_adapters/schema_cache.rb`:

1.  **`SchemaCache.read` is public.** Rails declares it and then immediately
    privatises it: `private_class_method :read` (`schema_cache.rb:253`, right
    after the body at `:244-252`). trails' `static read` (`schema-cache.ts:107`)
    carries no `@internal`, so it is public API and measured surface. Its only
    caller is `SchemaCache._loadFrom` (`schema-cache.ts:94`, Rails'
    `_load_from`/`load` at `:238`).

2.  **`SchemaCache#open`'s non-gz arm sets an encoding Rails does not.** Rails
    (`schema_cache.rb:461-473`) is:

        File.atomic_write(filename) do |file|
          if File.extname(filename) == ".gz"
            ...
          else
            yield file
          end
        end

    trails' else arm (`schema-cache.ts:475-477`) calls
    `file.setEncoding(Encoding.UTF_8)` before `block(file)`. Rails' tempfile is
    already in `binmode` from `atomic_write` (`atomic.rb:25`) and it never
    re-encodes; the extra call is a trails invention that changes how the
    non-compressed dump is written.

Both predate #7586.

## Converged shape

Tag `read` `@internal` (its Rails counterpart is `private_class_method`, so
`blazetrails/rails-private-jsdoc` should be requiring this once the manifest
sees it).

The `setEncoding` call cannot be dropped here. It is a symptom, not the
deviation: `File.atomic_write` puts the tempfile in `binmode`
(`atomic.rb:25`), trails' `IO#binmode` faithfully mirrors MRI in setting the
stream's encoding to ASCII-8BIT (`io.ts:457`,
`vendor/ruby/io.c:6349`), and trails' `doWriteconv` (`io.ts:201`) reads that
encoding as "one JS char per byte" and emits latin-1. MRI's ASCII-8BIT stream
only suppresses transcoding, so a UTF-8 String's own bytes go out — which is
why Rails needs no `setEncoding` and trails currently does. Removing the call
reds `schema-cache.trails.test.ts`'s non-gz round trip of a `なまえ` column.

That is tracked as
[[binmode-write-emits-latin1-where-mri-emits-the-strings-own-bytes]], which
converges `IO#write`'s byte path and then deletes this call.

## Acceptance criteria

- [ ] `SchemaCache.read` is `@internal`, matching `private_class_method :read`
      (`schema_cache.rb:253`). The extractor does not model
      `private_class_method`, so the tag is unbacked in
      `eslint/rails-private-methods.json` and carries a
      `@noRailsEquivalent CONVERGEABLE` receipt against
      [[extractor-does-not-model-private-class-method]] until it does.
- [ ] `SchemaCache#open`'s non-gz `setEncoding` is registered against
      [[binmode-write-emits-latin1-where-mri-emits-the-strings-own-bytes]],
      which is what has to converge before the arm can be Rails' bare
      `block(file)` (`schema_cache.rb:470-472`).
- [ ] `schema-cache.test.ts` and `schema-cache.trails.test.ts` keep their names
      and pass, including the non-gz dump/load round trip.
- [ ] `pnpm parity:api:extra:gate` stays green (activerecord's totals should not
      rise; `read` leaving the measured surface may let them fall).
