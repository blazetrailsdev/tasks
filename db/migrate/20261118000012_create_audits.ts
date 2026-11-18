import { Migration8 } from "../../src/migration-base.ts";

/**
 * trailmap's audit reports (RFC 0243, Design § "Schema"). The body is an
 * Active Storage attachment. `(repo, slug, written_at)` is the import's
 * idempotency key. Ingest and export never touch this table.
 */
export class CreateAudits extends Migration8 {
  async change() {
    await this.createTable("audits", (t) => {
      t.string("slug", { null: false });
      t.string("title");
      t.string("format");
      t.string("repo");
      t.datetime("written_at", { null: false });
      t.timestamps();

      t.index(["repo", "slug", "written_at"], { unique: true });
    });
  }
}
