---
title: "buildUrlHash's Windows drive-letter arm is an invented third branch"
status: ready
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
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

`UrlConfig#buildUrlHash`
(`packages/activerecord/src/database-configurations/url-config.ts`) guards a
Windows drive-letter path with `/^[A-Za-z]:[\\/]/.test(url)` and returns
`{ url }` for it. Rails' `build_url_hash`
(`vendor/rails/activerecord/lib/active_record/database_configurations/url_config.rb:67-75`)
has exactly two branches and no such arm:

```ruby
def build_url_hash
  if url.nil? || url.start_with?("jdbc:", "http:", "https:")
    { url: url }
  else
    ConnectionUrlResolver.new(url).to_hash
  end
end
```

MRI parses `C:/db/x.sqlite3` as a URI with **scheme `"c"`**, so Rails routes it
through `ConnectionUrlResolver` and gets `{adapter: "c", database: "db/x.sqlite3"}`
— verified with
`ruby -ruri -e 'p URI::RFC2396_Parser.new.parse("C:/db/x.sqlite3")'` →
`scheme="c", path="/db/x.sqlite3"`. A backslash form (`C:\db\x.sqlite3`) raises
`URI::InvalidURIError`.

Surfaced by PR #7539, which converged the rest of `buildUrlHash` onto Rails'
two branches (deleting an `inferAdapterNameFromUrl` sniffing arm and a
scheme-less arm) but left this one in place because it is load-bearing for
Windows filesystem paths and removing it is a behaviour change on a platform
the AR lanes do not exercise.

## Converged shape

Delete the arm so `buildUrlHash` is Rails' two branches verbatim, and establish
where Windows paths should instead be normalized — most likely at the same CLI
boundary that PR #7539 fixed for absolute sqlite paths
(`activerecord-cli`'s `normalizeSqlitePaths`, which now emits `sqlite3:<abs>`
per `connection_url_resolver.rb:92-95`), rather than inside the shared
resolver's caller.

## Acceptance criteria

- [ ] `buildUrlHash` has only the `nil`/`jdbc:`/`http:`/`https:` branch and the
      `ConnectionUrlResolver` branch, matching `url_config.rb:67-75`.
- [ ] A Windows drive path still reaches its adapter with the right `database:`,
      via whatever boundary is chosen — with a test pinning it.
- [ ] Three AR adapter lanes green.
