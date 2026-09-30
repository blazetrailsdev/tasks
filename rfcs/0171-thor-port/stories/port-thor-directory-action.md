---
title: "Port Thor::Actions#directory and Actions::Directory (recursive copy with .tt rendering and .empty_directory)"
status: draft
updated: 2026-09-30
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps: ["thor-actions-template-is-unported"]
deps-rfc: []
est-loc: 350
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/thor/v1.3.2/lib/thor/actions/directory.rb` (108 lines): `directory(source, *args, &block)`, and `Directory <
EmptyDirectory` with `initialize` (`:58-62`, `File.expand_path(Dir[Util.escape_globs(...)].first)`),
`invoke!` (which `base.empty_directory`s first), `revoke!`, and protected `execute!`
(`:75-97`), `file_level_lookup` and `files` (`Dir.glob(lookup, File::FNM_DOTMATCH)`). Rails
uses `directory` 23 times, most of them in `AppGenerator` (`app`, `bin`, `config`, `db`, ...).

## Fidelity traps (predicted at authoring)

- [ ] **`files(lookup).sort`** is bytewise. So is glob order: Ruby's `Dir.glob` is unsorted, and
      Thor sorts it.
- [ ] **`file_source.gsub(source, ".")`** is a String pattern gsub (literal, every occurrence).
      JS `replace` with a string replaces once, so use `replaceAll` or an escaped regex.
- [ ] **`/#{TEMPLATE_EXTNAME}$/`**: `.tt` sources go through `base.template(file_source,
file_destination[0..-4], config, &@block)`, and the rest through `copy_file`. Both receive the
      block.
- [ ] **`.empty_directory` markers** create the parent directory, and are skipped when the
      directory is the destination root itself.
- [ ] **`config[:exclude_pattern]`** is a Ruby Regexp and `recursive: false` stops at one level.
- [ ] **`Util.escape_globs`** before globbing (the `app{1}` fixture).

## Acceptance criteria

- [ ] `directory.rb` reads complete in `parity:api --package thor`.
- [ ] `vendor/thor/v1.3.2/spec/actions/directory_spec.rb` (20) is ported.

## Cases to port (20)

`vendor/thor/v1.3.2/spec/actions/directory_spec.rb`:

- `#invoke! > raises an error if the source does not exist` (`:38`)
- `#invoke! > does not create a directory in pretend mode` (`:44`)
- `#invoke! > copies the whole directory recursively to the default destination` (`:49`)
- `#invoke! > copies the whole directory recursively to the specified destination` (`:54`)
- `#invoke! > copies only the first level files if recursive` (`:59`)
- `#invoke! > ignores files within excluding/ directories when exclude_pattern is provided` (`:72`)
- `#invoke! > copies and evaluates files within excluding/ directory when no exclude_pattern is present` (`:78`)
- `#invoke! > copies files from the source relative to the current path` (`:85`)
- `#invoke! > copies and evaluates templates` (`:92`)
- `#invoke! > copies directories and preserves file mode` (`:99`)
- `#invoke! > copies directories` (`:106`)
- `#invoke! > does not copy .empty_directory files` (`:113`)
- `#invoke! > copies directories even if they are empty` (`:119`)
- `#invoke! > does not copy empty directories twice` (`:125`)
- `#invoke! > logs status` (`:130`)
- `#invoke! > yields a block` (`:138`)
- `#invoke! > works with glob characters in the path` (`:146`)
- `#invoke! > works with windows temp dir` (`:161`)
- `#revoke! > removes the destination file` (`:171`)
- `#revoke! > works with glob characters in the path` (`:180`)
