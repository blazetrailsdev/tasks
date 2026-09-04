---
title: "parity:api:extra misreports rack-test's operator-spelled members as extra surface"
status: draft
updated: 2026-09-04
rfc: "0137-rack-test-gem-port"
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
closed-reason: null
---

## Context

PR #7468 landed the first real rack-test source
(`packages/rack-test/src/test.ts`, `packages/rack-test/src/cookie-jar.ts`).
`pnpm parity:api:extra --package rack-test` scores five of its members as extra
surface even though every one is the settled trails spelling of a Ruby member
that exists in the vendored gem:

| TS name                    | Ruby                                             | vendored source                                        |
| -------------------------- | ------------------------------------------------ | ------------------------------------------------------ |
| `Session.new` (novel)      | `def self.new(app, default_host = DEFAULT_HOST)` | `vendor/rack-test/lib/rack/test.rb:57-65`              |
| `Cookie#spaceship` (novel) | `def <=>(other)`                                 | `vendor/rack-test/lib/rack/test/cookie_jar.rb:106-108` |
| `CookieJar#get` (moved)    | `def [](name)`                                   | `cookie_jar.rb:146-152`                                |
| `CookieJar#set` (moved)    | `def []=(name, value)`                           | `cookie_jar.rb:155-157`                                |
| `CookieJar#push` (moved)   | `def <<(new_cookie)`                             | `cookie_jar.rb:186-193`                                |

`scripts/api-compare/operator-order-spelling.ts` carries per-FQN entries for
rack-session's `[]` readers (`operator-order-spelling.ts:157-160`) but has no
rack-test entries, and `conventions.ts:1504,1539` maps `new` only for
`initialize`/`new` -> `constructor`, not for a Ruby `self.new` override that
ports as a static factory.

The count is small and rack-test is not in `GATED_PACKAGES`, so nothing is red
today. The cost is that the figure misreports: a reviewer reading
`parity:api:extra --package rack-test` sees five invented names where there are
none, which is exactly the signal the tool exists to give.

## Converged shape

Teach the spelling map the rack-test operator members so they resolve to their
Ruby counterparts, the way the rack-session entries already do. Note the trap
recorded against `OPERATOR_SPELLING_BY_FQN`: `scripts/` has a test asserting
the current unmapped state, so it moves with the map.

`self.new` may need its own treatment rather than an operator entry — a Ruby
`self.new` override is not an operator and not `initialize`; decide whether it
belongs in `conventions.ts`'s name rules or in `SKIP_GROUPS`.

## Acceptance criteria

- [ ] `pnpm parity:api:extra --package rack-test` reports 0 novel and 0 moved
      for `test.ts` and `cookie-jar.ts`.
- [ ] The `scripts/` test that asserts the previous unmapped state is updated
      in the same PR.
- [ ] No `@noRailsEquivalent` receipt is added to rack-test to buy the number
      down — every one of these names has a Ruby counterpart.
