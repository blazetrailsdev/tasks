---
title: "EnvironmentInquirer: bare Error for ArgumentError, missing DEFAULT_ENVIRONMENTS and its real predicates, invented isLocal"
status: draft
updated: 2026-08-17
rfc: "0111-error-class-message-parity"
cluster: bare-error-throws
packages: []
deps: []
deps-rfc: []
est-loc: 130
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Read while updating `EnvironmentInquirer`'s call sites for PR #6649 (the
inquirer predicate-access change). `vendor/rails/activesupport/lib/active_support/environment_inquirer.rb`
is 30 lines and trails
(`packages/activesupport/src/environment-inquirer.ts`) diverges from it in four
ways:

1. **Wrong error class.** environment_inquirer.rb:15 is
   `raise(ArgumentError, "'local' is a reserved environment name") if env == "local"`.
   trails throws a bare `Error` with a different message
   (`"local" is a reserved environment name. Use "development" or "test" instead.`).
   Both the class and the string diverge; `environment_inquirer_test.rb`'s
   `test_prevent_local_from_being_used_as_an_actual_environment_name` passes only
   because the port asserts a bare `toThrow()`.
2. **`DEFAULT_ENVIRONMENTS` is missing.** environment_inquirer.rb:11 declares
   `%w[ development test production ]`, and :19-23 sets one ivar per entry so
   :28-32's `class_eval`-generated `development?` / `test?` / `production?` are
   **real methods** — the file's own comment says this exists precisely so the
   inquirer "doesn't need to rely on the slower delegation through
   method_missing that StringInquirer would normally entail". In trails all three
   fall through to the StringInquirer Proxy, so the optimization the class exists
   for is absent along with the constant.
3. **`LOCAL_ENVIRONMENTS` shape.** environment_inquirer.rb:14 is a `%w[]` Array
   and :25 computes `@local = in? LOCAL_ENVIRONMENTS` once in the constructor;
   trails uses a module-level `Set` and recomputes on every `isLocal()` call.
   The `Set` is not the Rails shape and `@local` is not memoized.
4. **A non-Rails `isLocal()` alongside `"local?"()`.** Rails has one method,
   `local?` (:35-37). trails ships both, with `"local?"()` delegating to
   `isLocal()`. One of the two is invented surface; given the class's other
   predicates must be spelled `["development?"]()` after #6649, `"local?"()` is
   the one that matches its siblings.

## Converged shape

- `DEFAULT_ENVIRONMENTS` and `LOCAL_ENVIRONMENTS` as declared arrays with the
  Rails names and values.
- `development?` / `test?` / `production?` as real methods generated over
  `DEFAULT_ENVIRONMENTS` (the trails idiom for Ruby `class_eval` method
  generation — check how sibling ports spell it rather than inventing one), each
  reading the field set in the constructor.
- `local?` reading a constructor-computed `_local`; `isLocal()` retired, with
  its call sites (`finisher.ts` and anything else `grep -rn "isLocal"` finds)
  moved onto `["local?"]()`.
- `throw new ArgumentError("'local' is a reserved environment name")` — note
  Rails' single quotes around `local` and that the sentence ends there.
  `ArgumentError` already exists in activesupport; import it rather than
  declaring another (see `one-shared-nomethoderror-class` for the same class of
  problem).

## Acceptance criteria

- `environment_inquirer_test.rb` stays at 0 assertion-count / 0 kind / 0 value,
  and its throw assertion narrows to the Rails error class and message.
- `pnpm parity:api --package activesupport` matches `DEFAULT_ENVIRONMENTS`,
  `LOCAL_ENVIRONMENTS`, `development?`, `test?`, `production?` and `local?`;
  `pnpm parity:api:extra --package activesupport` loses `isLocal`.
- `pnpm parity:api:calls` / `:args` clean with no new baseline rows.

## Re-homed from `0023-surfaced-deviations` (2026-08-18)

Moved by the RFC 0023 backlog triage pass into `0111-error-class-message-parity`, which was carved out
of that register for this deviation class. Nothing about the finding changed —
every Rails and trails `file:line` citation above is as originally filed.
