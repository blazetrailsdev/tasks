---
title: "Port I18n::Backend::CacheFile and retire its unported-files row"
status: draft
updated: 2026-10-21
rfc: "0193-small-gem-ports-parity-100"
cluster: small-residuals
packages: ["i18n"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`I18n::Backend::CacheFile` (`vendor/i18n/v1.14.8/lib/i18n/backend/cache_file.rb`,
36 lines) is unported, and its `unported-files` row
(`scripts/parity/unported-files/i18n.ts:16-21`) still reads
"Pre-1.0: optional backend mixin — caches parsed translation files on disk."

That reason predates CLAUDE.md § "A translation lookup is synchronous; the load
is an awaited step" (trails#9180), which ruled the sibling `backend/cache.rb`
permanently unported for a specific reason: its `_fetch` reads an
`ActiveSupport::Cache` store _inside the lookup_. `CacheFile` does not do that.
It overrides `load_file` only:

```ruby
def load_file(filename)
  initialized = !respond_to?(:initialized?) || initialized?
  key = I18n::Backend::Flatten.escape_default_separator(normalized_path(filename))
  old_mtime, old_digest = initialized && lookup(:i18n, key, :load_file)
  return if (mtime = File.mtime(filename).to_i) == old_mtime ||
            (digest = OpenSSL::Digest::SHA256.file(filename).hexdigest) == old_digest
  super
  store_translations(:i18n, load_file: { key => [mtime, digest] })
end
```

Everything it touches is load-time and synchronous in the gem: `File.mtime`,
an OpenSSL SHA256 file digest, `lookup`, `super` and `store_translations`. In
trails the load chain is already the awaited one (`setLoadPath` /
`reloadBang` / `eagerLoadBang`, `packages/i18n/src/i18n.ts:127`, `:139`,
`:144`), which is exactly where a `load_file` override belongs. So this file
is portable, and its row is ordinary unported-file debt with no owner rather
than a permanent limit.

Raised as a note by the reviewer of trails#9180 and deliberately left out of
that PR's scope.

## Converged shape

`packages/i18n/src/backend/cache-file.ts` ports the module's two members at
their Rails names — `loadFile` and the protected `normalizedPath`, plus the
`pathRoots` accessor — as a plain-object module (§ "A Ruby module is a plain
object or a class module"), mixed into a backend with `include()`. The file
digest is Node's `crypto` SHA256 over the file's bytes, which is MRI's
`OpenSSL::Digest::SHA256.file(...).hexdigest`. The `unported-files` row for
`backend/cache_file.rb` and its `testFile` row are then deleted, in both
`i18n.ts` and `baseline.json` (a genuine retirement, which that baseline's
comment allows), and `vendor/i18n/v1.14.8/test/backend/cache_file_test.rb` is
ported alongside.

Note `load_file` is `protected` in the gem, so the port carries `@internal`
per `blazetrails/rails-private-jsdoc`.

## Acceptance criteria

- [ ] `backend/cache_file.rb` reports 100% methods in `pnpm parity:api --package i18n`.
- [ ] `cache_file_test.rb` is ported and passes; `pnpm parity:test` i18n stays
      at 100% with the new file counted.
- [ ] Both unported-files rows are deleted from the shard and from
      `baseline.json` in the same commit.
- [ ] `pnpm parity:api:extra:gate` stays green for i18n — any new name without
      a gem counterpart is receipted, not marked.
