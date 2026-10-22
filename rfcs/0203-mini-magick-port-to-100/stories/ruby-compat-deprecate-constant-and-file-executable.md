---
title: "Port Module#deprecate_constant and File.executable? to ruby-compat"
status: claimed
updated: 2026-10-22
rfc: "0203-mini-magick-port-to-100"
cluster: mini-magick-prereqs
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-10-22T19:53:21Z"
assignee: "ruby-compat-deprecate-constant-and-file-executable"
blocked-by: null
---

## Context

The generated mini_magick cannot load:

- `tool.rb:264-272` defines a deprecated subclass per CLI tool with `const_set`
  and then calls `deprecate_constant(tool.capitalize)`. ruby-compat has no
  `Module#deprecate_constant` (`rb_mod_deprecate_constant`,
  `vendor/ruby/v3.3.11/variable.c:3892-3896`, which sets `CONST_DEPRECATED` on
  each name so a later read warns). The generated `tool.ts` calls
  `Tool.deprecateConstant(...)` at load and throws `TypeError`, so no spec file
  loads.
- `Utilities.which` (`utilities.rb:20`) calls `File.executable? exe`.
  ruby-compat's fs adapter already answers the stat bit
  (`packages/ruby-compat/src/fs-adapter.ts`, `isExecutable`, citing
  `file.c:2244`), but `File` does not expose `executable?`.

Patching both in a local copy is what lets 5 of the 40 loading examples pass
today.

## Acceptance criteria

- ruby-compat exports `Module#deprecate_constant` for a class or a ruby-compat
  `Module`: it records the names and answers the receiver, and a read of a
  deprecated constant through ruby-compat's constant lookup warns as
  `rb_const_warn_if_deprecated` (`variable.c`) does.
- `File.executable?` (`rb_file_executable_p`, `file.c`) on ruby-compat's
  `File`, through the fs adapter.
- Each carries its MRI citation and a ruby-compat test.
