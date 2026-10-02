---
title: "activerecord: ConnectionUrlResolver parses through ruby-compat's URI::RFC2396_Parser"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: receipts
packages: ["activerecord", "ruby-compat"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-subsystems-part-1` audit: the receipts below were `PERMANENT`, no CLAUDE.md section ratifies them, and they are re-tagged `CONVERGEABLE` onto this story.

`ConnectionUrlResolver` parses its URL with `URI::RFC2396_Parser`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/database_configurations/connection_url_resolver.rb:25-36,47-49`):

```ruby
def initialize(url)
  raise "Database URL cannot be empty" if url.blank?
  @uri     = uri_parser.parse(url)
  @adapter = resolved_adapter

  if @uri.opaque
    @uri.opaque, @query = @uri.opaque.split("?", 2)
  else
    @query = @uri.query
  end
end
```

`packages/activerecord/src/database-configurations/connection-url-resolver.ts` does not. Its constructor
matches the scheme with a hand-written regexp, rewrites the rest onto `http://placeholder/…` and parses that
with the WHATWG `URL`, and keeps six ivars (`_scheme`, `_parsed`, `_opaque`, `_query`, `_emptyAuthority`,
`_adapter`) where Rails keeps `@uri`, `@adapter` and `@query`. It raises an invented
`Invalid database URL: …` through an invented `redactUrl` helper. Three receipts follow from that shape:

| Receipt                                     | Rails site                                                                                                                                                                                            |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| constructor `@missingRailsCall split`       | `connection_url_resolver.rb:31` `@uri.opaque.split("?", 2)`, written as `indexOf` / `slice`                                                                                                           |
| `rawConfig` `@missingRailsArgs merge`       | `connection_url_resolver.rb:64-80` `query_hash.merge(adapter: @adapter, database: uri.opaque)`; the body calls ruby-compat's `merge`, and the row left is `database=ref:opaque` against `ref:_opaque` |
| `databaseFromPath` `@missingRailsCall path` | `connection_url_resolver.rb:91-104` `uri.path` / `uri.path.delete_prefix("/")`, read off `URL#pathname`                                                                                               |

ruby-compat already ports the parser: `RFC2396Parser` (`packages/ruby-compat/src/uri/rfc2396-parser.ts`,
`vendor/ruby/v3.3.11/lib/uri/rfc2396_parser.rb:63`) with `parse` and `unescape`, and `Generic`
(`packages/ruby-compat/src/uri/generic.ts`) with `scheme`, `host`, `port`, `path`, `query`. `Generic`
has no public `opaque` / `opaque=`, `user`, `password` or `hostname` yet; each is an MRI member
(`vendor/ruby/v3.3.11/lib/uri/generic.rb`) this port would be the first caller of.

`toHash` (`connection_url_resolver.rb:38-42`) is in the same state: `raw_config.compact_blank` and
`uri_parser.unescape(value)` are open-coded as two loops over `decodeURIComponent` with a swallowed
`catch`.

## Acceptance criteria

- [ ] The constructor is `connection_url_resolver.rb:25-36`: `this._uri = this.uriParser.parse(url)`, `resolvedAdapter()`, and the `opaque` / `query` arms, with `@uri`, `@adapter` and `@query` the only ivars. `redactUrl` and the `Invalid database URL` raise are deleted; a malformed URL raises what `RFC2396Parser#parse` raises.
- [ ] `uriParser` memoizes a ruby-compat `RFC2396Parser`; `toHash`, `rawConfig` and `databaseFromPath` read `uri.opaque`, `uri.user`, `uri.password`, `uri.port`, `uri.hostname` and `uri.path` as Rails does.
- [ ] Any `Generic` member added to ruby-compat carries its MRI citation and `@noRailsEquivalent PERMANENT` receipt, and is listed in the package README.
- [ ] The three receipts above are deleted; `pnpm parity:api:calls`, `:calls:args` and `:receipts:gate` are green with no baseline row added.
- [ ] `connection-url-resolver.trails.test.ts` cases that assert the invented error message or redaction are rewritten against the Ruby behaviour (check each against `ruby -ruri -e`) or deleted.

## Verification

```bash
pnpm vitest run packages/activerecord/src/database-configurations && API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm parity:api:receipts:gate
```
