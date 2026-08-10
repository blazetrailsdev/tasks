---
title: "i18n-hash-inspect-ruby-34-form"
status: closed
updated: 2026-08-04
rfc: "0061-ci-failures"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by PR #6031, which resolved the exceptions.test.ts failure the other way: it aligned the test on the pre-3.4 rocket form our inspectHash emits (PR #6022), matching the literal in vendor/i18n/test/backend/exceptions_test.rb:34. This story's premise — moving to Ruby 3.4 rendering — contradicts that merged decision. Filed before #6031 merged."
---

## Context

`packages/i18n/src/backend/exceptions.test.ts:58`
(`I18nBackendExceptionsTest > exceptions: MissingInterpolationArgument message
includes missing key, provided keys and full string`) fails on `main`:

```text
Expected: missing interpolation argument "key" in "string" ({this: "was given"} given)
Received: missing interpolation argument "key" in "string" ({:this=>"was given"} given)
```

The test expects Ruby 3.4's Hash `inspect`, which renders a Symbol-keyed pair as
`{this: "was given"}`. `inspectHash` in `packages/i18n/src/exceptions.ts` still
emits the pre-3.4 `{:this=>"was given"}` rocket form that #6022 ported.

Ruby 3.4 changed `Hash#inspect` so that a Symbol key that is a valid identifier
renders as `key: value`; every other key keeps `key => value` (note 3.4 also puts
spaces around the rocket: `{"a" => 1}`). The gem's own test file is
`vendor/i18n/test/i18n/exceptions_test.rb`.

Confirmed pre-existing: reproduced on a stashed tree at b548cd2e, independent of
PR #6036 which only converges the Symbol-value spelling.

## Acceptance criteria

- `inspectHash` renders a Symbol key that matches `/\A[A-Za-z_][A-Za-z0-9_]*[?!]?\z/`
  as `name: value`, and every other key as `key => value` with surrounding spaces.
- `packages/i18n/src/backend/exceptions.test.ts` passes with no test-name change.
- Any other i18n message snapshot that embeds a Hash inspect is updated to the
  3.4 form in the same PR.

## Definition of done

- `pnpm vitest run packages/i18n` green.
- `pnpm parity:api:calls` / `pnpm parity:api:calls` non-negative.

## Verification

`pnpm vitest run packages/i18n/src/backend/exceptions.test.ts`
