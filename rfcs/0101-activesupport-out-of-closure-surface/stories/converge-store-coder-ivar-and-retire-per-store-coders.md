---
title: "Build @coder in Store#initialize and retire the per-store coder stand-ins"
status: done
updated: 2026-08-12
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6437
claim: "2026-08-12T21:56:49Z"
assignee: "converge-store-coder-ivar-and-retire-per-store-coders"
blocked-by: null
closed-reason: null
---

## Context

PR #6435 routed both stores' entry hooks through `serialize_entry` /
`deserialize_entry`, but trails' `Store` has no `@coder` ivar, so each store
names its coder locally instead of receiving it from `Store#initialize`:

- `packages/activesupport/src/cache/file-store.ts` holds a module-level
  `const fileCoder = new Coder(coder, { deflate, inflate })` and spells
  `DEFAULT_COMPRESS_LIMIT = 1024` plus the `options.compress ?? true` default
  in `serializeEntry`.
- `packages/activesupport/src/cache/memory-store.ts` names `DupCoder` directly
  in `serializeEntry`/`deserializeEntry`.

Rails builds the coder once in `Store#initialize`
(`activesupport/lib/active_support/cache.rb:295-312`): `@options[:compress] =
true unless @options.key?(:compress)`, `@options[:compress_threshold] ||=
DEFAULT_COMPRESS_LIMIT` (`:45`), `@coder = @options.delete(:coder) { Cache::Coder.new(serializer, compressor, ...) }`
and `@coder_supports_compression = @coder.respond_to?(:dump_compressed)`.
`MemoryStore#initialize` then overrides it — `options[:coder] = DupCoder unless
options.key?(:coder) || options.key?(:serializer)` and `options[:compress] ||=
false` (`memory_store.rb:72-76`). `serialize_entry` dispatches on
`@coder_supports_compression && options[:compress]` (`cache.rb:806-813`).

## Converged shape

`Store#initialize` builds `@coder`, sets the two compress defaults and computes
`coderSupportsCompression`; `serializeEntry`/`deserializeEntry` move to `Store`
and read `this.coder`. `MemoryStore#initialize` installs `DupCoder` and defaults
`compress` to false; `FileStore` inherits the default coder. The module-level
`fileCoder` constant, the FileStore-local `DEFAULT_COMPRESS_LIMIT` and the
per-store `serializeEntry`/`deserializeEntry` copies are deleted.

Sequenced with `port-cache-store-coder-and-serializer-layer` and
`converge-store-serialized-entry-hooks-and-file-store-paths`, which own the
Store-side halves; this story is the cleanup that retires the per-store
stand-ins once those land.

## Acceptance criteria

- [ ] `@coder`, the `:compress` / `:compress_threshold` defaults and
      `coder_supports_compression` live on `Store`, at the Rails names.
- [ ] `MemoryStore#initialize` installs `DupCoder` and defaults `compress` to
      false (memory_store.rb:72-76).
- [ ] `fileCoder`, the FileStore `DEFAULT_COMPRESS_LIMIT` and the duplicated
      per-store `serializeEntry`/`deserializeEntry` are gone.
- [ ] `pnpm parity:api` delta non-negative.
