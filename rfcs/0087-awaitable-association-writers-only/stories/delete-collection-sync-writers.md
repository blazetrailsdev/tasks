---
title: "delete-collection-sync-writers"
status: done
updated: 2026-08-05
rfc: "0087-awaitable-association-writers-only"
cluster: null
deps: []
deps-rfc: []
est-loc: 350
priority: 8
pr: 6109
claim: "2026-08-05T01:11:00Z"
assignee: "pin-writing-pool-list-in-setup-transactional-fixtures"
blocked-by: null
closed-reason: null
---

## Context

RFC 0087 §1 removes the collection sync writers alongside the has_one one:
the generated `#{name}=` and `#{name}Ids=` property setters
(`packages/activerecord/src/associations/builder/collection-association.ts`),
their `syncWrite` arms (`associations/collection-association.ts`,
`associations/collection-proxy.ts`,
`associations/has-many-through-association.ts`) and
`CollectionIdsAssignmentError`.

RFC 0068 Design §5 already established the awaitable replacements: `await
owner.association(name).replace([...])` — the port of Rails'
`CollectionAssociation#replace`
(`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb`)
— and `await owner.association(name).idsWriter([...])`, the port of
`ids_writer` (`collection_association.rb:61-83`), whose leading id-resolving
query is why it can never be synchronous.

Migration and deletion are bundled here because the collection `=` setters
already throw on both owner arms (RFC 0068 §5), so there are far fewer working
call sites to move than in the has_one case.

## Acceptance criteria

- [ ] The generated `#{name}=` and `#{name}Ids=` property setters are gone,
      along with their `syncWrite` arms and `CollectionIdsAssignmentError`.
- [ ] Remaining call sites use `replace` / `idsWriter` / `concat`.
- [ ] `pnpm parity:api:extra --package activerecord` drops `CollectionIdsAssignmentError`.
- [ ] `pnpm parity:test` delta non-negative; test names unchanged.
