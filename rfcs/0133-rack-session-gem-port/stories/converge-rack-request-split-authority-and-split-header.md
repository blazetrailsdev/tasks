---
title: "Converge Rack::Request::Helpers' split_authority and split_header onto the AUTHORITY regex and Ruby's miss shapes"
status: ready
updated: 2026-09-01
rfc: "0133-rack-session-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: 10
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`converge-rack-request-helpers-divergent-bodies` (#7342) converged the bodies
that call `split_authority` and `split_header`, and routed several new callers
(`authority`, `host`, `hostname`, `port`, `host_with_port`, `ip`) through them.
The two private helpers themselves are still hand-rolled and diverge from the
Ruby, in three ways that a reviewer flagged as pre-existing rather than new.

**`split_authority` return shape** (`vendor/rack/lib/rack/request.rb:736-741`):

```ruby
def split_authority(authority)
  return [] if authority.nil?
  return [] unless match = AUTHORITY.match(authority)
  return match[:host], match[:address], match[:port]&.to_i
end
```

Ruby returns an EMPTY array on both misses; trails
(`packages/rack/src/request.ts`, `splitAuthority`) returns
`[null, null, null]`. Ruby's callers destructure, so `host, _, port = []`
leaves all three `nil` and the two shapes coincide for every current caller —
but `split_authority(x).length` and `split_authority(x)[0]` differ, and
`hostname` (`:337-339`) is `split_authority(self.authority)[1]`, which is `nil`
either way only by coincidence of Ruby's out-of-range indexing.

**`split_authority` matcher**: Ruby matches one `AUTHORITY` regex
(`request.rb:722-734`, `private_constant` at `:735`) built over the `ipv6`
union at `:700-720`. trails hand-rolls a bracket regex plus a `lastIndexOf(":")`
scan, which is not the same language — e.g. Ruby's host alternative is
`[[:graph:]&&[^\[\]]]*?`, so an authority containing a space fails to match and
yields `[]`, where trails returns it whole.

**`split_header`** (`request.rb:692-694`) is
`value ? value.strip.split(/[,\s]+/) : []`. trails appends `.filter(Boolean)`,
which Ruby does not: `" ,1.2.3.4".strip.split(/[,\s]+/)` is `["", "1.2.3.4"]`
in Ruby and `["1.2.3.4"]` in trails. `ip` (`:414-433`) reads
`remote_addresses.first`, so the leading empty string is observable.

## Acceptance criteria

- `AUTHORITY` and the `ipv6` union are ported as written
  (`request.rb:700-734`), and `split_authority` matches through them.
- `split_authority` answers Ruby's empty-array miss shape, or the deviation is
  justified at the call site as a TypeScript tuple-typing shortcoming with a
  receipt — not left silent.
- `split_header` drops `.filter(Boolean)`.
- Rack's `spec_request.rb` cases that exercise a non-matching authority and a
  leading-empty `REMOTE_ADDR` are ported by name.
- `parity:api` rack non-negative on `request.rb` (99% after #7342);
  `parity:api:calls` / `:args` gain no rows.
