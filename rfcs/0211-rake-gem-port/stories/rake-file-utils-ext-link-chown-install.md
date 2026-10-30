---
title: "rake-file-utils-ext-link-chown-install"
status: done
updated: 2026-10-30
rfc: "0211-rake-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9500
claim: "2026-10-30T17:56:38Z"
assignee: "rake-file-utils-ext-link-chown-install"
blocked-by: null
closed-reason: null
---

## Context

`Rake::FileUtilsExt` (`vendor/rake/v13.2.1/lib/rake/file_utils_ext.rb:22-38`) wraps every `FileUtils.commands` entry taking `verbose` / `noop`. `packages/rake/src/file-utils-ext.ts` drives that from its `commands` list over ruby-compat's `<name>Async` forms in `packages/ruby-compat/src/file-utils.ts`. Still unported in async form:

- `ln_sr` (`vendor/ruby/v3.3.11/lib/fileutils.rb:731-768`) with `fu_split_path`, `fu_relative_components_from`, `fu_clean_components`, `fu_starting_path?` (`:2505-2552`), and `ln_s`'s `relative:` arm (`:707-709`).
- `cp_lr` (`:627-634`), `link_entry` (`:812-818`), `Entry_#link` (`:2223-2237`).
- `chown` / `chown_R` (`:1838-1876`), `fu_get_uid` / `fu_get_gid` (`:1878-1903`), `Entry_#chown` (`:2215-2221`). The `Etc` name lookup has no Node source.
- `install` (`:1609-1639`), `compare_file` (`:1507-1514`).
- The symbolic String arm of `fu_mode` (`:1721-1723`, `symbolic_modes_to_i` `:1668-1719`) for `chmod` / `chmod_R`.

## Acceptance criteria

- [ ] ruby-compat `FileUtils` has async forms of `ln_sr`, `cp_lr`, `chown`, `chown_R` and `install`, and `lnSAsync` takes `relative`.
- [ ] Each name, and its `symlink`-style aliases, is in `commands` in `packages/rake/src/file-utils-ext.ts`.
- [ ] `chmodAsync` / `chmodRAsync` accept a symbolic mode through `fu_mode`.
