#!/usr/bin/env node
/*
 * Fetch student offers and store the name, offer, and description of each one
 * in a MySQL table.
 *
 * Setup (once, in the folder where this file lives):
 *     npm install mysql2
 *
 * Run (Node.js 18 or newer):
 *     node offers_to_mysql.js
 *
 * Connection settings come from environment variables, so no password has to
 * be saved in this file. Anything you leave unset uses the default shown:
 *
 *     MYSQL_HOST       localhost
 *     MYSQL_PORT       3306
 *     MYSQL_USER       root
 *     MYSQL_PASSWORD   (you are prompted if this is not set)
 *     MYSQL_DATABASE   student_offers   (created if it does not exist)
 *     MYSQL_TABLE      offers           (created if it does not exist)
 *
 * Running the script again updates existing rows instead of duplicating them.
 */
 
"use strict";
 
const readline = require("readline");
const { Writable } = require("stream");
 
let mysql;
try {
  mysql = require("mysql2/promise");
} catch (err) {
  console.error("Missing dependency. Install it with:  npm install mysql2");
  process.exit(1);
}
 
const URL = "https://www.studentoffers.co/api/offers";
 
// ----------------------------------------------------------------- fetching --
 
/** Download the offers list and return it as parsed JSON. */
async function fetchOffers(url = URL) {
  if (typeof fetch !== "function") {
    throw new Error("This script needs Node.js 18 or newer (found " + process.version + ").");
  }
 
  let response;
  try {
    response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (offers-script)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(30000),
    });
  } catch (err) {
    const reason = (err.cause && err.cause.message) || err.message;
    throw new Error("Could not reach " + url + ": " + reason);
  }
 
  if (!response.ok) {
    throw new Error("Request failed: HTTP " + response.status + " " + response.statusText);
  }
 
  try {
    return await response.json();
  } catch (err) {
    throw new Error("The response was not valid JSON.");
  }
}
 
/** Return [id, name, offer, description] rows, skipping unusable records. */
function extract(offers) {
  if (!Array.isArray(offers)) {
    throw new Error("Expected a JSON list of offers.");
  }
 
  const text = (value) =>
    typeof value === "string" && value.trim() !== "" ? value.trim() : null;
 
  const rows = [];
  for (const item of offers) {
    if (item === null || typeof item !== "object" || !Number.isInteger(item.id)) {
      continue;
    }
    const name = text(item.name);
    if (name === null) {
      continue;
    }
    rows.push([item.id, name, text(item.offer), text(item.description)]);
  }
  return rows;
}
 
// ----------------------------------------------------------------- database --
 
/** Allow only plain names for the database/table, then backtick-quote them. */
function identifier(value, what) {
  if (!/^[A-Za-z0-9_]{1,64}$/.test(value)) {
    throw new Error(
      "Invalid " + what + " name '" + value + "': use only letters, numbers, and underscores."
    );
  }
  return "`" + value + "`";
}
 
/** Ask for the password without showing it on screen. */
function promptPassword(question) {
  return new Promise((resolve, reject) => {
    let muted = false;
    let answered = false;
 
    // readline echoes typed characters to its output; this one can be silenced.
    const output = new Writable({
      write(chunk, encoding, callback) {
        if (!muted) {
          process.stdout.write(chunk, encoding);
        }
        callback();
      },
    });
 
    const rl = readline.createInterface({
      input: process.stdin,
      output,
      terminal: process.stdin.isTTY === true,
    });
 
    rl.on("SIGINT", () => {
      process.stdout.write("\n");
      process.exit(130);
    });
    rl.on("close", () => {
      if (!answered) {
        reject(new Error("No password entered."));
      }
    });
 
    rl.question(question, (answer) => {
      answered = true;
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
    muted = true; // the question is already printed; hide what is typed next
  });
}
 
async function getSettings() {
  let password = process.env.MYSQL_PASSWORD;
  if (password === undefined) {
    password = await promptPassword("MySQL password: ");
  }
 
  const port = Number(process.env.MYSQL_PORT || 3306);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("MYSQL_PORT must be a port number.");
  }
 
  return {
    host: process.env.MYSQL_HOST || "localhost",
    port,
    user: process.env.MYSQL_USER || "root",
    password,
    database: process.env.MYSQL_DATABASE || "student_offers",
    table: process.env.MYSQL_TABLE || "offers",
  };
}
 
/** Create the database/table if needed, then insert or update every row. */
async function store(rows, settings) {
  const database = identifier(settings.database, "database");
  const table = identifier(settings.table, "table");
 
  const connection = await mysql.createConnection({
    host: settings.host,
    port: settings.port,
    user: settings.user,
    password: settings.password,
    charset: "utf8mb4", // needed for symbols such as € and ₹
  });
 
  try {
    try {
      await connection.query("USE " + database);
    } catch (err) {
      if (err.code !== "ER_BAD_DB_ERROR") {
        throw err; // anything other than "unknown database"
      }
      await connection.query(
        "CREATE DATABASE " + database + " CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
      );
      await connection.query("USE " + database);
    }
 
    await connection.query(
      "CREATE TABLE IF NOT EXISTS " + table + " (" +
        " id          INT          NOT NULL PRIMARY KEY," +
        " name        VARCHAR(255) NOT NULL," +
        " offer       TEXT," +
        " description TEXT," +
        " updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP" +
        "                          ON UPDATE CURRENT_TIMESTAMP" +
        ") CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    );
 
    // The id is the site's own id for the offer. Names are not unique on the
    // site, so the id is what keeps re-runs from creating duplicates.
    await connection.beginTransaction();
    try {
      await connection.query(
        "INSERT INTO " + table + " (id, name, offer, description) VALUES ? " +
          "ON DUPLICATE KEY UPDATE" +
          " name = VALUES(name)," +
          " offer = VALUES(offer)," +
          " description = VALUES(description)",
        [rows]
      );
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    }
 
    const [result] = await connection.query("SELECT COUNT(*) AS total FROM " + table);
    return result[0].total;
  } finally {
    await connection.end();
  }
}
 
// --------------------------------------------------------------------- main --
 
async function main() {
  const offers = await fetchOffers();
 
  const rows = extract(offers);
  if (rows.length === 0) {
    throw new Error("No offers found in the response; nothing was written.");
  }
 
  const settings = await getSettings();
 
  let total;
  try {
    total = await store(rows, settings);
  } catch (err) {
    if (err.code || err.errno) {
      throw new Error("MySQL error: " + (err.message || err.code));
    }
    throw err;
  }
 
  console.log(
    "Stored " + rows.length + " offers in " + settings.database + "." + settings.table +
      " (table now has " + total + " rows)."
  );
}
 
if (require.main === module) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
 
module.exports = { fetchOffers, extract, store, main };