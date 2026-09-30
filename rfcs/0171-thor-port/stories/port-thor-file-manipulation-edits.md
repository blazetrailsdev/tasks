---
title: "Port Thor's file-editing actions (chmod, prepend / append_to_file, inject_into_class / module, gsub_file, (un)comment_lines, remove_file)"
status: ready
updated: 2026-09-30
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps: ["port-thor-inject-into-file", "ruby-compat-async-fs-verbs-for-thor-actions"]
deps-rfc: []
est-loc: 300
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/thor/v1.3.2/lib/thor/actions/file_manipulation.rb`: `chmod` (`:145-153`), `prepend_to_file` / `prepend_file`
(`:170-175`), `append_to_file` / `append_file` (`:192-197`), `inject_into_class` (`:216-220`),
`inject_into_module` (`:239-243`), `gsub_file` (`:262-275`), `uncomment_lines` (`:289-293`),
`comment_lines` (`:308-312`) and `remove_file` / `remove_dir` (`:325-335`). Rails calls
`remove_file` / `remove_dir` 41 times, `gsub_file` 9 times, `append_to_file` 12 times and
`inject_into_class` once.

## Fidelity traps (predicted at authoring)

- [ ] **`config[:after] = /\A/`** mutates the caller's hash (`args << config`).
- [ ] **`gsub_file`'s guard**: `return unless behavior == :invoke || config.fetch(:force, false)`,
      and `content.gsub!(flag, *args, &block)` (either a replacement string or a block; Ruby
      backreferences `\1` in the string). Go through ruby-compat's `gsub`.
- [ ] **`uncomment_lines`**: `flag.respond_to?(:source) ? flag.source : flag`, then
      `/^(\s*)#[[:blank:]]?(.*#{flag})/`. `[[:blank:]]` is a POSIX class, `[ \t]` in JS.
- [ ] **`comment_lines`**: `/^(\s*)([^#\n]*#{flag})/` → `'\1# \2'`.
- [ ] **`remove_file`** checks `File.exist?(path) || File.symlink?(path)` (a dangling symlink is
      removed), and uses `rm_rf`.
- [ ] **`inject_into_class`**' regex `/class #{klass}\n|class #{klass} .*\n/` is written for
      Ruby source. For a TS class declaration (`export class Foo extends Bar {`), the second
      alternative matches too. Assert that on a generated TS file.

## Acceptance criteria

- [ ] These members read complete in `parity:api --package thor`.
- [ ] The RSpec port is `port-thor-file-manipulation-spec-part-2`.
