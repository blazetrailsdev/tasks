---
title: "Dispatch I18n::Base intra-module calls through the receiver so an override module is seen"
status: draft
updated: 2026-08-31
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`i18n/test/api/override_test.rb:26-36` — `test "make sure modules can overwrite
I18n methods"` — is the second i18n test PR (port-i18n-remaining-cases) could
not port. It extends a duplicated `I18n` with a module overriding `translate`,
then asserts all four entry points come back reversed:

```ruby
@I18n.extend OverrideInverse   # def translate(key, **options); super(key, **options).reverse; end
assert_equal 'rab', @I18n.translate(:foo, locale: 'en')
assert_equal 'rab', @I18n.t(:foo, locale: 'en')
assert_equal 'rab', @I18n.translate!(:foo, locale: 'en')
assert_equal 'rab', @I18n.t!(:foo, locale: 'en')
```

`translate!` and `t!` reach the override because `I18n::Base#translate!`
(`i18n/lib/i18n/base.rb`) calls `translate(...)` on `self`, and `extend` puts
the module ahead of `Base` in the singleton ancestry.

trails' `packages/i18n/src/i18n.ts:261-267` is a module of top-level functions:
`translateBang` calls the module-scoped `translate` binding directly, so no
receiver-side override can be seen — an ESM namespace has neither `dup` nor a
dispatch chain. `api/override.test.ts` ports only the second case
("make sure modules can overwrite I18n signature"), which replaces `translate`
outright and needs no `super`, and records this gap at its header.

The work is deciding whether `I18n::Base` gets a receiver in trails — e.g.
`this`-typed functions per CLAUDE.md's "Module mixins" section, so
`translateBang` can call `this.translate` the way the Ruby calls `self`'s —
and what that does to the many direct `translate(...)` / `t(...)` call sites
across the repo.

## Acceptance criteria

- `I18n::Base`'s intra-module calls (`translate!` → `translate` at minimum)
  dispatch through the receiver, matching `base.rb`, without breaking the
  direct-import call sites in activemodel / activerecord / activesupport.
- `test "make sure modules can overwrite I18n methods"` is ported verbatim into
  `packages/i18n/src/api/override.test.ts` and passes; the header note naming it
  as unported is deleted.
- `pnpm parity:test --package i18n` shows `api/override_test.rb` at 2/2 and the
  package at 307/307.
