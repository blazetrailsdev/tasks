---
title: "relation-scopes-carry-scope-names-shared-across-models"
status: claimed
updated: 2026-10-20
rfc: "0198-activerecord-mixin-host-typing"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-10-20T19:49:38Z"
assignee: "ar-type-remaining-src-part-4"
blocked-by: null
closed-reason: null
---

## Context

After trails#9142, scope bodies in `packages/activerecord/src/test-helpers/models/**` that call another model's named scope are typed through the `RelationScopes` / `ScopeOn` augmentation (`packages/activerecord/src/relation.ts` `interface RelationScopes`, `packages/activerecord/src/scoping/named.ts` `ScopeOn`). Three scope names are defined on two models, and interface merging cannot give one property two `ScopeOn` types (TS2717). Their callers still use `this: any`:

- `open`: `account.ts` (`available` scope) and `topic.ts` (`openReplies`), from Account's scope and `Reply.open` (`vendor/rails/v8.0.2/activerecord/test/models/reply.rb`).
- `general`: `member.ts` (`generalClub`), from `club.rb` and `category.rb`.
- `orderedByPostId`: `author.ts` (`commentsWithOrder`), from `comment.rb` and `post.rb`.

Rails resolves each through relation delegation to the model class (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/delegation.rb`).

## Acceptance criteria

- [ ] `RelationScopes` (or `ScopeOn`) can carry a scope name defined on more than one model, for example a union keyed by model, so the `this: any` on those callers goes away.
- [ ] Typing only: `pnpm typecheck` and `pnpm parity:api:extra:gate` stay green.
