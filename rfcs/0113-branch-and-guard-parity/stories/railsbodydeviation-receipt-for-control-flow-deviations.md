---
title: "No receipt shape for a language-forced control-flow deviation in a ported body"
status: closed
updated: 2026-09-10
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Contrary to a settled maintainer decision (2026-08-27), recorded in close-jsdoc-bypass-in-no-freeform-comments (RFC 0023, done): 'trails carries no English-language comments — only our JSDoc flags and the tool directives the toolchain reads, with no narrative prose around them', and prose dies 'including inside a JSDoc block that also carries a tag'. A fourth tag whose purpose is to make tag-anchored prose survive --fix is exactly what that ruled out, so this is re-arguing a decision rather than converging toward Rails. Verified on origin/main that even a bare 'Mirrors:' line is rejected in activerecord, so the no-in-file-citation constraint is real and intended, not a gap."
---

## Context

A ported body can deviate from Rails in its CONTROL FLOW while calling exactly
what Rails calls with exactly Rails' arguments. The repo has three JSDoc
receipts and none of them covers that case:

- `@noRailsEquivalent` suppresses EXTRA SURFACE (a public name with no Ruby
  counterpart) — `scripts/api-compare/lint-extra-surface-ratchet.ts`.
- `@missingRailsCall` suppresses an OMITTED CALL — `parity:api:calls`.
- `@missingRailsArgs` suppresses a DIFFERING ARGUMENT SHAPE —
  `parity:api:calls:args`.

So a language-forced control-flow deviation has nothing to point at, and
`blazetrails/no-freeform-comments` deletes the prose that would explain it.
Reproduced on `main`'s config with fresh manifests during PR #7655: adding

```ts
/**
 * `ActiveRecord::FixtureSet::File`
 * (`activerecord/lib/active_record/fixture_set/file.rb:7`).
 */
```

to `packages/activerecord/src/fixture-set/file.ts` errors with

```text
7:1  error  English-language comment. trails carries none: only the repo's JSDoc
            flags with their permanence token, and tool directives
            blazetrails/no-freeform-comments
```

and `eslint --fix` silently removes it.

Three real instances shipped in #7655 with their justification in the PR body
instead of at the call site, which is where CLAUDE.md says a deviation is
justified:

- `File#each` blockless returns `rows()[Symbol.iterator]()`. Ruby's
  `rows.each(&block)` with no block returns an Enumerator
  (`activerecord/lib/active_record/fixture_set/file.rb:23-25`); JS has no
  Enumerator type.
- `RenderContext.create_subclass`'s `get_binding` returns a name-to-value
  `Record`. Ruby returns `binding()`
  (`activerecord/lib/active_record/fixture_set/render_context.rb:10-12`); JS has
  no first-class binding, and trails' TSE templates compile against an explicit
  map.
- `File#raw_rows` catches `ConfigurationFile.FormatError` where Ruby rescues
  `RuntimeError` (`file.rb:56`), because Ruby's
  `ActiveSupport::ConfigurationFile#parse` reports a YAML syntax error with a
  bare `raise "…"` (`activesupport/lib/active_support/configuration_file.rb:38`)
  and trails' raises that class instead.

ruby-compat already solves the same problem in the other direction: its
`blazetrails/ruby-compat-needs-mri-citation` rule REQUIRES a
`vendor/ruby/<file>:<line>` citation on every export, and prose anchored to
such a citation passes `no-freeform-comments` there. So the mechanism exists;
it is the activerecord/activemodel/etc. side that has no admitted shape.

## Converged shape

A fourth receipt, `@railsBodyDeviation <rails path:line> — PERMANENT|CONVERGEABLE <story-id>`,
recognised by `no-freeform-comments` the way the existing three tags are, so a
tag-anchored explanation survives `--fix`. Permanence discipline identical to
`@noRailsEquivalent`: a tag claiming neither token is an error, and a bare
`CONVERGEABLE` with no story id is half a receipt.

Report-only to begin with (`pnpm parity:api:body-deviations --report`) so the
population can be measured before any gate is pointed at it — the same order
`parity:api:params` and `parity:api:calls:args` were introduced in.

## Acceptance criteria

- `no-freeform-comments` admits a JSDoc block whose prose is anchored to a
  `@railsBodyDeviation` tag, and `eslint --fix` no longer strips it.
- The tag's permanence token is validated exactly as `@noRailsEquivalent`'s is,
  with the same two error shapes.
- A report-only lister prints every `@railsBodyDeviation` with its cite,
  permanence and story id; no gate is armed by this story.
- The three instances above carry the tag at their call sites in
  `packages/activerecord/src/fixture-set/`, and PR #7655's body prose about
  them becomes redundant.
- Arming a ratchet over the population is explicitly OUT of scope; file it
  once the report has a baseline.
