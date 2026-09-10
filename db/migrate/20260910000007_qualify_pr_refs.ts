import { Migration } from "@blazetrails/activerecord";

/**
 * `pr` becomes a `repo#N` string (src/pr-ref.ts), and every existing bare
 * number is backfilled with the repo it actually belongs to.
 *
 * Until tasks and trailmap PRs started closing stories, every stamped PR was a
 * trails PR and a bare integer was unambiguous. It is not any more, and the
 * collision had already happened: bare values under 100 in both tables were a
 * mix of trailmap, tasks and tasks-legacy PRs. Each one below was attributed by
 * matching the story id against that repo's PR head branch (and date), and a
 * number that is a trails PR on one row can be a trailmap PR on another —
 * `include-app-helpers-in-the-view-context` is trails#7558 on its story row
 * but trailmap#9 on one of its events — so the map is keyed by story id AND
 * only ever applied to values under 100. Everything else is a trails PR:
 * tasks-legacy tops out at #76, tasks and trailmap are both under 100, and
 * trails passed #100 in March.
 *
 * `0` (two stories) was never a PR and becomes null.
 */
const ATTRIBUTED: Record<string, string[]> = {
  trailmap: [
    "build-the-trailmap-app-shell",
    "decide-the-view-directory-naming-convention",
    "deploy-trailmap-to-dokku",
    "deployed-rfcs-index-500s-with-connectionnotdefined",
    "equivalence-gate-trailmap-against-the-cli",
    "fixed-host-port-blocks-every-redeploy",
    "gate-the-list-pages-against-ringo",
    "gate-the-list-rows-values-not-just-their-ids",
    "gate-the-markdown-renderer-against-ringo",
    "gate-the-show-pages-against-ringo",
    "include-app-helpers-in-the-view-context",
    "move-mutation-verbs-onto-the-models",
    "move-ranking-onto-story-scopes",
    "move-task-models-into-trailmap",
    "one-status-vocabulary-across-trailmaps-own-pages",
    "render-markdown-in-trailmap",
    "render-the-fleet-dashboard-root-page",
    "render-the-rfc-and-story-show-pages",
    "render-the-rfcs-and-backlog-list-pages",
    "retire-the-go-read-model",
    "serve-the-mutation-verbs-as-json",
    "serve-the-read-verbs-as-json",
    "set-up-ci-for-trailmap",
    "snapshot-the-show-page-equivalence-before-it-goes-circular",
    "split-validation-between-tasks-and-trailmap",
    "use-the-adapters-async-stat-in-the-markdown-gate-walk",
    "verify-the-first-live-redeploy-and-loopback-api",
    "warn-when-the-vendored-ringo-pin-goes-stale",
  ],
  tasks: [
    "custody-transfer-activemodel-stories-from-0023",
    "measure-fixtures-enrollment-gap",
    "measure-what-exclusive-leasing-already-guarantees",
  ],
  "tasks-legacy": [
    "author-rfc-bespoke-test-bloat-burndown",
    "autogen-rfc-stories-table",
    "cross-rfc-convergence-report",
    "heal-stale-tasks-checkout-toolchain",
    "hooks-install-independent-format-gate",
    "index-story-paths",
    "migrate-adapter-ci",
    "migrate-ar-followups",
    "migrate-ar-test-compare",
    "migrate-fixtures",
    "reconcile-all-active-rfcs",
    "resolve-tasks-dir-from-inside-a-tasks-checkout",
    "s4-delete-cached-associations",
    "tasks-touching-command",
    "validate-as-library",
    "validate-status-consistency",
  ],
};

const TABLES: [table: string, idColumn: string][] = [
  ["stories", "id"],
  ["events", "story_id"],
];

const quote = (s: string): string => `'${s.replace(/'/g, "''")}'`;

export class QualifyPrRefs extends Migration {
  async up() {
    await this.changeColumn("stories", "pr", "string");
    await this.changeColumn("events", "pr", "string");

    // The rebuild copies an INTEGER into the TEXT column as text ('7228'), so
    // "still bare" is "has no #", not typeof = 'integer'.
    const bare = "pr IS NOT NULL AND instr(pr, '#') = 0";
    for (const [table, idColumn] of TABLES) {
      await this.connection.execute(
        `UPDATE ${table} SET pr = NULL WHERE ${bare} AND CAST(pr AS INTEGER) <= 0`,
      );
      for (const [repo, ids] of Object.entries(ATTRIBUTED)) {
        await this.connection.execute(
          `UPDATE ${table} SET pr = ${quote(repo)} || '#' || CAST(pr AS INTEGER)
           WHERE ${bare} AND CAST(pr AS INTEGER) < 100 AND ${idColumn} IN (${ids.map(quote).join(", ")})`,
        );
      }
      await this.connection.execute(
        `UPDATE ${table} SET pr = 'trails#' || CAST(pr AS INTEGER) WHERE ${bare}`,
      );
    }
  }

  // Lossy by nature: going back to integers is exactly what drops the repo.
  async down() {
    for (const [table] of TABLES) {
      await this.connection.execute(
        `UPDATE ${table} SET pr = CAST(substr(pr, instr(pr, '#') + 1) AS INTEGER) WHERE pr IS NOT NULL`,
      );
    }
    await this.changeColumn("stories", "pr", "integer");
    await this.changeColumn("events", "pr", "integer");
  }
}
