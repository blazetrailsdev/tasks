---
title: "foreign_key_name's absent-:column guard raises ArgumentError where Ruby fetch raises KeyError"
status: draft
updated: 2026-08-31
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
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

Surfaced while sweeping `Array()` call sites for PR #7298 (RFC 0119,
`wrap-nil-column-lists-with-ruby-array-semantics`).

Rails' `foreign_key_name`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:1755-1760`)
reads the column with a **`fetch`**:

```ruby
def foreign_key_name(table_name, options)
  options.fetch(:name) do
    columns = Array(options.fetch(:column)).map(&:to_s)
    identifier = "#{table_name}_#{columns.join("_and_")}_fk"
    hashed_identifier = OpenSSL::Digest::SHA256.hexdigest(identifier).first(10)
    "fk_rails_#{hashed_identifier}"
  end
end
```

`options.fetch(:column)` with no default raises **`KeyError`** —
`key not found: :column` — when the key is absent.

trails
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts`,
`foreignKeyName`) raises a different class with an invented message instead:

```ts
if (options.column === undefined) {
  throw new ArgumentError(`foreign_key_name requires either :name or :column to be specified`);
}
```

Two divergences in one guard:

1. **Wrong error class.** `ArgumentError` where Rails raises `KeyError`. The
   repo already has `KeyError` from `@blazetrails/activesupport` (it is
   imported into this very file for other `fetch` ports).
2. **Wrong message.** The string is trails-authored prose with no Rails
   counterpart; Ruby's is `key not found: :column`.

Note the outer `options.fetch(:name) do ... end` half is also a `fetch`-with-block,
so a **stored `nil`/`false` under `:name`** returns that stored value in Rails
rather than falling through to the hash computation — check the TS `if
(options.name)` guard against that arm too while converging
(CLAUDE.md's "`fetch` vs `??`" idiom class, RFC 0082).

## Acceptance criteria

- [ ] The absent-`:column` arm raises `KeyError` with Ruby's
      `key not found: :column` message, not `ArgumentError` with invented prose.
- [ ] The `options.fetch(:name)` arm is checked against Ruby `fetch` semantics
      (a stored `nil`/`false` is returned, not treated as absent) and converged
      or, if it already matches, left alone.
- [ ] A test covers the absent-`:column` raise; `addForeignKey` callers stay green.
