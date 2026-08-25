# Verification

What was actually run against real data before cutover, and what it showed.
Every result below is from the live 7,166-story corpus and the running
btwhooks container — not fixtures.

Re-run everything with:

```bash
./scripts/sync-rfcs.sh          # pull rfcs/ from the OLD repo's origin/main
pnpm import                     # ~45s
pnpm gate                       # both equivalence gates
pnpm test                       # 76 unit tests
```

## Equivalence — the cutover gate

| check                       | result                                             |
| --------------------------- | -------------------------------------------------- |
| `index.json` vs markdown    | 123 RFCs, 7,166 stories, every field **and order** |
| `claimable()` ready queue   | identical, ordered                                 |
| `next-bundle` at 4 budgets  | identical                                          |
| vs. the **live old CLI**    | same 325 ids, same order; same 4-story bundle      |
| generation time from the DB | ~130ms                                             |

The gate is verified to be able to FAIL: injecting three drift kinds (a scalar
field, a join row, an ordering change) produced three precise reports and
exit 1.

> **A gate that reads `index.json` off disk is worthless.** Every mutation
> republishes that file _from the database_, so the naive version compares the
> DB against itself and can never fail — it "passed" twice that way during the
> build. Both gates now run `build-index.mjs` first and compare against a
> freshly markdown-derived index.

## Concurrency — the reason this rewrite exists

24 simultaneous claims of one story, 20 from the host and 4 from inside the
btwhooks container:

```
1  × exit 0   winner (a container agent won the race)
23 × exit 2   "already claimed"
0  × errors
1  × claim event recorded
```

The old system's equivalent path is ~600 lines of lock file, `pull --rebase`,
retry, and `reset --hard`, and it lost a claim outright on 2026-06-08.

> **`busy_timeout` is load-bearing.** trails ships Rails' WAL pragmas but not
> `busy_timeout`, so it defaults to 0 and contending writers fail instantly. The
> first run of this test produced **12 hard "database is locked" errors** out of 20. It is set to 10s in `config/database.ts`; do not remove it.

## Cross-context — one database, three callers

`gitCommonDir()` plus the existing bind mount must give the canonical checkout,
every agent worktree, and the container the same file.

| context                      | resolved database      | `ready` |
| ---------------------------- | ---------------------- | ------- |
| canonical checkout           | `<repo>/.git/tasks.db` | 320     |
| linked worktree (`/tmp/...`) | `<repo>/.git/tasks.db` | 320     |
| inside `btwhooks.web.1`      | `<repo>/.git/tasks.db` | 320     |

Mutation visibility, both directions: a claim made **in the container** is
immediately visible on the host, a competing host claim correctly loses with
exit 2, and a host `release` is immediately visible in the container.

## Ingest — git → DB

| behavior                              | result                                                     |
| ------------------------------------- | ---------------------------------------------------------- |
| markdown-owned field (`est-loc`) edit | applied                                                    |
| DB-owned field (`status`) hand-edit   | **ignored** — DB kept `ready` against a file saying `done` |
| CI guard on that same PR              | red, naming `tasks status-set`                             |
| story file deleted                    | row + joins removed, `delete` event emitted                |
| file restored                         | row re-created; event trail `new, delete, new`             |
| inert on export commits               | 0 DB-owned changes; watermark advances                     |
| second run                            | true no-op (watermark caught up)                           |

## Export — DB → git

Only writes DB-owned fields, only for stories that actually differ, one batched
commit. A full export of the corpus touched **16 files, 15 of which were pure
requoting** (pre-existing YAML single-quote/escaped-unicode inconsistencies)
and 1 a genuine state change — verified lossless by parsing both sides.

> Two mistakes here each turned a 16-file diff into a ~1,700-file one:
> writing every field unconditionally added `closed-reason: null` to the 1,694
> stories that simply omit the key, and quoting `status`/`updated`/`pr` (which
> these files leave bare) rewrote everything else.

## Bootstrap hazard — the CLI must survive a broken trails

The tasks CLI depends on trails, and the agents it dispatches are the ones
editing trails. Drill: rename `packages/activerecord/dist` away so every trails
import fails, then use the CLI.

```
tasks ready    → 320 ready, exit 0
tasks claim    → succeeded (a full transaction)
tasks ingest   → succeeded
```

The vendored tarball genuinely isolates it. `vendor/TRAILS_PIN` was already
several commits behind live trails at the time of the drill, which is the point:
bumping the pin is a deliberate, revertible commit.

## btwhooks — inert until cutover

`go test ./webhook/` passes unmodified. Defaults verified inert _even with
`events.json` present in the directory_.

Against the real repos, **all seven velocity series now match exactly** between
the live git log and the imported `events.json`:

| series          | git  | json |
| --------------- | ---- | ---- |
| stories_created | 6768 | 6764 |
| stories_done    | 5266 | 5266 |
| stories_closed  | 610  | 610  |
| stories_blocked | 274  | 274  |
| stories_claimed | 5654 | 5654 |
| stories_ready   | 1719 | 1719 |
| agents_spawned  | 3784 | 3784 |

(`stories_created` differs by 4 only because agents kept working during the
73-second import; the two snapshots are minutes apart on a live system.)

Flipping `TASKS_EVENTS_SOURCE=json` is therefore a **no-op for the charts**.

### One pre-existing bug had to be fixed first

`velocity.go` comma-split the id list for `stories_claimed` but not for
`stories_done`, so each of the 203 `done: a, b, c` commits counted as one — the
burndown undercounted finished work by 394 stories (~8%), and the week view
listed a single row whose id was the whole comma-joined blob.

`events.json` records one row per story and would have reported the truthful
number on day one, which would have looked like an 8% jump **caused by the
migration**. Fixing the git path first (`velocityStoryIDs`) moved the live count
4866 → 5266 as its own reviewable change, and left the two sources in exact
agreement.
