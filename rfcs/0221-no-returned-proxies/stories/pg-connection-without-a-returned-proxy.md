---
title: "pgConnection returns a Connection, not a Proxy over one"
status: draft
updated: 2026-11-04
rfc: "0221-no-returned-proxies"
cluster: factory-returned
packages: ["activerecord"]
deps: ["no-returned-proxy-lint-gate"]
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

trails:

- `packages/activerecord/src/pg/connection.ts:564`

Rails / Ruby:

- `vendor/pg/v1.5.9/lib/pg/connection.rb:30` (`PG::Connection` reopens the C class; it has no `method_missing`)

The Proxy merges a node-postgres client's members into trails' `Connection`. `PG::Connection` answers exactly its own methods, so the port names the client members it uses on `Connection` as explicit forwarding methods and returns the instance.

See the RFC README for why a returned Proxy is the defect, and trails#9572 for
the first prototype-chain conversion of an instance-level dispatch.

## Acceptance criteria

- [ ] No `new Proxy(` value is returned to a caller from the site(s) above:
      the constructor returns nothing.
- [ ] The class answers the members the Ruby counterpart defines (named in
      Context) as ported members under their Rails names, and nothing else.
      No `method_missing`-style trap is added, in the prototype chain or
      elsewhere, because Ruby has none here.
- [ ] Every trails caller that read a name through the old trap is converted
      to one of those members, or to a member of the object the Ruby caller
      reaches; the PR lists the converted call sites.
- [ ] A test declares a subclass with a `#private` field, constructs it, and
      reads the field, and the ported members are tested.
- [ ] This site's row in the `no-returned-proxy-lint-gate` list is deleted.
- [ ] `pgConnection` leaves the `no-returned-proxy-lint-gate` rule's helper list.
