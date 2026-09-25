---
title: "collectionProxyFor returns the memoized proxy without the reader's reset_scope"
status: done
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8101
claim: "2026-09-25T18:51:40Z"
assignee: "initialize-cache-skips-lookup-store-so-generated-cache-store-is-omitted"
blocked-by: null
closed-reason: null
---

## Context

Rails' collection reader resets the proxy scope on every read:
`CollectionAssociation#reader` ends
`@proxy ||= CollectionProxy.create(klass, self); @proxy.reset_scope`
(`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:34-43`).
`CollectionProxy#scope` memoizes `@scope ||= @association.scope`
(`collection_proxy.rb:949-951`), so the reset is what lets a second
`author.no_joins_comments.count` rebuild a disable-joins scope and re-run the
through `pluck`.

trails' test-facing `collectionProxyFor`
(`packages/activerecord/src/associations.ts`, exported as `association` in
many AR tests) returns the memoized `instance._proxy` and skips
`resetScope()`. The real reader (`CollectionAssociation#reader`,
`packages/activerecord/src/associations/collection-association.ts`) does call
it. Any test that reads the same collection twice through `association(x, "y")`
therefore sees a stale scope. Four
`has_many_through_disable_joins_associations_test.rb` tests went red on query
counts for exactly this reason until trails#8070 switched them to the dotted
reader.

## Converged shape

`collectionProxyFor` reads through the association's `reader`, so it carries
the same `reset_scope`. Alternatively, its test call sites move to the dotted
accessor and the helper is retired, matching Rails' `record.assoc` reads.

## Acceptance criteria

- Reading a collection twice through the helper runs the scope build twice, as
  the Rails reader does. A test pins it with a disable-joins `count` query

  count of 2 on the second read.

- No test depends on the stale-scope behaviour.
