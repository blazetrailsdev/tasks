---
title: "Clear the 94 stale @noRailsEquivalent tags failing api:extra on main"
status: draft
updated: 2026-11-17
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat", "activesupport", "image-processing", "trailties", "nokogiri"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm api:extra --package actionpack` exits 1 on trails main (seen 2026-11-17 while verifying trails#10235, built at b48364e0eb). It reports 94 STALE `@noRailsEquivalent` tags: tags on methods that no longer flag as extra surface. The gate fails for every package, whichever one is passed.

Per package:
31 ruby-compat
12 activesupport
10 image-processing
8 trailties
7 nokogiri
3 zeitwerk
3 msgpack
3 date
3 actiondispatch
2 sqlite3
2 rackup
2 activerecord
2 actiontext
1 rake
1 rails-html-sanitizer
1 mysql2
1 mail
1 erubi
1 crass

Examples: ruby-compat `logger/severity.ts coerce`, date `date.ts dateStrftime`, nokogiri `xml/node.ts _node`, rails-html-sanitizer `sanitizer.ts validateBang`, mail `utilities.ts gsubBytes`.

## Acceptance criteria

- For each tag the gate lists, delete it, or fix its reason prose where a bare `@word` cut the reason short. The gate's own message lists those causes.
- `pnpm api:extra --package <any>` exits 0 on a fresh `pnpm build`.
