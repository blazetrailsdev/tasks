---
title: "Port the normalize_key double-nested cache"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: 6027
claim: "2026-08-03T21:29:09Z"
assignee: "i18n-normalize-key-cache"
blocked-by: null
closed-reason: null
---

## Context

`normalize_key` (`vendor/i18n/lib/i18n.rb:441-463`) memoizes every split key in
a class-level double-nested cache keyed by separator then key:

```ruby
@@normalized_key_cache = I18n.new_double_nested_cache

def normalize_key(key, separator)
  @@normalized_key_cache[separator][key] ||= ...
end
```

`I18n.new_double_nested_cache` (`i18n.rb:38-40`) builds it. `packages/i18n/src/i18n.ts`
ports the split/coerce body faithfully but has neither the cache nor
`newDoubleNestedCache`, so every `translate` call re-splits and re-coerces its
key. `normalize_keys` is on the hot path — `Backend::Base#lookup`, every
`MissingTranslation#keys`, and `interpolation_keys` all reach it.

`new_double_nested_cache` is `:nodoc:` in the gem but is real surface: it is
the only reason the facade's key handling is not O(key length) per lookup.
Ruby uses `Concurrent::Map`; the JS analogue is a plain `Map` of `Map`s, since
the process-wide config singleton already stands in for `Thread.current`.

## Acceptance criteria

- `newDoubleNestedCache` ported at its Rails name in `i18n.ts`.
- `normalizeKey` reads and writes through it, keyed separator-then-key exactly
  as `i18n.rb:442` does, with the `||=` miss semantics preserved.
- The cache does not survive `resetConfig()` in a way that leaks between test
  files — check against `packages/i18n/src/i18n.test.ts`, which mutates
  `defaultSeparator` indirectly through `config()`.
