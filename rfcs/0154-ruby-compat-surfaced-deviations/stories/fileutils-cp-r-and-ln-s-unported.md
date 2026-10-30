---
title: "FileUtils.cp_r and ln_s are unported; thor specs use copyEntry / File.symlink"
status: draft
updated: 2026-10-30
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/thor/v1.3.2/spec/actions/file_manipulation_spec.rb:255-257` and `:471-473` run
`::FileUtils.cp_r(source_root, destination_root)`, and `:271` runs
`::FileUtils.ln_s("invalid_reference", link_path)`. ruby-compat's `FileUtils`
(`packages/ruby-compat/src/file-utils.ts`) ports neither `cp_r`
(`vendor/ruby/v3.3.11/lib/fileutils.rb`, `def cp_r`) nor `ln_s` (`def ln_s`). So
trails#9470 wrote them as `FileUtils.copyEntry(...)` and `File.symlinkAsync(...)` in
`packages/thor/src/actions/file-manipulation.test.ts`.

## Acceptance criteria

- [ ] `FileUtils.cpR(src, dest, options)` and `FileUtils.lnS(src, dest, options)` are ported at
      the MRI names, with MRI's control flow (`cp_r` goes through `copy_entry` per src/dest pair;
      `ln_s` goes through `fu_each_src_dest0` and `File.symlink`).
- [ ] The thor `file-manipulation.test.ts` setup calls `FileUtils.cpR` / `FileUtils.lnS` as the spec
      does.
