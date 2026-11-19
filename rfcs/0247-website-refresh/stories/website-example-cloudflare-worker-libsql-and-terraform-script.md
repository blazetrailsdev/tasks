---
title: "Cloudflare Workers example: libSQL arm and a Terraform-managed Worker script"
status: draft
updated: 2026-11-19
rfc: "0247-website-refresh"
cluster: null
packages: ["activerecord"]
deps: ["libsql-remote-adapter-native-addon-not-worker-capable"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10380 shipped `examples/cloudflare-worker` on PostgreSQL through Hyperdrive and deployed it for real,
but left two criteria of `website-example-cloudflare-worker` open:

- The libSQL (Turso) arm: `LibSQLRemoteAdapter` runs on the native `libsql` addon
  (`packages/activerecord/lib/sqlite/libsql.ts:1`), so it cannot load in a Worker
  (`libsql-remote-adapter-native-addon-not-worker-capable`).
- Terraform owning the Worker script, its `workers.dev` subdomain and its secrets: `wrangler deploy`
  (`examples/cloudflare-worker/scripts/deploy.sh`) uploads the bundle and binds the Hyperdrive config
  Terraform created (`infra/worker.tf`). `cloudflare_workers_script_subdomain` needs the script to exist,
  so from a clean account it cannot be applied before the first build.

## Acceptance criteria

- [ ] `config/database.ts` / `worker/index.ts` select PostgreSQL via Hyperdrive or libSQL remote from one
      setting, and both are deployed and serve `Post` reads and a `transaction` write.
- [ ] With `libsql = true`, `infra/` provisions a Turso database (Turso provider, or an existing URL and token).
- [ ] `infra/` manages the Worker script (built bundle as `content`), its `workers.dev` subdomain and its
      secrets, so `terraform apply` after `pnpm run build` is the whole setup.
