---
title: "converge-association-duplicate-matches-foreign-key"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6394
claim: "2026-08-12T09:06:01Z"
assignee: "converge-association-duplicate-matches-foreign-key"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the re-measure in `extractor-predicate-and-closure-order-artifacts`
(RFC 0084). `packages/activerecord/src/associations/association.ts` carries
**two** ports of the same Rails method: a public `matchesForeignKey` and a
private `isMatchesForeignKey`. Rails has one
(`associations/association.rb:411-418`):

    def matches_foreign_key?(record)
      if foreign_key_for?(record)
        record.read_attribute(reflection.foreign_key) == owner.id ||
          (foreign_key_for?(owner) && owner.read_attribute(reflection.foreign_key) == record.id)
      else
        owner.read_attribute(reflection.foreign_key) == record.id
      end
    end

One Rails method is one TS method (CLAUDE.md, "Decomposition"), so the duplicate
is invented surface on its own. It also carries the divergence the ratchet
reports: `api-compare` name-matches Rails against `isMatchesForeignKey`, whose
call sequence is `reflection, options, foreignKey, isArray, String,
isForeignKeyFor, every, readAttribute, owner, id` — it resolves
`reflection.foreignKey` BEFORE calling `isForeignKeyFor`, where Rails' first
call is `foreign_key_for?`. That is the baselined row
`associations/association.ts | matches_foreign_key? | order:foreignKey,isForeignKeyFor`.

`association.rb:370-373` is the `foreign_key_for?` Rails calls, and
`isForeignKeyFor` already ports it — so the key-array work `isMatchesForeignKey`
does inline is work Rails delegates.

## Acceptance criteria

1. `association.ts` has ONE port of `matches_foreign_key?`, at the Rails name
   under the repo's predicate convention, with Rails' branch and call order:
   `foreign_key_for?` first, then the read/compare arms.
2. Every caller of the removed spelling is updated; `pnpm parity:api:extra
--package activerecord` does not gain a row.
3. The `order:foreignKey,isForeignKeyFor` row is deleted from
   `call-mismatches-exclude/activerecord/associations/association.json` by hand
   (only-shrink), and the re-measure reports no rows added.
4. Regression coverage fails on the pre-fix baseline — the inverse-wiring cases
   the two bodies differ on (composite FK, the `owner`-side `foreign_key_for?`
   arm) are the ones to cover.
