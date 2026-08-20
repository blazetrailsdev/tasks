---
title: "Retire the proxy's three strict-loading helpers; the check lives in find_target"
status: in-progress
updated: 2026-08-20
rfc: "0114-collection-proxy-decomposition"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6759
claim: "2026-08-20T02:52:30Z"
assignee: "retire-collection-proxy-enumerable-block"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/associations/collection-proxy.ts` carries three
strict-loading helpers, **26 code lines**, that Rails does not put on a proxy:

- `_checkStrictLoading` (`:909`, 11)
- `_cascadeStrictLoading` (`:932`, 7)
- `_withoutStrictLoading` (`:973`, 8)

Rails' strict-loading surface is `strict_loading!` / `strict_loading_value` on
`Relation` (`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb`),
the per-record `strict_loading!` in `core.rb`, and one violation raise inside
`Association#find_target`
(`vendor/rails/activerecord/lib/active_record/associations/association.rb`).
`CollectionProxy` has none of it — `strict_loading` is one of the
`QueryMethods` names delegated to `scope`
(`collection_proxy.rb:1128-1137`), and the cascade happens where records are
built.

Open sibling stories on the same subject (coordination — this story removes the
proxy-side copies; they fix the destination):
`0112-one-rails-thing-n-trails-things/strict-loading-check-in-reader-not-find-target`
(currently **blocked**),
`0112/converge-strict-loading-bypass-count-to-skip-strict-loading`,
`0023-surfaced-deviations/audit-collection-proxy-strict-loading-call-sites`
and `0023/collection-proxy-first-no-strict-loading-cascade`.

## Converged shape

The violation check runs from `Association#find_target`; the cascade runs where
Rails sets `strict_loading` on instantiated records; `strict_loading` on the
proxy resolves through the delegate table to `scope`. The three proxy helpers
are deleted and their call sites read the association / relation surface.

If `strict-loading-check-in-reader-not-find-target` stays blocked and its
blocker also blocks this, `pnpm tasks block` this story citing that story id —
do not close it by keeping the helpers with a better comment.

## Acceptance criteria

- `_checkStrictLoading`, `_cascadeStrictLoading`, `_withoutStrictLoading` no
  longer exist in `collection-proxy.ts`.
- No new strict-loading helper is added there.
- Strict-loading violations still raise for a collection read on a
  `strict_loading` owner, proven by an existing or new test that fails on the
  baseline if the raise is lost.
- `pnpm parity:api:calls` / `:args` add zero rows for any touched file.
- Existing suites pass unchanged, incl. the strict-loading cases in
  `has-many-associations.test.ts` and `collection-proxy.test.ts`. No test
  renamed.
