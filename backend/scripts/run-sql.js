import fs from "fs";
import path from "path";
import process from "process";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const fileArg = process.argv[2];
if (!fileArg) {
  console.error("Usage: node scripts/run-sql.js <sql-file>");
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set. Add it in backend/.env or shell env.");
  process.exit(1);
}

const sqlPath = path.resolve(process.cwd(), fileArg);
if (!fs.existsSync(sqlPath)) {
  console.error(`SQL file not found: ${sqlPath}`);
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, "utf8");
const { Client } = pg;
const client = new Client({ connectionString: databaseUrl });

try {
  await client.connect();
  await client.query(sql);
  console.log(`Executed SQL: ${fileArg}`);
} catch (error) {
  console.error(`Failed SQL: ${fileArg}`);
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
