---
title: "remove-connection-reads-inherited-specification-name"
status: done
updated: 2026-09-21
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7938
claim: "2026-09-21T21:09:08Z"
assignee: "remove-connection-reads-inherited-specification-name"
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `remove connection should not remove parent` (`packages/activerecord/src/connection-adapters/connection-handler.test.ts`). Rails `connection_handler_test.rb:327-331`: `klass2 = Class.new(Base); klass2.remove_connection; assert_not_nil Base.lease_connection`.

Rails `connection_handling.rb:355-366` reads `name` from the class's OWN `@connection_specification_name` (`if defined?(@connection_specification_name)`), so a subclass with no own name passes nil and removes nothing. trails `removeConnection` (`connection-handling.ts:368-382`) calls `connectionSpecificationName.call(this)`, which walks to the parent, so `Klass2.removeConnection()` removes Base's `ActiveRecord::Base` pool and the next `Base.leaseConnection()` throws `ConnectionNotDefined`. Observed only when another test ran first in the file; cause read from both sources, fix not attempted.

## Acceptance criteria

`removeConnection` reads only the own name (own-property check); unskip the test.
