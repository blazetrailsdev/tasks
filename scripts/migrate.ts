import { Base } from "@blazetrails/activerecord";
import config from "../config/database.js";
import { migrate, status } from "../src/migrator.js";
import { resolveDbPath } from "../src/db-path.js";

const ENV = (process.env.TRAILS_ENV ?? "development") as keyof typeof config;

async function main() {
  await Base.establishConnection(config[ENV]);
  const cmd = process.argv[2] ?? "up";
  if (cmd === "status") {
    console.log("\n Status   Migration ID     Name");
    console.log("--------------------------------------------------");
    for (const r of await status()) {
      console.log(`  ${r.status === "up" ? "  up  " : " down "}   ${r.version}  ${r.name}`);
    }
    console.log();
    return;
  }
  await migrate();
  console.log(`migrated: ${resolveDbPath()}`);
}

await main();
process.exit(0);
