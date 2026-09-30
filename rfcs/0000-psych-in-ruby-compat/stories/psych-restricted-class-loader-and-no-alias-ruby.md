---
title: "Port Psych::ClassLoader, ClassLoader::Restricted, NoAliasRuby and the alias exceptions"
status: draft
updated: 2026-09-29
rfc: "0000-psych-in-ruby-compat"
cluster: fidelity
packages: ["ruby-compat"]
deps:
  ["move-activesupport-yaml-into-ruby-compat-psych", "ruby-compat-constant-table-and-path2class"]
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split out of `psych-load-and-safe-load` for size. `Psych::ClassLoader`
(`vendor/ruby/v3.3.11/ext/psych/lib/psych/class_loader.rb:6-74`) resolves each
of its named constants (`:7-19`, `BIG_DECIMAL` … `SYMBOL`) through
`path2class` (`:51-56`, `ext/psych/psych_to_ruby.c:22`). `ClassLoader::Restricted`
(`:76-101`) raises `DisallowedClass("load", name)` (`psych/exception.rb:23-26`)
for a class outside `permitted_classes`, and for a Symbol outside
`permitted_symbols`. `NoAliasRuby` (`psych/visitors/to_ruby.rb:430-434`) raises
`AliasesNotEnabled` (`exception.rb:10-14`), and `AnchorNotDefined`
(`:17-21`) covers an undefined alias. #8254's `ToRuby` calls `rbPathToClass`
directly, and this story puts `ClassLoader` between them as Psych does.

## Acceptance criteria

- [ ] `Psych.ClassLoader` has `load(klassname)`, the per-constant readers
      (`date`, `symbol`, `psychOmap`, … generated from the `:7-19` list as
      `:36-43` does) and `path2class` over `rbPathToClass`. It is threaded
      through `ToRuby` and `ScalarScanner` the way `to_ruby.rb:23` and
      `scalar_scanner.rb:30` take it.
- [ ] `Psych.ClassLoader.Restricted(classes, symbols)` matches a class by the
      name `rbModName` answers, and a Symbol (a `":name"` string, CLAUDE.md) by
      `permittedSymbols`. Each miss raises with Ruby's message.
- [ ] `Psych.NoAliasRuby` exists, and `BadAlias`, `AliasesNotEnabled` and
      `AnchorNotDefined` carry Ruby's messages.
- [ ] Tests and README rows are added.

## Verification

`pnpm vitest run packages/ruby-compat/src/psych/class-loader*.test.ts`.
