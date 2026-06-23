---
title: "FileStore#deleteEntry prunes empty parent directories (Rails delete_empty_directories)"
status: claimed
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-06-23T14:02:38Z"
assignee: "file-store-delete-prune-empty-directories"
blocked-by: null
---

## Context

`FileStore.deleteEntry` (`packages/activesupport/src/cache/file-store.ts`) only
unlinks the target file. Rails `delete_entry` (`file_store.rb:131-145`) unlinks
the file **and** then calls `delete_empty_directories(File.dirname(key))`
(`file_store.rb:194-201`), which recursively removes now-empty intermediate
directories up to — but not including — `cache_path`:

```ruby
def delete_entry(key, **options)
  if File.exist?(key)
    begin
      File.delete(key)
      delete_empty_directories(File.dirname(key))
      true
    ...

def delete_empty_directories(dir)
  return if File.realpath(dir) == File.realpath(cache_path)
  if Dir.children(dir).empty?
    Dir.delete(dir) rescue nil
    delete_empty_directories(File.dirname(dir))
  end
end
```

trails leaves the empty `dir_1/dir_2` (or `a/`) directories behind after a
delete, so the on-disk layout drifts from Rails over time. The existing test
`stores/file-store.test.ts` "delete does not delete empty parent dir" only
asserts that `cache_path` itself survives (which Rails also guarantees via the
`realpath == cache_path` short-circuit), so it does not pin the pruning
behavior. This is a pre-existing deviation, surfaced during PR #3850
(file-store-converge-to-second-unit-entry-storage).

## Acceptance criteria

- `FileStore.deleteEntry` prunes now-empty parent directories after unlinking,
  recursing up to but never removing `cacheDir`, mirroring Rails
  `delete_empty_directories` (stop when the directory equals `cacheDir`).
- Add a test asserting that deleting the sole entry under a nested key (e.g.
  `a/b`) removes the empty `a/` directory while `cacheDir` survives.
- Async-fs-only conventions; no `node:*` imports, no `process.*` refs.
- api:compare / test:compare delta non-negative.
