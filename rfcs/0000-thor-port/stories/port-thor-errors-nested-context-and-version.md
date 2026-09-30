---
title: "Port thor/error.rb (with both DidYouMean SpellCheckers), nested_context.rb and version.rb"
status: draft
updated: 2026-09-30
rfc: "0000-thor-port"
cluster: null
packages: ["trailties"]
deps:
  [
    "enroll-thor-specs-in-parity-test",
    "ci-thor-only-diffs-run-minimal-test-lanes",
    "ci-thor-only-diffs-scope-rails-comparison-to-thor",
  ]
deps-rfc: []
est-loc: 250
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `vendor/thor/v1.3.2/lib/thor/error.rb` (106 lines): `Correctable` (`:2-12`, prepended when DidYouMean is loaded),
  `Error` (`:20`), `UndefinedCommandError` (`:24-54`) with its nested `SpellChecker`
  (`:25-39`) and message `Could not find command "x" in "ns" namespace.` (`:47-48`),
  `UndefinedTaskError` / `AmbiguousTaskError` aliases (`:55,59`), `AmbiguousCommandError`,
  `InvocationError`, `UnknownArgumentError` (`:65-93`) with its own `SpellChecker` (`:66-81`)
  and message `Unknown switches "--foo"`, `RequiredArgumentMissingError`,
  `MalformattedArgumentError`, `ExclusiveArgumentError` and
  `AtLeastOneRequiredArgumentError`.
- `packages/trailties/src/thor/error.ts` (3 lines) has only `Error`.
- `vendor/thor/v1.3.2/lib/thor/nested_context.rb` (29 lines): `enter` / `entered?` / `push` / `pop`, backing
  `no_commands`.
- `vendor/thor/v1.3.2/lib/thor/version.rb`: `VERSION = "1.3.2"`.

trails#8269 recorded the two nested `SpellChecker` classes as a reviewed row in
`EXPECTED_UNRESOLVED_COLLISIONS`, because the file-structure manifest could not tell them
apart once neither was ported.

## Fidelity traps (predicted at authoring)

- [ ] `Correctable#to_s` appends `DidYouMean.formatter.message_for(corrections)`. Port it over
      `@blazetrails/did-you-mean` (`packages/did-you-mean/src/spell-checker.ts`), so
      `error.message` carries the suggestion as Ruby's does.
- [ ] `corrections.map(&:inspect)` quotes each suggestion (`"install"`), which is the Ruby
      `inspect` of a String.
- [ ] The aliases are constants (`UndefinedTaskError = UndefinedCommandError`): the same
      class, not subclasses.

## Acceptance criteria

- [ ] `error.rb`, `nested_context.rb` and `version.rb` read complete in `parity:api --package thor`.
- [ ] The `EXPECTED_UNRESOLVED_COLLISIONS` row for `thor/error.rb` `SpellChecker` is removed
      or re-justified by the now-resolvable pair.
- [ ] `vendor/thor/v1.3.2/spec/nested_context_spec.rb` is ported (2 cases).

## Cases to port (2)

`vendor/thor/v1.3.2/spec/nested_context_spec.rb`:

- `#enter > is never empty within the entered block` (`:7`)
- `#enter > is empty when outside of all blocks` (`:15`)
