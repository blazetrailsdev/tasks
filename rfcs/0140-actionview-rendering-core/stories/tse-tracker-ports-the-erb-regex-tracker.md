---
title: "Port ERBTracker as TSETracker, the default source-scanning tracker"
status: in-progress
updated: 2026-09-08
rfc: "0140-actionview-rendering-core"
cluster: null
packages:
  - "actionview"
deps: ["dependency-tracker-and-wildcard-resolver"]
deps-rfc: []
est-loc: 350
priority: 11
pr: 7633
claim: "2026-09-08T23:14:52Z"
assignee: "tse-tracker-ports-the-erb-regex-tracker"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/actionview/lib/action_view/dependency_tracker/erb_tracker.rb`
(163 lines, 13 methods) is the tracker Rails registers by default —
`register_tracker :erb, ERBTracker` is the only registration in
`dependency_tracker.rb:38`. It scans **template source with regexes** and never
compiles the template or parses Ruby, which is why it is also the arm that puts
no parser and no compiler in the production dependency tree.

Under the repo's `erb` -> `tse` token rename it becomes
`dependency-tracker/tse-tracker.ts`, the same way `template/handlers/erb.rb`
already became `handlers/tse.ts`.

The machinery, in Rails' own order:

- Six regex constants (`:6-60`): `EXPLICIT_DEPENDENCY`, `IDENTIFIER`,
  `VARIABLE_OR_METHOD_CHAIN`, `STRING`, `PARTIAL_HASH_KEY`, `LAYOUT_HASH_KEY`,
  composed into `RENDER_ARGUMENTS` and `LAYOUT_DEPENDENCY`.
- `self.supports_view_paths?` -> true, `self.call`, `initialize` (`:62-73`).
- `dependencies` -> `WildcardResolver.new(@view_paths, render_dependencies +
explicit_dependencies).resolve` (`:75-77`).
- `render_dependencies` splits source on `/\brender\b/` and drops the first
  chunk (`:88-98`) — each remaining chunk is the argument text after one
  `render`.
- `add_dependencies` scans a chunk with a pattern and feeds
  `add_dynamic_dependency` (pluralize/singularize) and `add_static_dependency`
  (`:100-112`).
- `add_static_dependency` (`:114-150`) is the hard one: for a double-quoted
  string containing `#{`, it runs a `StringScanner` brace-matching loop that
  replaces each interpolation with `*`, bailing entirely on an unbalanced brace.
- `explicit_dependencies` scans `# Template Dependency: (\S+)` (`:152-154`).

## Converged shape

`packages/actionview/src/dependency-tracker/tse-tracker.ts`, registered as the
default in `dependency-tracker.ts` at the site Rails registers ERBTracker.

The regexes translate to TSE and JS syntax, and the translation is the substance
of this story — do not port the Ruby character classes verbatim:

- `IDENTIFIER` — Ruby's `[[:alpha:]_][[:word:]]*` has no JS equivalent; use the
  explicit class, and decide deliberately whether `$` is an identifier start in
  a trails template.
- `VARIABLE_OR_METHOD_CHAIN` — Ruby's `(?:\$|@{1,2})?` covers global, instance
  and class variables. trails has no `@`/`@@`/`$` sigils; an instance variable
  is `this.x`. The `this.` prefix is the arm that survives; the three sigils do
  not.
- `PARTIAL_HASH_KEY` / `LAYOUT_HASH_KEY` — Ruby matches both `partial:` and
  `:partial =>`. trails kwargs are object literals with one spelling, so the
  hash-rocket arm has no counterpart and drops. Record that in the file, not
  just the PR.
- The `#{` interpolation loop becomes a `${` loop over template literals; the
  brace-matching and the bail-on-unbalanced behaviour port as-is, including the
  early `return` that discards the whole dependency.
- `pluralize` / `singularize` come from the ported inflector.

`WildcardResolver` and the registry are `dependency-tracker-and-wildcard-resolver`;
this story consumes them.

## Acceptance criteria

- `dependency_tracker/erb_tracker.rb` reports 0 missing in
  `pnpm parity:api --package actionview` at `dependency-tracker/tse-tracker.ts`.
- The tracker reads `template.source`, NOT the memoized compile that
  `memoize-tse-compile-on-the-template` put on `Template` — pinned by a test
  that compiles the template first and asserts the dependency set is unchanged.
- `<%= render "comments/comment" %>` yields `comments/comment`;
  `<%= render partial: "c", collection: @all %>` and a bare `<%= render @topic %>`
  yield the Rails answers for those shapes.
- A `${}` interpolation inside a double-quoted path yields a `/*` wildcard that
  `WildcardResolver` then expands; an unbalanced brace discards the dependency
  rather than emitting a partial path.
- `# Template Dependency: foo/bar` is picked up and de-duplicated.
- Every regex whose Ruby original has an arm with no TS counterpart is recorded
  with the Rails `file:line`, in the PR body rather than at the constant.
  `blazetrailsdev/trails`'s `blazetrails/no-freeform-comments` is `error` over
  `packages/actionview/src/**` (`eslint.config.mjs:913-936`; the package rows
  left the exclusion list with story
  `enroll-remaining-packages-in-no-freeform-comments`) and deletes prose
  comments, and none of the three JSDoc receipt shapes fits a dropped regex
  arm: `@noRailsEquivalent` suppresses extra SURFACE, `@missingRailsCall` an
  omitted CALL, `@missingRailsArgs` a call's ARGUMENT shape. A regex arm is
  none of those — there is nothing for them to suppress, and a tag that
  suppresses nothing reds as a STALE tag in the compare job. The PR body is the
  sanctioned home until a receipt shape exists for this class.
- No new runtime dependency in `packages/actionview/package.json`.
