---
title: "rake-file-utils-ext-remaining-commands"
status: draft
updated: 2026-10-30
rfc: "0211-rake-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rake::FileUtilsExt` (`vendor/rake/v13.2.1/lib/rake/file_utils_ext.rb:22-38`) wraps every `FileUtils.commands` entry whose `options_of` includes `verbose` / `noop`, giving it the `verbose_flag` / `nowrite_flag` defaults. trails#9475 ported the wrappers in `packages/rake/src/file-utils-ext.ts` only for the commands ruby-compat's `FileUtils` (`packages/ruby-compat/src/file-utils.ts`) has in async form: `mkdir_p`, `ln`, `cp`, `rm_r`, `rm_rf`, `chmod_R`. `mv`, `rm`, `rm_f`, `touch`, `install`, `mkdir`, `rmdir`, `ln_s`, `ln_sf`, `cp_r`, `chmod`, `chown` and others either exist only as sync calls or are unported, so `FileUtilsExt.mv` and the others get no rake defaults.

## Acceptance criteria

- [ ] ruby-compat `FileUtils` gains async variants (or the async ports) of the remaining `FileUtils.commands` that take `verbose` / `noop` (`vendor/ruby/v3.3.11/lib/fileutils.rb`).
- [ ] `FileUtilsExt` wraps each one, defaulting `verbose: verboseFlag, noop: nowriteFlag` as `file_utils_ext.rb:22-38` does.
