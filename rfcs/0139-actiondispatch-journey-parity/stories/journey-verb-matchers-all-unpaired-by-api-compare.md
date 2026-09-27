---
title: "Journey::Route::VerbMatchers::All's call/verb never pair (journey/route.rb 33/35)"
status: ready
updated: 2026-09-27
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 60
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api --package actiondispatch` (origin/main 9c8fe0b6c8) reports
`journey/route.rb` at 33/35 — the only Journey file below 100%. The two missing
rows are both on `ActionDispatch::Journey::Route::VerbMatchers::All`:

- `All.call` (`vendor/rails/actionpack/lib/action_dispatch/journey/route.rb:37`,
  `def self.call(_); true; end`)
- `All.verb` (`route.rb:38`, `def self.verb; ""; end`)

trails defines them (`packages/actionpack/src/action-dispatch/journey/route.ts`,
`VerbMatchers = { …, All: class { static call(_) …; static get verb() … } }`),
but as a class expression on an object-literal property. The TS extractor
records `VerbMatchers` as a module whose members are plain properties (`VERBS`,
`DELETE`, … `All`) and never records a nested `VerbMatchers::All` owner, so the
pair never forms. The `class_eval`-generated verb classes (`GET`, `POST`, …) are
invisible to the Ruby extractor, which is why only `All` (and `Unknown`, which
trails exports as a real class and which matches) show up. The object-literal
shape came in with trails#8128 (`journey-verb-matchers-class-shape`).

## Acceptance criteria

- `VerbMatchers::All` pairs in `parity:api`: either the shape converges (for
  example `All` becomes a named class that `VerbMatchers` exposes, the way
  `Unknown` already is), or the TS extractor learns class expressions on
  object-literal members of a module. Pick whichever keeps `VerbMatchers.All`,
  `VERB_TO_CLASS` and the `.verb`/`.call` surface the same.
- `journey/route.rb` reads 35/35 (100%), and every `journey/*.rb` row is ✓.
- `parity:api:extra --package actiondispatch` still lists no `journey/` file.
