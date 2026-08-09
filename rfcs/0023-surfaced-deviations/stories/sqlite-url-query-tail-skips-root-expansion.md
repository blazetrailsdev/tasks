---
title: "Relative sqlite URL with query parameters skips root expansion"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Not a Rails-fidelity divergence: normalizeSqlitePaths (activerecord-cli/src/environment.ts) is a trails invention with no Rails counterpart; this is a gap in trails-only path expansion."
---

## Context

`normalizeSqlitePaths` (`packages/activerecord-cli/src/environment.ts`, added by
PR #5735) expands a relative sqlite path for `UrlConfig` entries by rewriting the
URL string, because `UrlConfig`'s constructor re-derives the hash from the URL
and spreads it last (`packages/activerecord/src/database-configurations/url-config.ts:23`)
— an expanded `database` passed as configuration is overwritten.

The rewrite is guarded by `config.url.endsWith(database)`, so it only fires when
the database is the URL's tail. A URL carrying query parameters
(`sqlite3:db/development.sqlite3?mode=ro`) fails that guard and is returned
untouched, i.e. the path stays relative to the process cwd. This is deliberate —
rewriting by substring guesswork was rejected in review — but it leaves a real
gap for a valid Rails `DATABASE_URL` shape.

`packages/activerecord-cli/src/environment.test.ts` pins the current behavior
with "leaves a sqlite url whose database is not its tail untouched".

## Acceptance criteria

- [ ] A relative sqlite URL with query parameters resolves its database against
      the project root rather than the process cwd.
- [ ] The expansion is derived from the parsed URL (scheme/opaque/path parts)
      rather than a string `endsWith` test.
- [ ] The pinning test is updated to assert expansion instead of pass-through.

Note: likely obsoleted if the adapter-level expansion story lands first — check
`sqlite-adapter-expands-relative-database-against-root` before starting.
