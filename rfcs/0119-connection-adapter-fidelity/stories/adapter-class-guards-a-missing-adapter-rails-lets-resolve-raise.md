---
title: "adapter-class-guards-a-missing-adapter-rails-lets-resolve-raise"
status: ready
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
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

`DatabaseConfigurations::DatabaseConfig#adapter_class` has no guard
(`vendor/rails/activerecord/lib/active_record/database_configurations/database_config.rb:17-19`):

```ruby
def adapter_class
  @adapter_class ||= ActiveRecord::ConnectionAdapters.resolve(adapter)
end
```

A nil adapter reaches `resolve`, whose `@adapters[adapter_name.to_s]` lookup
turns it into `""`, misses, and raises `AdapterNotFound` with the
"specifies nonexistent '' adapter. Available adapters are: ..." message
(`connection_adapters.rb:34-39`). `new_connection` (`:25-27`) and `validate!`
(`:29-33`) inherit that behaviour by calling through it.

trails guards first
(`packages/activerecord/src/database-configurations/database-config.ts`), in
both `adapterClass` and `newConnection`:

```ts
if (!this.adapter) {
  throw new Error(`Database configuration missing adapter: ${this.inspect()}`);
}
```

so a config with no adapter raises a bare `Error` carrying a trails-only
message where Rails raises `AdapterNotFound` and names the adapters that ARE
registered. The error class is wrong, the message is invented, and the raise
site is a branch Rails does not have.

Surfaced in review of PR #7243, which added Rails' `@adapter_class` memo to the
same method (`database_config.rb:13,17-19`) but left the guard alone as
pre-existing and out of that story's scope.

Note the truthiness trap while converging: Ruby's `if adapter` in `validate!`
is false only for `nil`/`false`, and an empty-string adapter is truthy there —
so it reaches `resolve` and raises. `!this.adapter` is also true for `""`.

## Acceptance criteria

- [ ] `adapterClass` is the memo and the resolve call, with no missing-adapter
      branch, matching `database_config.rb:17-19`.
- [ ] A config with no adapter raises `AdapterNotFound` with Rails' message
      from `connection_adapters.rb:34-39`, covered by a test.
- [ ] The same guard is removed from `newConnection` (`:25-27`).
- [ ] Green on all three lanes.
