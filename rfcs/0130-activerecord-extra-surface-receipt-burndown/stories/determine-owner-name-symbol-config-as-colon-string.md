---
title: "determine_owner_name branches on a ':name' Symbol config, not a URL sniff"
status: done
updated: 2026-09-24
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 80
priority: 8
pr: trails#8031
claim: "2026-09-24T13:23:13Z"
assignee: "database-selector-session-typed-against-the-rack-session"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `relabel-invented-model-and-relation-helper-permanent-receipts`.
Rails distinguishes a Symbol config from a URL String by type:

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

(`activerecord/lib/active_record/connection_adapters/abstract/connection_handler.rb:282-290`).
trails reads a bare string as the Symbol arm unless it looks like a URL,
through `symbolConnectionName` (`database-configurations.ts`), called from
`ConnectionHandler#determineOwnerName`. CLAUDE.md "A Ruby Symbol is a JS
string" says control flow that turns on `Symbol === x` keeps the leading colon
(`":primary"`) as the discriminator.

## Acceptance criteria

- `determineOwnerName` branches on `isSymbol(config)` (`":name"`) the way
  Rails branches on `config.is_a?(Symbol)`, and `DatabaseConfigurations#resolve`
  takes the same discriminator; callers pass `":primary"`.
- `symbolConnectionName` is deleted.
