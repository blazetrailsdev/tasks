---
title: "stale-story-reference-in-bind-parameter-test"
status: done
updated: 2026-08-09
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6303
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Unit Tests` is red on `main` (and therefore on every open PR) via
`scripts/stale-story-references.test.ts:149`:

```text
AssertionError: expected [ Array(1) ] to deeply equal []
+ [
+   "packages/activerecord/src/bind-parameter.test.ts:369 tosqlandbinds-preserve-attribute-binds",
+ ]
```

`packages/activerecord/src/bind-parameter.test.ts:375` carries a comment
deferring a stronger assertion to RFC 0077 story
`tosqlandbinds-preserve-attribute-binds`:

```ts
// payload can't preserve Attribute objects without production changes; the
// stronger `binds are logged` assertion is deferred to RFC 0077 story
// `tosqlandbinds-preserve-attribute-binds` for that reason.)
```

That story was marked `status: done` by **#6293**
(`tasks/rfcs/0077-quoting-binds-fidelity/stories/tosqlandbinds-preserve-attribute-binds.md`,
`pr: 6293`, done commit `1305f16fc`), so the reference went stale the moment
PR #6293 merged. The guard only fires once the story closes, which is why #6293's
own CI was green.

Reproduce on a clean `main`: `pnpm vitest run scripts/stale-story-references.test.ts`.

## Converged shape

PR #6293 converged the binds path (`toSqlAndBinds` keeps Attribute objects until
`type_casted_binds`), so the comment's premise — "the payload can't preserve
Attribute objects without production changes" — is what needs re-checking, not
just the dangling slug. Either:

- the assertion the comment defers is now expressible, in which case port
  Rails' `bind_parameter_test.rb:148-152` guard (`attr.value == 1` on the
  QueryAttribute payload binds) and delete the comment; or
- it still is not, in which case the comment must cite whatever open story now
  owns it, and the `?? attr` fallback needs a one-line reason that does not
  reference a closed story.

Do not resolve it by deleting the slug and leaving the prose — the guard exists
to stop exactly that.

## Acceptance criteria

- [ ] `pnpm vitest run scripts/stale-story-references.test.ts` green on `main`.
- [ ] `bind-parameter.test.ts`'s deferral either becomes the ported Rails
      assertion or cites an open story.
- [ ] `bind-parameter.test.ts` green on sqlite3, postgresql, mysql2.
