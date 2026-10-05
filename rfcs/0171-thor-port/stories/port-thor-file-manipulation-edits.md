---
title: "Port Thor's file-editing actions (chmod, gsub_file, (un)comment_lines, remove_file)"
status: done
updated: 2026-10-05
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps:
  - ruby-compat-async-fs-verbs-for-thor-actions
  - port-thor-actions-module
deps-rfc: []
est-loc: 230
priority: 2
pr: trails#8521
claim: "2026-10-05T12:13:23Z"
assignee: "port-thor-file-manipulation-edits"
blocked-by: null
closed-reason: null
---

## Context

`vendor/thor/v1.3.2/lib/thor/actions/file_manipulation.rb`: `chmod` (`:145-153`), `gsub_file` (`:262-275`),
`uncomment_lines` (`:289-293`), `comment_lines` (`:308-312`) and `remove_file` / `remove_dir`
(`:325-335`). Rails calls `remove_file` / `remove_dir` 41 times and `gsub_file` 9 times.

The `insert_into_file` wrappers from the same file (`prepend_to_file`, `append_to_file`,
`inject_into_class`, `inject_into_module`) are ported by `port-thor-inject-into-file`, so this
story does not wait on it.

## Fidelity traps (predicted at authoring)

- [ ] **`gsub_file`'s guard**: `return unless behavior == :invoke || config.fetch(:force, false)`,
      and `content.gsub!(flag, *args, &block)` (either a replacement string or a block; Ruby
      backreferences `\1` in the string). Go through ruby-compat's `gsub`.
- [ ] **`uncomment_lines`**: `flag.respond_to?(:source) ? flag.source : flag`, then
      `/^(\s*)#[[:blank:]]?(.*#{flag})/`. `[[:blank:]]` is a POSIX class, `[ \t]` in JS.
- [ ] **`comment_lines`**: `/^(\s*)([^#\n]*#{flag})/` → `'\1# \2'`.
- [ ] **`remove_file`** checks `File.exist?(path) || File.symlink?(path)` (a dangling symlink is
      removed), and uses `rm_rf`.
- [ ] **Async fs forms** (from `ruby-compat-async-fs-verbs-for-thor-actions`, trails#8318).
      `FileUtils.chmod_R` is `FileUtils.chmodRAsync(mode, list)` (Integer mode only),
      `FileUtils.rm_rf` is `FileUtils.rmRfAsync`, and `File.symlink?` is `File.isSymlinkAsync`.

## Acceptance criteria

- [ ] These members read complete in `parity:api --package thor`.
- [ ] The RSpec port is `port-thor-file-manipulation-spec-part-2`. Its `prepend_to_file` /
      `append_to_file` / `inject_into_class` / `inject_into_module` cases need
      `port-thor-inject-into-file` as well.
