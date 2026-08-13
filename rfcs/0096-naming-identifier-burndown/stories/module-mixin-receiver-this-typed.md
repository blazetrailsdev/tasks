---
title: "module-mixin-receiver-this-typed"
status: done
updated: 2026-08-13
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6469
claim: "2026-08-13T15:35:52Z"
assignee: "module-mixin-receiver-this-typed"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by RFC 0096 wave 3 (#6459). The largest single block of remaining
`naming` call-argument rows in activerecord — about 12 — is one shape: a ported
module function takes the receiver as an explicit leading parameter where Rails
writes `self`, so the recorder compares Ruby `ref:this` against a TS local name
and no rename can close it.

CLAUDE.md's "Module mixins" section already names the settled idiom for this:
**`this`-typed functions assigned directly to the class**, so the body says
`this` exactly where Rails says `self`. These call sites predate that idiom or
were ported around it.

Rows in this class (measured on #6459's head):

| Rows | Site                                                                                                                                            | Ruby                                                                                  |
| ---: | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
|    5 | `autosave-association.ts#addAutosaveAssociationCallbacks` — `afterCreate(model, cb)` / `afterUpdate(model, cb)` / `beforeSave(model, cb)`       | `after_create save_method` (`autosave_association.rb`)                                |
|    3 | `encryption/extended-deterministic-queries.ts#where` / `#isExists` / `#findBy` — `processArguments(relation, args, ...)` / `(klass, args, ...)` | `process_arguments(self, args, ...)` (`encryption/extended_deterministic_queries.rb`) |
|    1 | `scoping/named.ts#defaultScoped` — `buildDefaultScope(this, () => rel, ...)`                                                                    | `build_default_scope(scope, all_queries:)` (`scoping/named.rb:45-47`)                 |
|    1 | `signed-id.ts#findSigned` — `new UnknownPrimaryKey(modelClass)`                                                                                 | `UnknownPrimaryKey.new(self)` (`signed_id.rb:53`)                                     |
|    1 | `token-for.ts#generateTokenFor` — `generateToken(record)`                                                                                       | `generate_token(self)` (`token_for.rb:120`)                                           |
|    1 | `relation.ts#findByTokenFor`                                                                                                                    | `self`                                                                                |

## Why it is its own story

Each conversion changes how the function is wired onto the class, not just a
local's spelling, so it carries real behavioral risk (`this` binding at the call
site, subclass resolution, the `include()` / `Included<>` seam). #6459 was a
pure-rename PR and folding a mixin rewiring into it would have made the diff
unreviewable. Converting these is the single highest-yield remaining move on the
RFC 0096 activerecord count.

## Acceptance criteria

- [ ] Each site above is either converted to the `this`-typed-function idiom
      (CLAUDE.md "Module mixins") so the body passes `this`, or carries a
      call-site justification naming the specific TypeScript shortcoming that
      blocks it.
- [ ] `API_COMPARE_ALLOW_STALE_BUILD=1 pnpm parity:api:calls:args:report` shows
      the `naming` class down by the rows actually converted, with no new
      `shape` rows and no baseline row added or widened.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.
- [ ] Autosave, encryption deterministic-query, scoping, signed-id and token-for
      suites pass on all three adapters.
