import { Migration8 } from "../../src/migration-base.ts";

/**
 * Each document's markdown, frontmatter stripped, so trailmap's `/search` can
 * match it in SQL. Same version as trailmap's migration so the two schemas stay
 * one history. Rows are filled by ingest (`backfillBodies`), not here: only
 * ingest knows the main worktree the files live in.
 */
export class AddBodyToDocuments extends Migration8 {
  async change() {
    await this.addColumn("stories", "body", "text");
    await this.addColumn("rfcs", "body", "text");
  }
}
