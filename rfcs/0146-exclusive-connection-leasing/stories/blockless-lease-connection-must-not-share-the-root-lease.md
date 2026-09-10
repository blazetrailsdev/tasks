---
title: "Give blockless leaseConnection() callers distinct leases instead of the shared root lease"
status: draft
updated: 2026-09-10
rfc: "0146-exclusive-connection-leasing"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Residual of `lease-identity-must-not-collapse-to-context-zero` (trails#7672),
whose AC1 was narrowed to the block form in tasks#96.

Rails leases a connection to `Thread.current`:
`connection_lease` is `@leases[ActiveSupport::IsolatedExecutionState.context]`
(`activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:710-711`),
and `lease_connection` sets `lease.sticky = true` and checks out into that lease.
Two threads never share a lease.

trails#7672 made `ConnectionPool#withConnection`'s checkout arm fork a fresh lease
identity (`withLeaseContext`, `connection-adapters/abstract/connection-pool/execution-context.ts`),
so block-form borrows no longer collide. The blockless sticky form still does:
`leaseConnection()` / `leaseConnectionSync()` (`connection-pool.ts`, the
`connectionLease()` callers above `withConnection`) key on the ambient context,
and every unscoped flow resolves that to the one `ROOT_CONTEXT` singleton. Two
concurrent unscoped `Base.connection` calls therefore still share one lease and
one adapter, and only the adapter monitor keeps that safe.

A second shape follows from the same gap: when a forked `withConnection` ends with
its lease still sticky, the connection is handed back to the caller's lease, or
checked in if a concurrent sibling already filled it (`withConnection`'s outer
`finally`). Rails has no such branch, because one thread cannot run two forks
against its own lease; the checkin arm exists only because siblings share the
ambient lease.

## Acceptance criteria

- [ ] Two concurrent unscoped flows that call `leaseConnection()` on the same pool
      get distinct `Lease` objects, with no `withExecutionContext` opt-in at the
      call site (the Definition of done of the parent story still applies).
- [ ] With that in place, `withConnection`'s sibling-checkin arm is unreachable and
      is deleted, leaving Rails' `release_connection(lease) unless lease.sticky`
      (`connection_pool.rb:421`) as the only release path.
- [ ] If no async-context mechanism can give a blockless call its own identity,
      block the story naming the specific language gap. Do not narrow the AC.
