---
title: "file-store-delete-entry-path-conversion-and-rescue"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already converged: cache/file-store.ts:199-214 deleteEntry is file_store.rb:131-145 line for line (existsSync -> unlinkSync -> deleteEmptyDirectories(dirname) -> true; rescue: rethrow if the file still exists, else false), and keyToPath no longer exists repo-wide."
---

## Context

Surfaced while burning down RFC 0096 wave-2 naming rows (PR #6433).

`FileStore#delete_entry`
(`vendor/rails/activesupport/lib/active_support/cache/file_store.rb:131-145`):

```ruby
def delete_entry(key, **options)
  if File.exist?(key)
    begin
      File.delete(key)
      delete_empty_directories(File.dirname(key))
      true
    rescue
      raise if File.exist?(key)
      false
    end
  else
    false
  end
end
```

Rails' `key` **already is the path** — `FileStore#normalize_key` returns the
on-disk path, so `delete_entry` never converts. trails
(`packages/activesupport/src/cache/file-store.ts:62-72`) opens with
`const filePath = this.keyToPath(key)` and works from that, which is why the
RFC 0096 row (`dirname`: Ruby `ref:key` → TS `ref:filePath`) is an a3 finding
rather than a rename.

The port also collapses Rails' two `File.exist?` checks and the `raise if
File.exist?(key)` re-raise into one `try`/`catch {}` that swallows every error,
so a genuine EACCES on a file that still exists returns `false` where Rails
raises.

Converged shape: `normalizeKey` returns the path (so `deleteEntry` takes the
key/path directly and `keyToPath` disappears from this body), the `exists`
guard and the rescue's `raise if File.exist?(key)` are both present, and the
`false` arms are Rails'.

## Acceptance criteria

- [ ] `deleteEntry` mirrors `file_store.rb:131-145` statement for statement:
      the outer `exists` guard, `unlink`, `deleteEmptyDirectories(dirname(key))`,
      `true`, and a rescue that re-raises when the file still exists.
- [ ] No path conversion inside `deleteEntry`; whatever `normalizeKey` hands it
      is what it deletes, as in Rails.
- [ ] A test asserts a delete failure on a still-present file propagates rather
      than returning `false`; it fails on baseline.
- [ ] `pnpm parity:api:calls:args` stays green and the `file-store.ts`
      `delete_entry` naming row is gone.
