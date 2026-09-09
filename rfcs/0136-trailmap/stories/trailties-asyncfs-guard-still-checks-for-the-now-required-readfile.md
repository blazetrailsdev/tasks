---
title: "The trailties AsyncFs guard still checks for the now-required readFile"
status: draft
updated: 2026-09-09
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/src/generators/trails-actions.ts:5-16` still treats the async
`FsAdapter` members as possibly-absent:

```ts
type AsyncFs = FsAdapter & {
  readFile: NonNullable<FsAdapter["readFile"]>;
  writeFile: NonNullable<FsAdapter["writeFile"]>;
  mkdir: NonNullable<FsAdapter["mkdir"]>;
};
// ...
`FsAdapter is missing required async method ${JSON.stringify(m)}; `;
```

PR #7646 made `readFile` required on `FsAdapter`
(`packages/ruby-compat/src/fs-adapter.ts:98-99`), so its `NonNullable<...>` is
now a no-op and its arm of the runtime presence check can never fire — exactly
the dead guard #7646 exists to remove, one package over. Rails has no
counterpart to any of it: `File.read` is simply there.

`writeFile` and `mkdir` are still optional on the interface, so their arms are
live; this is a partial cleanup, not a deletion of the whole helper — unless the
same argument is made for those two, which is the second half of the decision
below.

## Acceptance criteria

- The `readFile` entry in `AsyncFs` and its arm of the runtime presence check
  are removed, since the interface now guarantees it.
- Decide, and record in the PR body, whether `writeFile`/`mkdir` should follow
  `readFile` and become required on `FsAdapter` — an adapter that cannot write
  or mkdir asynchronously has the same "encodes a state the system does not
  have" smell. If yes, the whole `AsyncFs` alias and its guard go, and the
  in-repo implementations (the website VFS adapter, notably) grow the methods.
  If no, the two remaining arms stay and the reason is stated.
- `pnpm typecheck` clean and the trailties generator tests pass.
