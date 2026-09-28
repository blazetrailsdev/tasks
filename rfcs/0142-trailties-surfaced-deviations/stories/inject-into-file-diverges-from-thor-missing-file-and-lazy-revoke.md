---
title: "injectIntoFile raises ENOENT instead of Thor's missing-file error and revokes greedily"
status: draft
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Thor's `InjectIntoFile#invoke!` (thor 1.3, `lib/thor/actions/inject_into_file.rb`)
raises `Thor::Error, "The file #{destination} does not appear to exist"` when the
target is missing (unless pretending), and `#revoke!` removes the injection with a
lazy match: `replace!(/#{flag}(.*?)(#{Regexp.escape(replacement)})/m, content, true)`.

trails' module-private `injectIntoFile` in
`packages/trailties/src/generators/trails-actions.ts` (used by `route` —
`railties/lib/rails/generators/actions.rb:427` — and `environment`):

- reads the file unconditionally, so a missing `config/routes.ts` surfaces as the
  fs adapter's raw `ENOENT` rather than Thor's error class and message;
- builds its revoke regexp as `(flag)([^]*)(replacement)` — greedy, where Thor's is
  `(.*?)`, so with two occurrences of the replacement after the flag it removes the
  last one rather than the first.

Since trails#8218 every route-emitting generator reaches this path, so the missing-file
error is now user-visible (`AuthenticationGenerator` test "no-op for missing
application-controller / routes; throws clearly in JS projects" asserts only
`/routes\.ts/`).

## Acceptance criteria

- A missing target raises the Thor::Error analogue with Thor's message
  (`The file <destination> does not appear to exist`), skipped under `pretend`.
- The revoke regexp is lazy (`([^]*?)`), matching Thor.
- Tests cover both arms.
