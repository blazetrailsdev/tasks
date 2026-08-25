---
title: "Render #inspect with the Ruby namespaced class name"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6092
claim: "2026-08-04T20:56:04Z"
assignee: "i18n-date-subx-cb-decomposition"
blocked-by: null
closed-reason: null
---

# `#inspect` renders the bare TS class name, not the Ruby namespaced one

## Context

- `I18n::Locale::Fallbacks#inspect` renders `self.class.name`
  (`i18n/lib/i18n/locale/fallbacks.rb:86-88`), which in Ruby carries the module
  nesting: `#<I18n::Locale::Fallbacks @map={…} @defaults=[…]>`.
- `packages/i18n/src/locale/fallbacks.ts`'s `inspect()` uses
  `this.constructor.name`, which has no nesting, so it renders
  `#<Fallbacks @map={…} @defaults=[…]>`. The ported test records the
  divergence: `packages/i18n/src/locale/fallbacks.test.ts` (`"#inspect"`)
  asserts the bare name, against `i18n/test/locale/fallbacks_test.rb:182`,
  which asserts the namespaced one.
- This is the same class of gap `project_rails_class_name_lives_on_error_name_not_constructor`
  covers for errors, where the fix was to carry the Rails name explicitly
  rather than read it off the constructor. `[[i18n-inspect-hash-ruby-rendering]]`
  and `[[i18n-inspect-string-ruby-escapes]]` converged the value rendering in
  the same file family; this is the receiver name.

## Acceptance criteria

- `Fallbacks#inspect` renders `#<I18n::Locale::Fallbacks …>`, and the ported
  `"#inspect"` case asserts the gem's string verbatim.
- The mechanism generalises (a declared Rails name, not a hardcoded literal in
  one method), so sibling ported classes can carry theirs the same way.
