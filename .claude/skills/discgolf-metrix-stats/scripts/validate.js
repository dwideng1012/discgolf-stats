#!/usr/bin/env node
/**
 * Käsurea valideerimise skript.
 *
 * Kasutamine:
 *   node validate.js <api-response.json> [user_id]
 *
 * Sisend: JSON fail Discgolf Metrix API vastustest (?content=result&id=X).
 * Väljund: kogu statistika + ristkontroll API kogusummade vastu.
 */

const fs = require("fs");
const stats = require("./metrix-stats.js");

function fmtPct(v) {
  if (v === null) return "—";
  return v.toFixed(1) + "%";
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error("Kasutamine: node validate.js <api-response.json> [user_id]");
    process.exit(1);
  }

  const jsonPath = args[0];
  const userId = args[1] || null;

  const raw = fs.readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(raw);

  if (!data.Competition) {
    console.error("Vigane API vastus: Competition väli puudub.");
    process.exit(1);
  }

  const result = stats.computeRoundStats(data.Competition, userId);
  if (!result) {
    console.error("Mängijat ei leitud.");
    process.exit(1);
  }

  console.log("==========================================");
  console.log(`Võistlus: ${result.name}`);
  console.log(`Kuupäev:  ${result.date}`);
  console.log(`Rada:     ${result.course}`);
  console.log(`Mängija:  ${result.playerName} (UserID ${result.userId})`);
  console.log(`Koht:     ${result.place}`);
  console.log("------------------------------------------");
  console.log(`Skoor:    ${result.sum} (Diff ${result.diff > 0 ? "+" : ""}${result.diff})`);
  console.log(`Augud:    ${result.holesPlayed}`);
  console.log(`Statistika kogutud: ${result.hasStats ? "jah" : "ei"}`);
  console.log("");

  console.log("Birdie/par jaotus:");
  console.log(`  Aces:    ${result.counts.aces}`);
  console.log(`  Eagles:  ${result.counts.eagles}`);
  console.log(`  Birdies: ${result.counts.birdies}`);
  console.log(`  Pars:    ${result.counts.pars}`);
  console.log(`  Bogeys:  ${result.counts.bogeys}`);
  console.log(`  Doubles+:${result.counts.doubles}`);
  console.log("");

  if (result.hasStats) {
    console.log("Põhistatistika:");
    console.log(`  GRH%:              ${fmtPct(result.grh.pct)} (${result.grh.hits}/${result.grh.total})`);
    console.log(`  BUE%:              ${fmtPct(result.bue.pct)} (${result.bue.hits}/${result.bue.total})`);
    console.log(`  C1 putiprotsent:   ${fmtPct(result.c1.pct)} (${result.c1.made}/${result.c1.attempts})`);
    console.log(`  Birdie putting %:  ${fmtPct(result.birdiePutting.pct)} (${result.birdiePutting.made}/${result.birdiePutting.opps})`);
    console.log(`  Par putting %:     ${fmtPct(result.parPutting.pct)} (${result.parPutting.made}/${result.parPutting.opps})`);
    console.log(`  Scramble %:        ${fmtPct(result.scramble.pct)} (${result.scramble.saved}/${result.scramble.opps})`);
    console.log(`  C2 putid:          ${result.c2.made}/${result.c2.attempts} (${fmtPct(result.c2.pct)})`);
    console.log(`  Trahve:            ${result.penalties.total} (${result.penalties.holesWithPen} augul)`);
    console.log("");
  }

  console.log("Ristkontroll API kogusummade vastu:");
  const issues = stats.validateRound(data.Competition, userId);
  if (issues.length === 0) {
    console.log("  KÕIK ÕIGE - statistika ühtib API kogusummadega.");
  } else {
    console.log("  PROBLEEMID LEITUD:");
    for (const issue of issues) {
      console.log(`    - ${issue}`);
    }
    process.exit(1);
  }
}

main();
