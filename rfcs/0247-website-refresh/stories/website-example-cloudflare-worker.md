---
title: "Example: trails on Cloudflare Workers with Postgres (Hyperdrive) or libSQL, with Terraform"
status: done
updated: 2026-11-20
rfc: "0247-website-refresh"
cluster: website-docs
packages: ["website"]
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: trails#10380
claim: "2026-11-19T21:21:35Z"
assignee: "website-example-cloudflare-worker"
blocked-by: null
closed-reason: null
---

## Context

Can a trails app run on Cloudflare Workers, and on which database? A Worker
loads no native Node modules, so `better-sqlite3` and `node:sqlite` are out.
Two trails adapters have Worker-capable drivers:

- `PostgreSQLAdapter` (`packages/activerecord/lib/connection-adapters/postgresql-adapter.ts:7`
  imports `pg`), which runs in Workers under `nodejs_compat` over Cloudflare TCP
  sockets, pooled by **Hyperdrive**. Full transactions and savepoints.
- `LibSQLRemoteAdapter` (`packages/activerecord/lib/connection-adapters/libsql-remote-adapter.ts`),
  whose libSQL web client is fetch-based (Turso). SQLite, like the dev default.

D1 is not a target: it has no interactive transactions (only `batch()`), which
ActiveRecord's `transaction`, savepoints and transactional fixtures need.
Durable Object SQLite is out of scope for this example.

Model the example on `examples/serverless-lambda` (one controller, one `.tse`
view, one model `Post`, an esbuild bundle, `config/database.ts` choosing the
adapter, and Terraform in `infra/`: `versions.tf`, `variables.tf`,
`lambda.tf`, `postgres.tf`, `outputs.tf`). Examples are to be shown on the
website, which is why this story lives in RFC 0247.

Nobody has verified that trails boots in a Worker at all: trailties boot,
Zeitwerk loading, file-based config, and `node:fs` reads are the expected
breakpoints.

## Acceptance criteria

- [ ] `examples/cloudflare-worker/` holds a minimal trails app (one controller,
      one `.tse` view, `Post`) bundled for Workers with `nodejs_compat`, and
      `pnpm run deploy` deploys it.
- [ ] `config/database.ts` selects PostgreSQL via Hyperdrive or libSQL remote
      (Turso) from one setting; both are deployed and serve `Post` reads and a
      `transaction` write.
- [ ] `infra/` is Terraform with the `cloudflare` provider: the Worker script,
      its route or `workers.dev` subdomain, the Hyperdrive config, and secrets;
      with `postgres = true` it also provisions the Postgres database (Neon via
      its provider, or a variable for an existing URL), and with
      `libsql = true` the Turso database (Turso provider, or an existing URL
      and token). `terraform apply` from a clean account plus `pnpm run deploy`
      is the whole setup, documented in the README as the Lambda example's is.
- [ ] The README records every trails incompatibility found (boot, autoload,
      `fs`, adapters), each fixed in the PR or filed with `pnpm tasks new`
      against the owning package's RFC.
- [ ] The website lists the example (with the Lambda and twelve-dollar-server
      examples, if no examples page exists yet, this story adds one).
