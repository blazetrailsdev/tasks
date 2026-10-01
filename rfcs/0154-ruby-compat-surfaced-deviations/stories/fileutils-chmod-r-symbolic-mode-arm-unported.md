---
title: "FileUtils.chmodRAsync: port fu_mode's symbolic String arm (symbolic_modes_to_i)"
status: draft
updated: 2026-10-01
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

Surfaced by trails#8318. `FileUtils.chmodRAsync(mode, list)`
(`packages/ruby-compat/src/file-utils.ts`) types `mode` as `number` and passes it straight to
`Entry_#chmodAsync`. Ruby's `chmod_R` (`vendor/ruby/v3.3.11/lib/fileutils.rb:1815-1830`) calls
`ent.chmod(fu_mode(mode, ent.path))`, and `fu_mode` (`fileutils.rb:1721-1723`) sends a String
mode (`"u+x"`, `"go-w"`, `"a=rX"`) through `symbolic_modes_to_i`, which resolves it against each
entry's current mode. The verbose line's `mode_to_s` (`fileutils.rb:1726-1728`) prints a String
mode as given. Only the Integer arm is ported.

Thor's `chmod(path, mode, config)` (`vendor/thor/v1.3.2/lib/thor/actions/file_manipulation.rb:145-153`)
forwards whatever mode the caller passes to `FileUtils.chmod_R`, so a generator calling
`chmod "bin/x", "u+x"` has no arm to reach.

## Acceptance criteria

- [ ] `symbolic_modes_to_i` and its helpers (`user_mask`, `mode_mask`, `apply_mask`) are ported as
      module-private functions at their Ruby names, and `fu_mode` / `mode_to_s` with both arms.
- [ ] `chmodRAsync` accepts `number | string`, calls `fuMode(mode, ent.path)` per entry as Ruby
      does, and prints a String mode verbatim under `verbose`.
- [ ] An invalid symbolic mode raises `ArgumentError` with Ruby's message.
- [ ] `.trails.test.ts` cases cover `u+x`, `go-w`, `a=rX` on a file and on a directory, checked
      against `ruby` 3.3.11.
