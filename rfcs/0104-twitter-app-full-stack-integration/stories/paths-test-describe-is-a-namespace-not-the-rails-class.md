---
title: "paths.test.ts's describe is Rails::Paths, so all 11 matched tests score WRONG DESCRIBE"
status: draft
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while adding the two `skip_*!` tests in PR #7497
(`paths-path-omits-the-skip-flag-half-of-the-rails-flag-triple`).

`packages/trailties/src/paths.test.ts` wraps its whole body in
`describe("Rails::Paths", ...)`. `parity:test` normalizes the Ruby side to the
test CLASS name, so every test in the file lands in the WRONG DESCRIBE bucket:

````text
paths_test.rb   paths.test.ts   11  0  11  0  28  0  39
                                OK    Desc
```text

with each row reading

```text
ruby:  pathstest > it is possible to skip a path from eager loading
ts:    rails::paths > it is possible to skip a path from eager loading
```text

Rails' file declares two classes — `PathsTest`
(`vendor/rails/railties/test/paths_test.rb:6`) and `PathsIntegrationTest`
(`:302`) — so the correct shape is two describes, not one namespace describe.
The single "A failed symlink is still a valid file" test at the end of
paths.test.ts is the `PathsIntegrationTest` member and currently sits in the
`Rails::Paths` block too.

The same shape is confirmed correct next door: `middleware-stack-proxy.test.ts`
(added in the same PR) uses `describe("MiddlewareStackProxyTest")` and scores
10/10 with 0 Desc.

Note `backtrace-cleaner.test.ts` shows the identical `11 ... 11` Desc pattern in
the same report and is likely the same cause — check it while here.

## Converged shape

- `paths.test.ts` uses `describe("PathsTest", ...)` for the members of
  `paths_test.rb:6-300` and a second `describe("PathsIntegrationTest", ...)` for
  the symlink test (`paths_test.rb:302+`).
- Only the `describe` strings change; no `it` name is touched (CLAUDE.md's
  test-name rule).

## Acceptance criteria

- [ ] `pnpm parity:test` reports `paths_test.rb` with 0 in the Desc column.
- [ ] The trailties WRONG DESCRIBE total drops by 11.
- [ ] No `it` name changed.
````
