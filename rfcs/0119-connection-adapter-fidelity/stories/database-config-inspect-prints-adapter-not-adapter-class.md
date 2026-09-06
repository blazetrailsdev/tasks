---
title: "DatabaseConfig#inspect prints adapter=, Rails prints adapter_class="
status: ready
updated: 2026-09-06
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

Rails' `DatabaseConfig#inspect`
(`activerecord/lib/active_record/database_configurations/database_config.rb:21`)
renders the resolved adapter **class**:

```ruby
"#<#{self.class.name} env_name=#{@env_name} name=#{@name} adapter_class=#{adapter_class}>"
```

trails renders the adapter **name** under a different key
(`packages/activerecord/src/database-configurations/database-config.ts`,
`inspect()`):

```ts
`#<${this.constructor.name} env_name=${this.envName} name=${this.name} adapter=${this.adapter}>`;
```

So both the key (`adapter=` vs `adapter_class=`) and the value (`"sqlite3"` vs
the adapter constructor) diverge.

This was blocked before PR #7566: `adapterClass()` returned a Promise
unconditionally, and `inspect()` is synchronous. #7566 retired the sync
companions and made `ConnectionAdapters.resolve` do Ruby's synchronous half
synchronously (`connection_adapters.rb:32-39`), so `adapterClass()` now returns
the class itself once the adapter is loaded — which is the case for any config
that has been through `ConnectionHandler#establishConnection`. The convergence
is now reachable.

## Converged shape

`inspect()` returns
`` `#<${this.constructor.name} env_name=${this.envName} name=${this.name} adapter_class=${adapterClass}>` ``
where `adapterClass` is `this.adapterClass()`. Decide the in-flight arm: while
the `import()` is still pending `adapterClass()` yields a Promise, and printing
one is worse than printing nothing — the likely answer is to render the class
when it is available and fall back to the adapter name otherwise, which keeps
`inspect` total the way Ruby's is. Ruby's `Class#to_s` renders the constant
path, so the TS side wants the constructor's `name`, not the function source.

Related: `sync-reads-of-async-reflection-retire-with-rfc-0073` covers the
in-flight-null remnants generally.

## Acceptance criteria

- [ ] `inspect()` spells the key `adapter_class=`, matching `database_config.rb:21`.
- [ ] It renders the adapter class, not the adapter name string, for a loaded config.
- [ ] The in-flight arm is decided and covered by a test.
- [ ] Green on all three lanes.
