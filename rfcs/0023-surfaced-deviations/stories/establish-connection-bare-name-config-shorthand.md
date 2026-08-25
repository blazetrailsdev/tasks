---
title: "Support establish_connection bare-name config and port determine_owner_name middle branch"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already done: the determine_owner_name middle branch is ported — connection-adapters/abstract/connection-handler.ts:84-87 resolves a bare config name via symbolConnectionName() into a ConnectionDescriptor."
---

## Context

`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_handler.rb:282-290`:

```ruby
def determine_owner_name(owner_name, config)
  if owner_name.is_a?(String) || owner_name.is_a?(Symbol)
    ConnectionDescriptor.new(owner_name.to_s)
  elsif config.is_a?(Symbol)
    ConnectionDescriptor.new(config.to_s)
  else
    owner_name
  end
end
```

PR #5331 ported the signature but deliberately **not** the middle branch. Ruby
distinguishes the bare-name Symbol (`establish_connection :primary`) from a
String config (a connection URL), which falls through to `owner_name` unchanged.
TS collapses both onto `string`, so `typeof config === "string"` would misread a
URL as a connection name. The parameter is present as `_config` and unused.

The real gap is upstream: `establishConnection`'s declared config union has no
bare-name arm at all, so Rails' `establish_connection :primary` shorthand is
unsupported.

## Acceptance criteria

- `establishConnection` accepts a configuration name and resolves it via
  `configurations.resolve`, distinguishably from a URL string.
- `determineOwnerName` implements the middle branch against that representation
  and `_config` becomes `config`.
