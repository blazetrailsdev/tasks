---
title: "Port the Disk meta and entity stores (file: / disk: URIs)"
status: draft
updated: 2026-09-29
rfc: "0168-rack-cache-gem-port"
cluster: null
packages: ["rack-cache"]
deps:
  ["port-rack-cache-meta-store-base-and-heap", "port-rack-cache-entity-store-base-heap-and-noop"]
deps-rfc: []
est-loc: 300
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

These are the two filesystem backends. Paths are under `vendor/rack-cache/v1.17.0/lib/rack/cache/`.

- **`MetaStore::Disk` (`meta_store.rb:236-287`).** `initialize(root="/tmp/rack-cache/meta-#{ARGV[0]}")`
  (`:239-242`) runs `File.expand_path` and `FileUtils.mkdir_p(root, mode: 0755)`.
  `read` (`:244-249`) is `Marshal.load` of `key_path(key)`, rescuing
  `Errno::ENOENT, IOError` to `[]`. `write` (`:251-260`) is `Marshal.dump`, and
  on `ENOENT` it `Dir.mkdir`s the parent and **retries once**
  (`retry if (tries += 1) == 1`). `purge` (`:262-268`) unlinks and swallows
  `ENOENT`. Private `key_path` (`:271-273`, `File.join(root, spread(hexdigest(key)))`)
  and `spread(sha, n=2)` (`:275-279`). `self.resolve(uri)` (`:282-285`) uses
  `File.expand_path(uri.opaque || uri.path)`. Constants `DISK`, `FILE` (`:289-290`).
- **`EntityStore::Disk` (`entity_store.rb:83-166`).** `initialize(root)` (`:90-93`).
  `exist?` (`:95`). `read` (`:99-103`) is `File.open(...,'rb') { f.read }` with
  `ENOENT` → `nil`. `Disk::Body < ::File` (`:105-113`) overrides `each` to yield
  8 KiB chunks and aliases `to_path` to `path`. `open` (`:116-120`) returns a
  `Body`. `write` (`:122-138`) slurps into a temp file named
  `buf-<pid>-<thread object_id>` and then `mv`s it to `body_path(key)`, or
  unlinks it if the path already exists. `purge` (`:140-145`). Protected
  `storage_path` / `spread` / `body_path` (`:147-160`). `self.resolve(uri)`
  (`:162-165`). Constants `DISK`, `FILE` (`:168-169`).

trails homes: `File`, `FileUtils`, `Dir` and `Digest::SHA1` from
`@blazetrails/ruby-compat` (`src/file.ts`, `src/file-utils.ts`, `src/digest.ts:91`),
through its `getFs` seat. `Errno::ENOENT` is the ruby-compat error class, not a
Node `code === "ENOENT"` check. The body must answer `to_path`, which Rack's
`Rack::Files` / sendfile path keys on. `Thread.current.object_id` in the temp
name is there to make the name unique. Use the trails execution-context
analogue for it rather than dropping it.

**`Marshal` (RFC Open question 2).** ruby-compat has no `Marshal`. The RFC
recommends activesupport's cache `coder`
(`packages/activesupport/src/cache/coder.ts:104`, exported through
`@blazetrails/activesupport/cache/*`), which adds an `@blazetrails/activesupport`
edge to `packages/rack-cache/package.json` in this PR. That is the same edge
`rack-session` and `rack-test` carry for `Tempfile`. Keep the Rails call names
at the call sites.

Tests:

- `test/entity_store_test.rb` `Disk` (`:113-192`): 3 own cases, plus the shared
  `RackCacheEntityStoreImplementation` cases re-run against Disk. They add no new
  names.
- `test/meta_store_test.rb` `Disk` (`:374-384`): the shared
  `RackCacheMetaStoreImplementation` cases re-run against Disk.

Both need `create_temp_directory` / `remove_entry_secure`
(`test/test_helper.rb:196-213`). Port them as test support in this package,
over ruby-compat's `Dir.tmpdir`.

## Acceptance criteria

- [ ] `src/meta-store.ts` and `src/entity-store.ts` gain `Disk` (with
      `Disk::Body`) and the `DISK` / `FILE` constants, async, over ruby-compat
      file APIs, including the retry-once `write` arm.
- [ ] The Marshal decision is implemented as RFC Open question 2 recommends,
      or the PR states why not and updates the RFC.
- [ ] The Disk describes in `meta-store.test.ts` and `entity-store.test.ts` call
      the shared behaviours, and the 3 Disk-specific cases are ported with
      Rails-identical names.
- [ ] `pnpm parity:api` reports both `Disk` classes complete, and the call gates
      add no row.
