---
title: "Port FileStore's lock_file, atomic write and inspect"
status: done
updated: 2026-08-13
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6443
claim: "2026-08-12T23:16:49Z"
assignee: "port-file-store-lock-file-atomic-write-and-inspect"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while porting FileStore's entry hooks and path helpers in #6437. Three
Rails FileStore members are still missing from
`packages/activesupport/src/cache/file-store.ts`:

- `lock_file(file_name, &block)` — activesupport/lib/active_support/cache/file_store.rb:140-153.
  Opens the file `r+`, takes `File::LOCK_EX`, yields, and unlocks in an `ensure`;
  falls through to a bare `yield` when the file is absent.
- `modify_value` must run inside it — file_store.rb:228 wraps the whole
  read/compare/write in `lock_file(key) do … end`. trails' `modifyValue` does the
  read-modify-write unlocked, so two concurrent `increment`s can lose an update.
- `File.atomic_write(key, cache_path) { |f| f.write(payload) }` in
  `write_serialized_entry` — file_store.rb:135. trails writes straight to the
  destination with `writeFileSync`, so a crash mid-write leaves a truncated
  cache file that `read_entry` then has to reject.
- `inspect` — file_store.rb:97-99,
  `"#<#{self.class.name} cache_path=#{@cache_path}, options=#{@options.inspect}>"`.
  (MemoryStore's `inspect`, memory_store.rb:186-188, is the same gap and can ride
  along.)

The fs-adapter (`packages/activesupport/src/fs-adapter.ts`) has no flock and no
atomic-write primitive today, so both need an adapter addition first — write to a
temp name in the same directory and rename, which is what `File.atomic_write`
does under the hood.

## Acceptance criteria

- `lockFile`, and `modifyValue` running inside it, mirror file_store.rb:140-153
  and :228.
- `writeSerializedEntry` writes atomically (temp file + rename), mirroring
  file_store.rb:135.
- `inspect` on FileStore (and MemoryStore) matches the Rails string.
- `pnpm parity:api` delta non-negative; no new call-mismatch rows.
