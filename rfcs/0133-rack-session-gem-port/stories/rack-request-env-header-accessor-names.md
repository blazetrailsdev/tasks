---
title: "Rack::Request::Env: one spelling per header accessor — hasHeader/getHeader/fetchHeader/setHeader"
status: ready
updated: 2026-09-02
rfc: "0133-rack-session-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 110
priority: 29
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rack::Request::Env` has exactly one accessor per operation
(`vendor/rack/lib/rack/request.rb:95-118`):

```ruby
def has_header?(name); @env.key? name; end
def get_header(name);  @env[name];     end
def fetch_header(name, &block); @env.fetch(name, &block); end
def set_header(name, v); @env[name] = v; end
```

`packages/rack/src/request.ts` spells these `has` (`:136`), `get` (`:145`) and
`set` (`:155`) — none of which is the name
`docs/ruby-ts-conventions.md` produces from the Ruby — and `get(key, default)`
conflates `get_header` with `fetch_header`'s default/block arm.

PR #7315 needed `get_header` at a Rails call site (`files.rb:73,84,85`,
`method_override.rb:50`) and added `getHeader` (`request.ts:141`) as the port of
`request.rb:100-102`. That was the right name, but it leaves **two trails
spellings for one Ruby method** — the RFC 0112 shape — and the drifted trio is
still what every other caller in the repo uses.

## Acceptance criteria

- `has` → `hasHeader`, `set` → `setHeader`, and `get`'s default/block arm splits
  out as `fetchHeader`, each mirroring its Ruby at the cited line; `getHeader`
  stays as the port of `get_header` and `get` is deleted, not aliased.
- Callers updated across `packages/rack` and `packages/actionpack`
  (`request.test.ts:30,67` are trails-side call sites, not test names — no test
  renamed).
- `deleteHeader`, `addHeader` and `eachHeader` already carry the Rails names;
  confirm no further member of the `Env` module is drifted.
- `pnpm parity:api` rack methods non-negative; `parity:api:calls` /
  `:calls:args` gain no row.
