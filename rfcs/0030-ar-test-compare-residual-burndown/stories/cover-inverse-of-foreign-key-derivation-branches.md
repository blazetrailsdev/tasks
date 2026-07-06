---
title: "Cover the untested inverse_of foreign-key derivation branches in _deriveForeignKey"
status: ready
updated: 2026-07-06
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
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

PR #4644 (story `unskip-where-chain-self-join-cases`) added inverse_of
foreign-key derivation to `Relation#_deriveForeignKey`
(`packages/activerecord/src/relation.ts:2096-2140`), a faithful port of Rails'
`Reflection#foreign_key` / `#derive_foreign_key`
(`vendor/rails/activerecord/lib/active_record/reflection.rb:551-566, 812-816`).
The recursion into the inverse reflection (with the `inferFromInverseOf=false`
bounce guard) newly supports three code paths that NO existing test exercises,
because the only canonical self-referential association is
`Comment#children`/`#parent`, which sets `className: "Comment"` explicitly and
whose inverse is a plain `belongsTo`:

1. the `className`-absent fallback (`_camelize(isPlural ? _singularize(name) :
name)`) at `relation.ts:2124-2129`;
2. a polymorphic inverse (inverse reflection with `options.as` → `<as>_id`);
3. a composite / explicitly-keyed inverse (`options.foreignKey` string[] or
   scalar returned verbatim from the recursion).

The reviewer flagged this on PR #4644 (round 2, point 2) as acceptable-but-
uncovered. Reaching these branches needs a canonical model that grows a
self-referential association WITHOUT an explicit `className:` (or a
polymorphic/composite self-inverse). Per project convention we do not add a
bespoke non-canonical model just to hit an untriggered branch, so this is
parked until such a shape exists in the canonical schema.

## Acceptance criteria

- [ ] When a canonical model grows a self-referential association whose target
      resolves without an explicit `className:` (or a polymorphic/composite
      self-inverse), add a test that exercises the corresponding
      `_deriveForeignKey` inverse_of branch and asserts the derived FK matches
      Rails.
- [ ] Cover the `isPlural` fallback (has_many self-assoc, no className), the
      polymorphic-inverse (`as:`) path, and the composite/explicit-FK inverse.
- [ ] If no canonical shape ever surfaces, close as wontfix with a note that
      the branch is a faithful Rails port with no reachable canonical input.
