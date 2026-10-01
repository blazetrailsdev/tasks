---
title: "ruby-compat: async FsAdapter verbs Thor's file actions need (symlink, link, chmod, rm -rf, glob, identical?)"
status: done
updated: 2026-10-01
rfc: "0171-thor-port"
cluster: null
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 400
priority: 2
pr: trails#8318
claim: "2026-10-01T12:09:57Z"
assignee: "red-26ed9b2d"
blocked-by: null
closed-reason: null
---

## Context

Thor's actions reach the filesystem through Ruby's `File` / `FileUtils` / `Dir`
synchronously. trails' Thor port reads through the async `getFs()` adapter, because the
website runs generators against an in-memory fs (trails#8269 made `find_in_source_paths`
async for that reason). The async half of `FsAdapter`
(`packages/ruby-compat/src/fs-adapter.ts`) has `exists`, `stat`, `lstat`, `readFile`,
`writeFile`, `unlink`, `rename`, `mkdtemp`, `realpath`, `rmdir`, `readdir` and `mkdir`. It has
no async:

- `symlink` / `link` — `CreateLink#invoke!` (`vendor/thor/v1.3.2/lib/thor/actions/create_link.rb:40-54`:
  `File.symlink` / `File.link`, `File.unlink`);
- `chmod` — `chmod` (`vendor/thor/v1.3.2/lib/thor/actions/file_manipulation.rb:145-153`: `FileUtils.chmod_R`), and
  `copy_file`'s `mode: :preserve` (`:30-33`: `File.stat(source).mode`);
- recursive remove — `EmptyDirectory#revoke!` and `remove_file`
  (`vendor/thor/v1.3.2/lib/thor/actions/empty_directory.rb:56-61`, `file_manipulation.rb:325-334`: `FileUtils.rm_rf`);
- glob with `File::FNM_DOTMATCH` — `Directory#files` (`vendor/thor/v1.3.2/lib/thor/actions/directory.rb:103-105`),
  and `Dir[...]` in `Directory#initialize` (`:59`);
- `File.identical?` — `CreateLink#identical?` (`create_link.rb:35-38`);
- `File.symlink?` — `CreateLink#exists?` (`:56-58`), `remove_file` (`:330`);
- binary write with a permission — `CreateFile#invoke!` (`create_file.rb:64`:
  `File.open(destination, "wb", config[:perm])`).

## Acceptance criteria

- [ ] `symlink`, `link` and `chmod` are optional async `FsAdapter` members, implemented by the
      node adapter. The in-memory adapter the website uses stores path and text only, so it has
      none of the three: `File.symlinkAsync` / `File.linkAsync` raise `NotImplementedError`
      there, as MRI does on a platform without the syscall
      (`vendor/ruby/v3.3.11/file.c:3069,3099`), and `chmod` is a no-op.
- [ ] Glob and recursive remove are not adapter members. They walk through the adapter's
      existing `readdir` / `lstat` / `exists` / `unlink` / `rmdir`, which the in-memory adapter
      implements, so each has one implementation.
- [ ] Each follows the Ruby semantics it stands for. `rm_rf` ignores a missing path and, under
      `force`, skips an entry it cannot remove and continues
      (`vendor/ruby/v3.3.11/lib/fileutils.rb:1449-1456`). Glob's `FNM_DOTMATCH` includes
      dotfiles and never `..`; it does include `.` for the first directory read, as MRI does:
      `Dir.glob("g/*", File::FNM_DOTMATCH)` answers `g/.` (`vendor/ruby/v3.3.11/dir.c:2705-2713`).
- [ ] ruby-compat exposes the async forms with an `Async` suffix, next to the sync ones, with
      `.trails.test.ts` cases on both adapters. A sync static cannot simply become async:
      `Dir.glob` is called from constructors (`activerecord/src/fixtures.ts:280`,
      `activesupport/src/file-update-checker.ts:28`). The members the dependent Thor stories
      call are `File.isIdenticalAsync`, `File.isSymlinkAsync`, `File.symlinkAsync`,
      `File.linkAsync`, `File.chmodAsync`, `Dir.childrenAsync`,
      `Dir.globAsync(pattern, File.FNM_DOTMATCH)`, `FileUtils.rmRAsync`, `FileUtils.rmRfAsync`,
      `FileUtils.removeEntryAsync` and `FileUtils.chmodRAsync(mode, list)` (Integer mode only).
      Binary write with a permission is the adapter's existing `writeFile(path, bytes, { mode })`.
