---
title: "sqlite3: pragmas option gating, warning text and value coercion diverge from Rails"
status: draft
updated: 2026-07-28
rfc: "0023-surfaced-deviations"
cluster: null
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

Surfaced while retiring the legacy sqlite3 adapter test (PR #5497). The
trails `pragmas` connection-option handling diverges from Rails on three
points, and the divergence is now enshrined in tests at
`packages/activerecord/src/adapters/sqlite3/sqlite3-adapter.trails.test.ts:83-138`
("SQLite3Adapter pragmas option").

Rails —
`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:837-844`:

```ruby
pragmas = @config.fetch(:pragmas, {}).stringify_keys
DEFAULT_PRAGMAS.merge(pragmas).each do |pragma, value|
  if ::SQLite3::Pragmas.method_defined?("#{pragma}=")
    @raw_connection.public_send("#{pragma}=", value)
  else
    warn "Unknown SQLite pragma: #{pragma}"
  end
end
```

Trails — `packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:3055-3064`:

1. Rails gates on `SQLite3::Pragmas.method_defined?` (is this a real
   pragma?); trails gates on a **name regex** and warns
   `invalid SQLite pragma name`. Different predicate, different message.
2. Trails adds an **unsafe-characters check on string values** with a
   `unsafe characters` warning. Rails has no value validation — it hands
   the value to the typed ruby-sqlite3 setter.
3. Trails coerces booleans to `"1"` / `"0"` and numbers via `String(value)`
   before interpolating. Rails passes the raw value to a typed setter.
4. Trails does not merge over a `DEFAULT_PRAGMAS` constant on this path.

Note the host class is the pre-RFC-0026 `AbstractSQLite3Adapter` /
`BetterSQLite3Adapter` in `connection-adapters/`, so this may need to be
sequenced with (or folded into) the RFC-0026 adapter-layout convergence.

## Acceptance criteria

- [ ] `pragmas` option handling matches Rails: merge over `DEFAULT_PRAGMAS`,
      gate on whether the pragma is real (not a name regex), and emit
      Rails' `Unknown SQLite pragma: <name>` message.
- [ ] The trails-only unsafe-string-value check is either removed as a
      trails invention or justified at the call site per
      "justify deviations at the call site".
- [ ] Value coercion converges on Rails' behavior.
- [ ] `sqlite3-adapter.trails.test.ts` "SQLite3Adapter pragmas option"
      tests are updated to the converged behavior, or replaced by
      Rails-named tests if a Rails counterpart exists.
