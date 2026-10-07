---
title: "The bare-raise scan behind rails-error-parity is class-blind, line-based and covers four packages"
status: done
updated: 2026-10-07
rfc: "0182-activerecord-error-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: trails#8625
claim: "2026-10-07T12:03:12Z"
assignee: "bare-raise-scan-is-class-blind-line-based-and-four-packages-wide"
blocked-by: null
closed-reason: null
---

## Context

trails#8612 added the `inventedMessage` arm to `blazetrails/rails-error-parity`
(`eslint/rails-error-parity.mjs`), fed by `scanBareRaises`
(`scripts/parity/rails-bare-raises.ts`) through the `bareRaises` key of
`eslint/rails-error-classes.json`. The scan under-reports in four known ways:

- It keys a raise by method name alone. Two classes in one Ruby file that
  define the same method are read as one, so a class either raises with a
  message is dropped for both.
- It reads one line at a time. `raise Foo.new(` with its arguments on the next
  line, and a raise whose message is a heredoc, are not classified.
- It records raises inside a `def` only. A raise in a `define_method` block or
  a class-level block is skipped.
- It runs over activerecord, activemodel, activesupport and arel only
  (`PACKAGES` in `scripts/build-rails-error-manifest.ts`). The actionpack
  family, rack and trailties are not scanned.

`scripts/api-compare/extract-ruby-api.rb#skeleton_raise_class` already reads a
raise's class from the Ripper AST per method and per owner; it does not record
whether the raise carried a message.

## Acceptance criteria

- [ ] The bare-raise set is keyed by owner and method, from the Ripper
      extractor rather than a line regex, or the line scan is shown to match it
      on every scanned file.
- [ ] Multi-line constructions and `define_method` bodies are classified.
- [ ] Each further package is enrolled with its hits converged or filed.
