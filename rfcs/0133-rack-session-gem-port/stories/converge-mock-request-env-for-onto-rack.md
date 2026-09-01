---
title: "Converge MockRequest.envFor onto Rack::MockRequest.env_for, URI#port scheme defaults included"
status: ready
updated: 2026-09-01
rfc: "0133-rack-session-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 260
priority: 12
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`parity:api --package rack` scores `mock_request.rb` -> `mock-request.ts` at
73% (11 of 15 members), the lowest-scoring matched file in the package, and
`MockRequest.envFor` diverges from `Rack::MockRequest.env_for`
(`vendor/rack/lib/rack/mock_request.rb:96-170`) in ways that surface as wrong
fixtures in ported specs rather than as failures in `mock-request.test.ts`.

PR #7342 hit one instance and fixed only that one: Ruby's
`env[SERVER_PORT] = (uri.port ? uri.port.to_s : "80").b` (`:106`) leans on
`URI#port`, which answers the SCHEME'S DEFAULT PORT when the URI carries none —
443 for `https`, 80 for `http`. trails read `parsedUrl.port || "80"`, which is
`""` for every https URI, so `Request#authority` answered `example.com:80` for
`https://example.com/` and the ported
`can calculate the authority without a port on ssl` case could not hold. It now
special-cases `https:`, which is the one scheme the test needed — not
`URI#port`'s general behaviour.

## Acceptance criteria

- `env_for` is traced against `mock_request.rb:96-170` member by member and the
  divergences are converged, `URI#port`'s scheme-default included (a general
  default-port lookup, not a per-scheme special case).
- `parity:api --package rack` raises `mock_request.rb` above 73%; the members
  it reports missing are ported or accounted for.
- Rack's own `spec_mock_request.rb` cases for `env_for` are ported by name.
