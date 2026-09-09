---
title: "UrlConfig#database is a second URL parser Rails does not have"
status: done
updated: 2026-09-09
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 7644
claim: "2026-09-09T13:39:48Z"
assignee: "pg-exec-remaining-callers-and-deletion"
blocked-by: null
closed-reason: null
---

## Context

`UrlConfig` (`packages/activerecord/src/database-configurations/url-config.ts`)
carries a `database` getter and a module-private `databaseFromUrl` helper that
Rails has no counterpart for:

```ts
override get database(): string | undefined {
  const explicit = super.database;
  if (explicit !== undefined) return explicit;
  return databaseFromUrl(this.url);
}

function databaseFromUrl(url: string): string | undefined {
  if (!url) return undefined;
  if (/^[A-Za-z]:[\\/]/.test(url)) return url;
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/^\//, "");
    return path || undefined;
  } catch {
    return url;
  }
}
```

Rails' `UrlConfig`
(`vendor/rails/activerecord/lib/active_record/database_configurations/url_config.rb:1-76`)
defines no `database` at all. It inherits `HashConfig#database`
(`database_configurations/hash_config.rb`), which is just
`configuration_hash[:database]` — the URL's database is already merged into
`configuration_hash` by `build_url_hash` -> `ConnectionUrlResolver#to_hash`
(`url_config.rb:67-75`, `connection_url_resolver.rb:64-79`). There is one
resolution path in Ruby; trails has a second, parallel one that re-parses the
URL with a different parser and different rules.

It also still carries the **Windows drive-letter arm** that PR #7613 deleted
from `buildUrlHash` (story
`url-config-windows-drive-arm-has-no-rails-counterpart`), so the divergence the
merged story converged on one side of the file survives on the other. MRI parses
`C:/db/x.sqlite3` as a hierarchical URI with scheme `"c"` and path
`"/db/x.sqlite3"` (verified:
`ruby -ruri -e 'p URI::RFC2396_Parser.new.parse("C:/db/x.sqlite3")'`), which
`ConnectionUrlResolver` now handles correctly — so the fallback is not only
extra surface, it can disagree with the resolver that already ran.

The second parser also differs on ordinary URLs: `new URL()` percent-decodes and
normalizes where `ConnectionUrlResolver` applies Rails' own
`decodeURIComponent` pass and `database_from_path`'s sqlite3-vs-other
leading-slash rule (`connection_url_resolver.rb:91-105`).

## Converged shape

Delete the `database` override, `databaseFromUrl`, and its drive-letter arm, so
`UrlConfig#database` is the inherited `HashConfig#database` reading
`configurationHash.database` — the single path
`url_config.rb`/`hash_config.rb` have. Anything that depended on the fallback
gets its value from the `buildUrlHash` merge the constructor already performs.

## Acceptance criteria

- [ ] `UrlConfig` defines no `database` member; `url-config.ts` has no second
      URL parser.
- [ ] A URL-configured sqlite3/postgresql/mysql2 config still reports the same
      `database`, via `configurationHash`, with a test pinning it.
- [ ] `pnpm parity:api:extra:gate` novel/total do not grow.
- [ ] Three AR adapter lanes green.
