---
title: "converge-hand-rolled-url-call-sites-onto-the-uri-port"
status: claimed
updated: 2026-09-05
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 15
pr: null
claim: "2026-09-05T23:56:25Z"
assignee: "converge-hand-rolled-url-call-sites-onto-the-uri-port"
blocked-by: null
closed-reason: null
---

## Context

`port-uri-for-parse-merge-and-scheme-classes` landed `URI` in
`@blazetrails/ruby-compat` — `URI.parse`, `URI::Generic` with its mutable
`scheme` / `host` / `port` / `path` accessors, `URI::Generic#merge`, the
`URI::HTTP` / `URI::HTTPS` scheme classes and `URI::RFC2396_Parser#escape`
(`packages/ruby-compat/src/uri/`, `packages/ruby-compat/src/uri.ts`).

It wired only the two `escape` call sites the closed
`0089-corelib-primitives/port-uri-parser-escape-for-rack-and-routes-inspector`
story was filed for (`packages/rack/src/utils.ts` `escapePath`,
`packages/actionpack/src/action-dispatch/routing/inspector.ts`
`normalizeFilter`). Its fifth acceptance criterion left the OTHER call sites —
the ones that hand-roll a JS `URL` where Rails uses `URI`, each carrying a
comment about the divergence — for this story:

- `packages/actionpack/src/action-dispatch/http/filter-redirect.ts:61`
- `packages/actionpack/src/action-dispatch/testing/assertions/routing.ts:138,207`
- `packages/actionpack/src/action-dispatch/testing/integration.ts:81`
- `packages/actionpack/src/action-controller/metal/request-forgery-protection.ts:641`
- `packages/rack/src/mock-request.ts:55-79`, which reasons about
  `URI::Generic#port` / `URI.scheme_list` in prose because it could not call
  them

A `URL` is not a `URI`: it lowercases the host, normalizes the path, cannot
express a `nil` port or a `nil` host, and resolves a relative reference by the
WHATWG algorithm rather than RFC 2396 Section 5.2 (pinned in
`packages/ruby-compat/src/uri.trails.test.ts`).

Each converged site may need a member the port left out as unsent — the class
comments in `uri/generic.ts` and `uri/http.ts` name them (`URI::HTTP#authority`
/ `#origin` / `#request_uri`, `URI::Generic#component`, `#hierarchical?`,
`#relative?`, `#normalize`, `#==`). Port what the site actually sends, with its
`vendor/ruby/lib/uri/*.rb:LINE` citation, and raise the ruby-compat
`total` row in `scripts/api-compare/extra-surface-mark.json` as a reviewed line
of the diff — `novel` is pinned at 0, so every new name needs its
`@noRailsEquivalent PERMANENT` receipt.

## Acceptance criteria

- [ ] Each of the six call sites above either calls the `URI` port or carries a
      cited reason why the Rails body it mirrors really does use a `URL`.
- [ ] The divergence comments those sites carry are deleted with the `URL` they
      justify.
- [ ] Any `URI` member added for a site is cited and receipted, and the
      ruby-compat `total` mark moves by exactly what the diff adds.
- [ ] `pnpm parity:api:calls`, `pnpm parity:api:calls:args` and
      `pnpm parity:api:extra:gate` green.
