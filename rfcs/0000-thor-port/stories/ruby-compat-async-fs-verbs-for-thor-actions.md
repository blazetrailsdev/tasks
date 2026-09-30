---
title: "ruby-compat: async FsAdapter verbs Thor's file actions need (symlink, link, chmod, rm -rf, glob, identical?)"
status: draft
updated: 2026-09-30
rfc: "0000-thor-port"
cluster: null
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 400
priority: 2
pr: null
claim: null
assignee: null
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

- [ ] Each verb is an optional async `FsAdapter` member, implemented by the node adapter and
      by the in-memory adapter the website uses. Each follows the Ruby semantics it stands for:
      `rm_rf` ignores a missing path, and glob's `FNM_DOTMATCH` includes dotfiles but not `.`/`..`.
- [ ] ruby-compat exposes them at their Ruby spellings (`FileUtils.chmodR`, `File.isIdentical`,
      `File.isSymlink`, `Dir.glob(pattern, File.FNM_DOTMATCH)`) as async forms, next to the
      existing sync ones, with `.trails.test.ts` cases on both adapters.
