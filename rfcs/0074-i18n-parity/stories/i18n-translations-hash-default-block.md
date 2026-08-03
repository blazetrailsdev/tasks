---
title: "Converge Simple#translations onto Concurrent::Hash default-block reads"
status: done
updated: 2026-08-03
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 5988
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Simple#translations` returns a plain object:

```ts
// packages/i18n/src/backend/simple.ts
this.translationsStore ??= {};
return this.translationsStore;
```

Rails uses a `Concurrent::Hash` with a **default block** at
`vendor/i18n/lib/i18n/backend/simple.rb:69-75`:

```ruby
@translations ||= Concurrent::Hash.new do |h, k|
  MUTEX.synchronize { h[k] = Concurrent::Hash.new }
end
```

So `translations[:fr]` for an unstored locale returns (and installs) `{}` in
Rails, while ours returns `undefined`. This is already load-bearing in a ported
test: `simple store_translations: do not store translations unavailable locales
if enforce_available_locales is true` asserts `translations[:fr] == {}`
(`vendor/i18n/test/backend/simple_test.rb:153`) and the trails port had to
weaken it to `toBeUndefined()` with a comment.

The mutex has no JS analogue and is correctly dropped — JS has no threads. The
default block does have one (a `Proxy` `get` trap, or a `defaultingHash` helper)
and is what this story converges.

## Acceptance criteria

- Reading a missing locale off `Simple#translations` yields an empty subtree and
  installs it, as the default block does.
- The ported test asserts `toEqual({})` verbatim against Rails rather than
  `toBeUndefined()`, and its deviation comment is deleted.
- The `Object.entries` walks in `availableLocales` / `storeTranslations` still
  see only genuinely-stored locales — a defaulting read must not inflate
  `availableLocales`.
