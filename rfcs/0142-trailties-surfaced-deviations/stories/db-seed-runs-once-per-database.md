---
title: "trails db seed loads db/seeds.ts once per database and ignores seeds:"
status: draft
updated: 2026-10-09
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 40
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found by trailmap (trailmap#48), the first application here with two databases.

`trails db seed` loads `db/seeds.ts` once per database in the environment:

```ts
// packages/trailties/src/commands/db.ts
cmd.command("seed").action(async (opts) => {
  await forEachDatabase(opts, async ({ prefix }) => {
    await runSeed(prefix);
  });
});
```

Observed with a `primary` and a `hub` configured:

```text
[primary] Running seeds...
seeded blazetrailsdev: 4 repositories, 0 from FLEET_REPO_PATHS
[primary] Seeds completed.
[hub] Running seeds...
seeded blazetrailsdev: 4 repositories, 0 from FLEET_REPO_PATHS
[hub] Seeds completed.
```

The file ran twice and wrote the same rows twice. trailmap's seeds are
idempotent so nothing broke, but a seed file with `create` in it would double
every row, and one with a counter or an append would be worse.

Rails loads seeds ONCE, for the primary. The configuration already carries the
flag that says so, and nothing reads it:

```ts
// packages/activerecord/src/database-configurations/hash-config.ts
seeds() {
  return fetch(this.configurationHash, "seeds", this.isPrimary());
}
```

Setting `seeds: false` on the non-primary entry therefore changes nothing
today — trailmap tried it and removed it again rather than leave a line that
reads as configuration but is dead.

Note the interaction with the `--database` narrowing story: inside
`forEachDatabase` each targeted config answers `isPrimary` true, so even once
`seeds()` IS consulted it would answer true for every database until that one
is fixed. The two want fixing together, or this one tested with the
configurations registered as a set.

## Converged shape

`db seed` consults `hashConfig.seeds()` and loads the file for the
configurations that say yes — in Rails' default shape, the primary alone.

## Acceptance criteria

- [ ] `trails db seed` with two databases configured loads `db/seeds.ts` once.
- [ ] `seeds: false` on an entry keeps that database out of the seed run, and
      `seeds: true` on a non-primary opts it back in.
- [ ] A trailties test with a two-database config counts the loads, and fails
      on the current code.
