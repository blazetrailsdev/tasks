---
title: "rbFSend on a String receiver answers JS own properties (length is UTF-16 units) instead of the String method table"
status: draft
updated: 2026-10-02
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rbFSend` (`packages/ruby-compat/src/object.ts:361-384`, MRI `rb_f_send`,
`vendor/ruby/v3.3.11/vm_eval.c`) dispatches by walking `Object(recv)`'s
prototype chain for an own property named `mid`. For a JS string primitive
that finds the String wrapper's own `length`, so
`rbFSend("ab𝒶", "length")` answers `4` (UTF-16 units) where Ruby's
`"ab𝒶".send(:length)` answers `3` (`rb_str_length`,
`vendor/ruby/v3.3.11/string.c:2211`).

ruby-compat already ports the character count: `STRING_METHOD_TABLE`'s
`length` / `size` are `strlen(self.string)`
(`packages/ruby-compat/src/string/method-table.ts:105-106`), reached through
`rbStrSend`. `rbFSend` never consults that table for a String receiver, so
every String method whose JS own-property homonym differs (`length`, and any
`String.prototype` method spelled like a Ruby one with different semantics:
`split`, `slice`, `sub`-family names) answers JS's result.

Observed while porting `Thor::Shell::WrappedPrinter#print`
(`vendor/thor/v1.3.2/lib/thor/shell/wrapped_printer.rb:12`,
`words.first.length`), trails#8375.

## Acceptance criteria

- [ ] `rbFSend` on a String receiver dispatches through the String method
      table (`rbStrSend`) before the JS prototype chain, so
      `rbFSend("ab𝒶", "length")` is `3`.
- [ ] A `.trails.test.ts` case pins `length` / `size` on an astral-plane
      string and one `String.prototype` homonym.
