---
title: "Converge resolve's :object handling onto Hash#delete semantics"
status: ready
updated: 2026-08-03
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Base#resolve`'s Proc branch reads `:object` without removing it from the
caller's hash:

```ts
// packages/i18n/src/backend/base.ts — resolve()
const dateOrTime = options.object ?? object;
const rest = except(options, "object");
```

Rails **mutates** the caller's options at
`vendor/i18n/lib/i18n/backend/base.rb:158-160`:

```ruby
date_or_time = options.delete(:object) || object
resolve(locale, object, subject.call(date_or_time, **options))
```

`Hash#delete` strips `:object` from the hash the caller still holds, so every
later read in that same `translate` call sees it gone. The trails version leaves
the caller's `options` intact and passes a copy down.

Not observable today because the only caller that passes `:object` is
`localize` (`base.rb:80-84`), which is not ported yet — it lands with
[[i18n-backend-file-loading-localize]]. It becomes a live divergence the moment
`localize` exists.

Note `||` vs `??`: Ruby's `||` also falls through on `false`, JS `??` does not.
Converge that arm at the same time.

## Acceptance criteria

- The Proc branch removes `:object` from the options object the caller passed,
  matching `Hash#delete` semantics, rather than building a copy.
- The `options.object ?? object` fallback follows Ruby `||` truthiness
  (`false` falls through to `object`).
- A test asserts a Proc default sees the mutated hash, i.e. `:object` is absent
  from the options forwarded to it.
