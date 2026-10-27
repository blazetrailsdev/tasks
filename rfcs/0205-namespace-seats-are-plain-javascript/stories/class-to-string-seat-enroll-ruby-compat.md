---
title: "Enroll ruby-compat in class-to-string-seat (needs a name source)"
status: blocked
updated: 2026-10-27
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: "Held on decide-class-to-string-literal-against-generated-path-table: the static toString literal duplicates the Ruby path the RFC 0205 generated class-path table already answers through rbModName."
closed-reason: null
---

## Context

`blazetrails/class-to-string-seat` (`eslint/class-to-string-seat.mjs`) reads each class's Ruby constant path from the `classPaths` table that scripts/build-rails-file-structure-manifest.ts builds from rails-api.json. ruby-compat has no rows there: its source entry in `vendor/sources.ts` is `compareApi: false`, since MRI's surface is C and the extractor globs `**/*.rb`. So the rule cannot enroll ruby-compat, whose 124 exported classes include Ruby core (`Hash`), stdlib (`Psych::Nodes::Scalar`, `URI::Generic`, `Gem::Version`, `Concurrent::Map`) and trails-only helpers.

A path rule was measured and rejected for this: `psych/nodes/node.ts` would give `Psych::Nodes::Node`, but `uri/common.ts` holds `URI::Error` and `URI` together, and `concurrent/` is `Concurrent::`, not `RubyCompat::Concurrent::`.

## Acceptance criteria

- [ ] A name source for ruby-compat classes is chosen, for example the `registerConstant` / `rbModConstSet` seats each class already has, or a vendored-stdlib extract for psych/uri. The choice is recorded in the rule's JSDoc.
- [ ] `packages/ruby-compat/src/**/*.ts` is enrolled, and `lint --fix` is applied.
- [ ] Trails-only helper classes with no Ruby constant get no seat.
