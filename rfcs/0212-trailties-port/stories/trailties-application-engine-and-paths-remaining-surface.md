---
title: "Port the remaining methods of Application, Engine, Paths and Finisher"
status: in-progress
updated: 2026-11-01
rfc: "0212-trailties-port"
cluster: tt-surface
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: trails#9563
claim: "2026-11-01T02:49:14Z"
assignee: "trailties-application-engine-and-paths-remaining-surface"
blocked-by: null
closed-reason: null
---

## Context

parity:api 2026-10-30: `application.rb` 16 missing, `engine.rb` 10,
`paths.rb` 10 (29/39), `application/configuration.rb` 9 (112/121),
`application/finisher.rb` 5 (2/7), `engine/railties.rb` 2. Check RFC 0142
first: several of these have open deviation stories there (e.g.
`application-configuration-paths-missing-database-log-tmp`), and those stay
in 0142.

## Acceptance criteria

- Each missing method not already owned by an open 0142 story is ported at
  its Rails name, in Rails source order.
- The PR body lists the methods left to 0142 stories, by story id.
