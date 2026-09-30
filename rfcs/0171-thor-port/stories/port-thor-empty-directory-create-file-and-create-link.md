---
title: "Port Thor::Actions::EmptyDirectory, CreateFile and CreateLink (conflict check, pretend, encoded filenames)"
status: draft
updated: 2026-09-30
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps: ["port-thor-actions-module", "ruby-compat-async-fs-verbs-for-thor-actions"]
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

- `vendor/thor/v1.3.2/lib/thor/actions/empty_directory.rb` (143): `empty_directory`; `EmptyDirectory` with
  `initialize`, `exists?`, `invoke!`, `revoke!`, and protected `pretend?`, `destination=`
  (`:85-90`), `convert_encoded_instructions` (`:103-108`, `%name%` → `base.send(name)`),
  `invoke_with_conflict_check` (`:113-124`, which rescues `EISDIR` / `EEXIST` into
  `on_file_clash_behavior`), `on_file_clash_behavior`, `on_conflict_behavior`, `say_status`.
- `vendor/thor/v1.3.2/lib/thor/actions/create_file.rb` (105): `create_file` / `add_file`; `CreateFile` with `identical?`
  (a binary compare), `render` (`data.call` memoized), `invoke!`, and protected
  `on_conflict_behavior`, `force_or_skip_or_conflict` (`:86-96`), `force_on_collision?`
  (`:100-102`).
- `vendor/thor/v1.3.2/lib/thor/actions/create_link.rb` (61): `create_link` / `add_link`; `CreateLink < CreateFile` with
  `identical?`, `invoke!` (`symbolic:` default `true`) and `exists?`.

trailties stand-ins: `GeneratorBase#createFile` / `emptyDirectory`
(`packages/trailties/src/generators/base.ts:840-890`), which are **synchronous** and return a
relative path. railties subclasses `CreateFile` in `CreateMigration`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/actions/create_migration.rb:9`), which
trailties copies in `generators/actions/create-migration.ts`.

## Fidelity traps (predicted at authoring)

- [ ] **Async.** `render` may await (a `template` block reads its source asynchronously),
      and so may `identical?` (`File.binread`), `invoke!`, `revoke!`, `invoke_with_conflict_check`
      and `on_conflict_behavior`. `force_on_collision?` awaits `shell.file_collision`.
- [ ] **`force_or_skip_or_conflict` recursion**: `say_status :conflict, :red`, then recurse
      with `(force_on_collision?, true)`. The prompt wiring is the rehomed
      `thor-create-file-conflict-has-no-file-collision-prompt`. This story leaves the recursion in
      place over a `file_collision` that answers `true` until that story lands, and cites it.
- [ ] **`base.options.merge(config)`** takes the config's `force` / `skip` over the host's.
- [ ] **`convert_encoded_instructions`** uses `base.respond_to?(method, true)` (private
      included), which is `rbObjRespondTo(base, m, true)`, then `base.send(method)`.
- [ ] **`String.new(render).force_encoding("ASCII-8BIT")`** vs `File.binread`: compare bytes.
- [ ] **`File.open(destination, "wb", config[:perm])`**: the file mode is applied at creation
      time.
- [ ] **Return values**: `invoke!` returns `given_destination` (not the absolute path), which
      railties' `create_migration` and `copy_file`'s `mode: :preserve` read.

## Acceptance criteria

- [ ] The three files read complete in `parity:api --package thor`.
- [ ] The RSpec port is `port-thor-create-file-link-and-empty-directory-specs`.
