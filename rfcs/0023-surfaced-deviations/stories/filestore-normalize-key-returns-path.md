---
title: "FileStore#normalize_key returns the file path; drop the invented keyToPath helper"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
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
closed-reason: "Already converged: cache/file-store.ts:239 overrides normalizeKey to return the full file path (super.normalizeKey -> encodeWwwFormComponent -> FILEPATH_MAX_SIZE split -> joined under cachePath), matching file_store.rb:162-172, so the *_entry methods receive a path directly; keyToPath is gone repo-wide."
---

## Context

Surfaced by the RFC 0095 call-argument dimension (PR #6334): a `naming` row on
`file_store.rb#delete_entry` turned out to be a structural port deviation, not
an identifier rename.

**Rails.** `FileStore` overrides `normalize_key` to return the FULL FILE PATH
(`activesupport/lib/active_support/cache/file_store.rb:162-172` — it
`URI.encode_www_form_component`s the key, splits it over `FILEPATH_MAX_SIZE`
and joins it under `cache_path`). Every `*_entry` method therefore receives a
path and uses it directly:

    def delete_entry(key, **options)          # file_store.rb:131
      if File.exist?(key)
        File.delete(key)
        delete_empty_directories(File.dirname(key))

    def write_serialized_entry(key, payload, **options)   # file_store.rb:124
      return false if options[:unless_exist] && File.exist?(key)
      ensure_cache_path(File.dirname(key))

**trails.** `normalizeKey` stays logical and each `*_entry` converts on its own
through a private `keyToPath` helper Rails does not have
(`packages/activesupport/src/cache/file-store.ts:104`), called at
`:31` (`readEntry`), `:46`/`:47` (`writeEntry`), and `:57` (`deleteEntry`).

Consequences: an invented helper on a Rails-mirroring file; four call sites
passing a different value than Rails passes; and `deleteEmptyDirectories` is
handed `dirname(keyToPath(key))` where Rails hands it `File.dirname(key)`. Any
caller that already holds a path — `delete_matched` passes `path` directly
(`file_store.rb:96`), `cleanup` passes `fname` (`:44`) — is a double-conversion
waiting to happen.

## Converged shape

Port `normalize_key` per `file_store.rb:162-172` so it returns the path, delete
`keyToPath`, and let `readEntry` / `writeEntry` / `writeSerializedEntry` /
`deleteEntry` use their `key` parameter directly, exactly as Rails does.

## Acceptance criteria

1. `FileStore#normalizeKey` mirrors `file_store.rb:162-172` (encode, the
   `FILEPATH_MAX_SIZE` split, `cache_path` join) and returns the file path.
2. `keyToPath` is gone; no `*_entry` method converts its own `key`.
3. `deleteEntry` calls `deleteEmptyDirectories(dirname(key))` — the Rails
   argument (`file_store.rb:135`).
4. The `file_store` cache tests still pass, and the call-argument rows for
   `file-store.ts` drop out of `pnpm parity:api:calls:args:report`.
