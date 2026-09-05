---
title: "FsStatResult.uid/gid are optional, forcing ?? null at atomic_write's chown where atomic.rb:41 passes the readers straight through"
status: in-progress
updated: 2026-09-04
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 31
pr: 7498
claim: "2026-09-04T23:14:52Z"
assignee: "delete-the-degenerate-fs-async-accessors"
blocked-by: null
closed-reason: null
---

## Context

`FsStatResult.mode` became required in #7480, on the reading that
`File::Stat#mode` is a declared reader that always answers an Integer
(`vendor/ruby/file.c`), so a backend that cannot answer one is a backend that
cannot answer a stat. `uid` and `gid` are the same kind of reader —
`rb_stat_uid` / `rb_stat_gid` (`vendor/ruby/file.c:1122,1140`) always answer an
Integer too — but they were left OPTIONAL
(`packages/ruby-compat/src/fs-adapter.ts:25-26`).

The cost is at `atomic_write`'s chown call site, which is otherwise Rails'
body verbatim (`vendor/rails/activesupport/lib/active_support/core_ext/file/atomic.rb:41`):

```ruby
chown(old_stat.uid, old_stat.gid, temp_file.path)
```

```ts
File.chown(oldStat.uid ?? null, oldStat.gid ?? null, tempFile.path!);
```

The two `?? null`s are not a reading of Rails — Rails passes the stat's readers
straight through. They exist only because the optional fields do not typecheck
against the `number | null` `File.chown` takes, and they route a
backend-answered-nothing through the same "leave unchanged" sentinel Ruby
reserves for an explicit `nil`.

## Converged shape

`FsStatResult.uid` and `FsStatResult.gid` become required, the way `mode` did.
`atomic.ts:22` is then `File.chown(oldStat.uid, oldStat.gid, tempFile.path!)`,
character-for-character `atomic.rb:41`.

`File.chown`'s `number | null` signature STAYS — that is the `to_uid` /
`to_gid` nil arm (`vendor/ruby/file.c:2661,2670`), an explicit
`File.chown(nil, 100, "testfile")` (`file.c:2698`), and is unrelated to what a
stat answers.

Every backend that builds an `FsStatResult` literal has to fill both fields;
today the only such site outside tests is
`packages/website/src/lib/frontiers/vfs-generator.ts:65-79`, which #7480
already had to update for `mode`.

## Acceptance criteria

- `FsStatResult.uid` and `FsStatResult.gid` are required.
- `atomicWrite`'s chown call passes `oldStat.uid` / `oldStat.gid` with no `??`.
- Every `FsStatResult` construction site answers both, `vfs-generator.ts`
  included.
- No new `call-mismatches` or `call-args` baseline row.
