---
title: "converge-version-state-and-full-version-string"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6107
claim: "2026-08-05T00:47:03Z"
assignee: "i18n-date-valid-ordinal-civil-negative-fields"
blocked-by: null
closed-reason: null
---

# `Version` stores the raw string and has no `full_version_string`

## Context

`AbstractAdapter::Version`
(vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:243-259):

```ruby
attr_reader :full_version_string

def initialize(version_string, full_version_string = nil)
  @version = version_string.split(".").map(&:to_i)
  @full_version_string = full_version_string
end

def to_s
  @version.join(".")
end
```

`packages/activerecord/src/connection-adapters/abstract-adapter.ts`'s `Version`
takes one argument, keeps the original string in `_version` and the parsed
parts in `_parts`, returns `_version` from `toString()`, and has no
`fullVersionString` at all. So `new Version("8.0.31-log").toString()` answers
`"8.0.31-log"` where Rails answers `"8.0.31"`, and the adapters that want the
raw server banner have nowhere Rails-shaped to put it.

PR #6094 ported `compare` (`<=>`) on this class and left the state shape
alone.

## Converged shape

- `@version` is the parsed `number[]`; drop the retained `_version` string.
- `toString()` is `this._version.join(".")`.
- Second constructor parameter `fullVersionString` with a reader, and the
  adapters that construct a `Version` from a raw banner pass it.

## Acceptance criteria

- [ ] `Version` holds only the parsed parts plus `fullVersionString`.
- [ ] `toString()` returns the joined parts (abstract_adapter.rb:257-259).
- [ ] Callers that build a `Version` from a server banner pass the banner as
      `fullVersionString` rather than relying on `toString()` echoing it.
