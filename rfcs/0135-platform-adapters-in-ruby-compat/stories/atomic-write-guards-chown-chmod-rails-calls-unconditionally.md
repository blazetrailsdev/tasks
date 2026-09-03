---
title: "atomic_write guards chown/chmod where atomic.rb:41-42 calls both unconditionally"
status: draft
updated: 2026-09-03
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`File.atomic_write` sets the new file's permissions from the old file's stat
with two unconditional calls
(`vendor/rails/activesupport/lib/active_support/core_ext/file/atomic.rb:41-42`):

```ruby
chown(old_stat.uid, old_stat.gid, temp_file.path)
# This operation will affect filesystem ACL's
chmod(old_stat.mode, temp_file.path)
```

trails guards both
(`packages/activesupport/src/core-ext/file/atomic.ts:43-48`):

```ts
if (oldStat.uid != null && oldStat.gid != null) {
  File.chown(oldStat.uid, oldStat.gid, tempFile.path!);
}
if (oldStat.mode != null) File.chmod(oldStat.mode, tempFile.path!);
```

The guards are not a reading of Rails — they exist only because
`FsStatResult` declares `mode`, `uid` and `gid` OPTIONAL
(`packages/ruby-compat/src/fs-adapter.ts:17-26`), so the values do not typecheck
as the `number` `File.chown` / `File.chmod` take. Rails cannot reach that
branch: `File::Stat#uid` / `#gid` / `#mode` are declared readers that always
answer an Integer. The guards predate #7451, which only re-expressed them
over `File.chown` / `File.chmod`.

They are also not merely cosmetic. When a backend omits `uid`/`gid`, trails
silently skips the `chmod` too — the two are welded into one `if` in Rails'
first line but split here, and a stat carrying `mode` but not `uid` loses its
permission copy entirely.

## Converged shape

Ruby's `File.chown` takes `nil` for either id to mean "leave this one
unchanged" — `File.chown(nil, 100, "testfile")` is the documented example at
`vendor/ruby/file.c:2701`, and `to_uid`/`to_gid` (`file.c:2708-2709`) map `nil`
onto `-1`. So the converged signature is
`File.chown(owner: number | null, group: number | null, ...files: string[])`,
and the call site loses its guard.

For `chmod` there is no nil form, so the fix is on the contract side: every
backend that answers a stat answers a mode, and `FsStatResult.mode` should be
required rather than optional. Then `atomic.ts:37-48` is Rails' body with no
guards at all, in Rails' order.

## Acceptance criteria

- `File.chown` accepts `null` for `owner` and/or `group` and passes it through
  as Ruby's "unchanged" sentinel, cited to `vendor/ruby/file.c:2706`.
- `atomicWrite` calls `File.chown` and `File.chmod` unconditionally, in Rails'
  order, with no `!= null` guard between them (`atomic.rb:41-42`).
- `FsStatResult.mode` is required; a backend that cannot answer one is a
  backend that cannot answer a stat.
- No new `call-mismatches` or `call-args` baseline row.
