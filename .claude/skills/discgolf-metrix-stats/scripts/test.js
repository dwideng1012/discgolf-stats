#!/usr/bin/env node
/**
 * Test runner. Käivita: node test.js
 *
 * Sisaldab kõiki test cases'e references/test-cases.md-st.
 * Iga assertion print'ib PASS või FAIL koos detailidega.
 */

const stats = require("./metrix-stats.js");

let passed = 0;
let failed = 0;
const failures = [];

function assert(name, condition, expected, actual) {
  if (condition) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    const msg = `  FAIL  ${name}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`;
    console.log(msg);
    failures.push(msg);
  }
}

function assertClose(name, expected, actual, tolerance = 0.5) {
  const ok = Math.abs(expected - actual) <= tolerance;
  assert(
    name,
    ok,
    `${expected} +/- ${tolerance}`,
    actual !== null ? actual.toFixed(2) : actual
  );
}

// ============================================================
// Test 1: Palivere ring (täisstatistika, reaalne API vastus)
// ============================================================

console.log("\n=== Test 1: Palivere ring ===");

const palivere = {
  ID: 3571727,
  Name: "Võistluse nimi",
  Date: "2026-04-11",
  CourseName: "Palivere → Punane 2024",
  CourseID: "40203",
  MetrixMode: "1",
  Tracks: [
    { Number: "1", Par: "4" },
    { Number: "2", Par: "4" },
    { Number: "3", Par: "4" },
    { Number: "4", Par: "3" },
    { Number: "5", Par: "3" },
    { Number: "6", Par: "3" },
    { Number: "7", Par: "3" },
    { Number: "8", Par: "3" },
    { Number: "9", Par: "3" },
    { Number: "10", Par: "4" },
    { Number: "11", Par: "4" },
    { Number: "12", Par: "3" },
    { Number: "13", Par: "3" },
    { Number: "14", Par: "3" },
    { Number: "15", Par: "4" },
    { Number: "16", Par: "3" },
    { Number: "17", Par: "3" },
    { Number: "18", Par: "4" },
  ],
  Results: [
    {
      UserID: "2821",
      Name: "Kristjan Liiv",
      PlayerResults: [
        { Result: "4", Diff: 0, BUE: "0", GRH: "0", OCP: "0", ICP: "0", IBP: "1", PEN: "0" },
        { Result: "4", Diff: 0, BUE: "0", GRH: "0", OCP: "0", ICP: "0", IBP: "1", PEN: "0" },
        { Result: "5", Diff: 1, BUE: "0", GRH: "0", OCP: "0", ICP: "1", IBP: "0", PEN: "0" },
        { Result: "3", Diff: 0, BUE: "0", GRH: "0", OCP: "0", ICP: "0", IBP: "1", PEN: "0" },
        { Result: "4", Diff: 1, BUE: "0", GRH: "1", OCP: "0", ICP: "2", IBP: "1", PEN: "0" },
        { Result: "2", Diff: -1, BUE: "0", GRH: "0", OCP: "1", ICP: "0", IBP: "0", PEN: "0" },
        { Result: "3", Diff: 0, BUE: "0", GRH: "0", OCP: "0", ICP: "1", IBP: "0", PEN: "0" },
        { Result: "2", Diff: -1, BUE: "1", GRH: "1", OCP: "0", ICP: "0", IBP: "1", PEN: "0" },
        { Result: "2", Diff: -1, BUE: "1", GRH: "1", OCP: "0", ICP: "0", IBP: "1", PEN: "0" },
        { Result: "4", Diff: 0, BUE: "0", GRH: "0", OCP: "0", ICP: "0", IBP: "1", PEN: "0" },
        { Result: "4", Diff: 0, BUE: "0", GRH: "1", OCP: "0", ICP: "1", IBP: "1", PEN: "0" },
        { Result: "3", Diff: 0, BUE: "0", GRH: "0", OCP: "0", ICP: "1", IBP: "0", PEN: "0" },
        { Result: "4", Diff: 1, BUE: "0", GRH: "0", OCP: "0", ICP: "0", IBP: "1", PEN: "0" },
        { Result: "2", Diff: -1, BUE: "0", GRH: "1", OCP: "0", ICP: "1", IBP: "0", PEN: "0" },
        { Result: "4", Diff: 0, BUE: "0", GRH: "0", OCP: "0", ICP: "0", IBP: "1", PEN: "0" },
        { Result: "3", Diff: 0, BUE: "0", GRH: "0", OCP: "0", ICP: "0", IBP: "1", PEN: "0" },
        { Result: "3", Diff: 0, BUE: "0", GRH: "0", OCP: "0", ICP: "0", IBP: "1", PEN: "0" },
        { Result: "4", Diff: 0, BUE: "0", GRH: "0", OCP: "0", ICP: "0", IBP: "1", PEN: "0" },
      ],
      Sum: 60,
      Diff: -1,
      BUETotal: "11%",
      GRHTotal: "28%",
      OCPTotal: "1",
      ICPTotal: "57%",
      IBPTotal: "13",
      PenaltiesTotal: "0",
      Place: 1,
    },
  ],
};

const r1 = stats.computeRoundStats(palivere, "2821");

assert("Sum", r1.sum === 60, 60, r1.sum);
assert("Diff", r1.diff === -1, -1, r1.diff);
assert("Holes played", r1.holesPlayed === 18, 18, r1.holesPlayed);
assert("hasStats", r1.hasStats === true, true, r1.hasStats);
assert("HIO count", r1.counts.aces === 0, 0, r1.counts.aces);
assert("Birdie count", r1.counts.birdies === 4, 4, r1.counts.birdies);

assertClose("GRH%", 27.78, r1.grh.pct);
assert("GRH hits", r1.grh.hits === 5, 5, r1.grh.hits);

assertClose("BUE%", 11.11, r1.bue.pct);
assert("BUE hits", r1.bue.hits === 2, 2, r1.bue.hits);

assert("C1 attempts", r1.c1.attempts === 7, 7, r1.c1.attempts);
assert("C1 made", r1.c1.made === 4, 4, r1.c1.made);
assertClose("C1%", 57.14, r1.c1.pct);

assert("Birdie putt opps", r1.birdiePutting.opps === 3, 3, r1.birdiePutting.opps);
assert("Birdie putt made", r1.birdiePutting.made === 1, 1, r1.birdiePutting.made);
assertClose("Birdie putting %", 33.33, r1.birdiePutting.pct);

assert("Par putt opps", r1.parPutting.opps === 3, 3, r1.parPutting.opps);
assert("Par putt made", r1.parPutting.made === 2, 2, r1.parPutting.made);
assertClose("Par putting %", 66.67, r1.parPutting.pct);

assert("Scramble opps", r1.scramble.opps === 13, 13, r1.scramble.opps);
assert("Scramble saved", r1.scramble.saved === 11, 11, r1.scramble.saved);
assertClose("Scramble %", 84.6, r1.scramble.pct);

assert("OCP attempts", r1.c2.attempts === 1, 1, r1.c2.attempts);
assert("OCP made", r1.c2.made === 1, 1, r1.c2.made); // hole 6 was a C2 birdie

assert("PEN total", r1.penalties.total === 0, 0, r1.penalties.total);
// IBP count cross-check: 13 IBP=1 holes (formula: holesPlayed - c1Made - aces - c2_made_directly)
// hole 6 in Palivere is C2 birdie made directly (OCP=1, ICP=0, IBP=0) — no C1 putt and no tap-in
const ibpCount = palivere.Results[0].PlayerResults.filter((h) =>
  stats.isValidHole(h) && stats.num(h.IBP) === 1
).length;
assert("IBP count = 13 (direct count)", ibpCount === 13, 13, ibpCount);

// Validation should produce no issues
const issues1 = stats.validateRound(palivere, "2821");
assert("Validation passes", issues1.length === 0, "no issues", issues1);

// ============================================================
// Test 2: MetrixMode=0 ring (no stats)
// ============================================================

console.log("\n=== Test 2: MetrixMode=0 ring ===");

const noStats = {
  ID: 999,
  Name: "Lihtne ring",
  Date: "2025-01-01",
  MetrixMode: "0",
  Tracks: [{ Par: "3" }, { Par: "3" }, { Par: "3" }],
  Results: [
    {
      UserID: "100",
      Name: "Test",
      PlayerResults: [
        { Result: "3", Diff: 0, GRH: "0", BUE: "0", OCP: "0", ICP: "0", IBP: "0", PEN: "0" },
        { Result: "4", Diff: 1, GRH: "0", BUE: "0", OCP: "0", ICP: "0", IBP: "0", PEN: "0" },
        { Result: "2", Diff: -1, GRH: "0", BUE: "0", OCP: "0", ICP: "0", IBP: "0", PEN: "0" },
      ],
      Sum: 9,
      Diff: 0,
    },
  ],
};

const r2 = stats.computeRoundStats(noStats, "100");
assert("hasStats=false", r2.hasStats === false, false, r2.hasStats);
assert("Sum", r2.sum === 9, 9, r2.sum);
assert("Birdie count", r2.counts.birdies === 1, 1, r2.counts.birdies);
assert("GRH null", r2.grh === null, null, r2.grh);
assert("Birdie putting null", r2.birdiePutting === null, null, r2.birdiePutting);

// ============================================================
// Test 3: Ace
// ============================================================

console.log("\n=== Test 3: Ring ace'iga ===");

const aceRound = {
  ID: 1000,
  Tracks: [{ Par: "3" }, { Par: "3" }, { Par: "3" }],
  Results: [
    {
      UserID: "200",
      PlayerResults: [
        { Result: "1", Diff: -2, GRH: "1", BUE: "0", OCP: "0", ICP: "0", IBP: "0", PEN: "0" },
        { Result: "3", Diff: 0, GRH: "1", BUE: "0", OCP: "0", ICP: "1", IBP: "1", PEN: "0" },
        { Result: "3", Diff: 0, GRH: "1", BUE: "0", OCP: "0", ICP: "1", IBP: "1", PEN: "0" },
      ],
      Sum: 7, Diff: -2,
    },
  ],
};

const r3 = stats.computeRoundStats(aceRound, "200");
assert("Ace counted", r3.counts.aces === 1, 1, r3.counts.aces);
assert("Birdie count excludes ace", r3.counts.birdies === 0, 0, r3.counts.birdies);
assert("Ace not in birdie putt opps", r3.birdiePutting.opps === 2, 2, r3.birdiePutting.opps);
// Both other holes: GRH=1, ICP=1, IBP=1 → birdie misses
assert("No birdies made", r3.birdiePutting.made === 0, 0, r3.birdiePutting.made);
assert("Ace doesn't add to C1 attempts", r3.c1.attempts === 2, 2, r3.c1.attempts);

// ============================================================
// Test 4: 3-putt põllul (par putt miss bogey)
// ============================================================

console.log("\n=== Test 4: 3-putt põllul ===");

const threePutt = {
  ID: 1001,
  Tracks: [{ Par: "4" }],
  Results: [
    {
      UserID: "300",
      PlayerResults: [
        { Result: "5", Diff: 1, GRH: "1", BUE: "0", OCP: "0", ICP: "3", IBP: "0", PEN: "0" },
      ],
      Sum: 5, Diff: 1,
    },
  ],
};

const r4 = stats.computeRoundStats(threePutt, "300");
assert("Birdie putt opp", r4.birdiePutting.opps === 1, 1, r4.birdiePutting.opps);
assert("Birdie putt made = 0", r4.birdiePutting.made === 0, 0, r4.birdiePutting.made);
assert("Par putt opp", r4.parPutting.opps === 1, 1, r4.parPutting.opps);
assert("Par putt made = 0", r4.parPutting.made === 0, 0, r4.parPutting.made);
assert("C1 attempts = 3", r4.c1.attempts === 3, 3, r4.c1.attempts);
assert("C1 made = 1 (last one in)", r4.c1.made === 1, 1, r4.c1.made);

// ============================================================
// Test 5: Tap-in birdie (parked tee shot)
// ============================================================

console.log("\n=== Test 5: Tap-in birdie ===");

const tapinBirdie = {
  ID: 1002,
  Tracks: [{ Par: "3" }],
  Results: [
    {
      UserID: "400",
      PlayerResults: [
        { Result: "2", Diff: -1, GRH: "1", BUE: "1", OCP: "0", ICP: "0", IBP: "1", PEN: "0" },
      ],
      Sum: 2, Diff: -1,
    },
  ],
};

const r5 = stats.computeRoundStats(tapinBirdie, "400");
assert("Birdie counted", r5.counts.birdies === 1, 1, r5.counts.birdies);
assert("BUE counted", r5.bue.hits === 1, 1, r5.bue.hits);
assert("Not a birdie putt opp (no C1 putt)", r5.birdiePutting.opps === 0, 0, r5.birdiePutting.opps);
assert("C1 attempts = 0", r5.c1.attempts === 0, 0, r5.c1.attempts);

// ============================================================
// Test 6: C2 birdie
// ============================================================

console.log("\n=== Test 6: C2 birdie ===");

const c2Birdie = {
  ID: 1003,
  Tracks: [{ Par: "4" }],
  Results: [
    {
      UserID: "500",
      PlayerResults: [
        { Result: "3", Diff: -1, GRH: "0", BUE: "0", OCP: "1", ICP: "0", IBP: "0", PEN: "0" },
      ],
      Sum: 3, Diff: -1,
    },
  ],
};

const r6 = stats.computeRoundStats(c2Birdie, "500");
assert("Birdie counted", r6.counts.birdies === 1, 1, r6.counts.birdies);
assert("Not birdie putt opp (GRH=0)", r6.birdiePutting.opps === 0, 0, r6.birdiePutting.opps);
assert("OCP attempt", r6.c2.attempts === 1, 1, r6.c2.attempts);
assert("OCP made", r6.c2.made === 1, 1, r6.c2.made);
assert("Scramble opp", r6.scramble.opps === 1, 1, r6.scramble.opps);
assert("Scramble saved", r6.scramble.saved === 1, 1, r6.scramble.saved);

// ============================================================
// Test 7: Trahviga "birdie" mis pole birdie
// ============================================================

console.log("\n=== Test 7: Trahviga par ===");

const penaltyPar = {
  ID: 1004,
  Tracks: [{ Par: "4" }],
  Results: [
    {
      UserID: "600",
      PlayerResults: [
        { Result: "4", Diff: 0, GRH: "1", BUE: "0", OCP: "0", ICP: "1", IBP: "0", PEN: "1" },
      ],
      Sum: 4, Diff: 0,
    },
  ],
};

const r7 = stats.computeRoundStats(penaltyPar, "600");
assert("PEN excludes from birdie putt opp", r7.birdiePutting.opps === 0, 0, r7.birdiePutting.opps);
assert("PEN excludes from par putt opp", r7.parPutting.opps === 0, 0, r7.parPutting.opps);
assert("C1 still counted", r7.c1.attempts === 1, 1, r7.c1.attempts);
assert("Penalty total", r7.penalties.total === 1, 1, r7.penalties.total);

// ============================================================
// Test 8: Early DNF (only 3 holes played)
// ============================================================

console.log("\n=== Test 8: Early DNF ===");

const dnf = {
  ID: 1005,
  Tracks: Array.from({length: 18}, (_, i) => ({ Par: "3" })),
  Results: [
    {
      UserID: "700",
      PlayerResults: [
        { Result: "4", Diff: 1, GRH: "1", BUE: "0", OCP: "0", ICP: "0", IBP: "1", PEN: "0" },
        { Result: "3", Diff: 0, GRH: "1", BUE: "0", OCP: "0", ICP: "0", IBP: "1", PEN: "0" },
        { Result: "5", Diff: 2, GRH: "0", BUE: "0", OCP: "0", ICP: "1", IBP: "0", PEN: "0" },
        [], [], [], [], [], [], [], [], [], [], [], [], [], [], [],
      ],
      Sum: 12, Diff: 3,
    },
  ],
};

const r8 = stats.computeRoundStats(dnf, "700");
assert("Holes played = 3", r8.holesPlayed === 3, 3, r8.holesPlayed);
assertClose("GRH% = 66.67", 66.67, r8.grh.pct);

// ============================================================
// Test 9: Mixed-format augud (johan Laidoner from Palivere)
// ============================================================

console.log("\n=== Test 9: Mixed-format augud ===");

const mixed = {
  ID: 1006,
  Tracks: palivere.Tracks,
  Results: [
    {
      UserID: "38501",
      Name: "johan Laidoner",
      PlayerResults: [
        [], [],
        { Result: "6", Diff: 2, BUE: "0", GRH: "0", OCP: "0", ICP: "2", IBP: "0", PEN: "0" },
        { Result: "3", Diff: 0, BUE: "0", GRH: "1", OCP: "0", ICP: "1", IBP: "1", PEN: "0" },
        { Result: "3", Diff: 0, BUE: "0", GRH: "0", OCP: "0", ICP: "0", IBP: "1", PEN: "0" },
        { Result: "3", Diff: 0, BUE: "0", GRH: "0", OCP: "0", ICP: "0", IBP: "1", PEN: "0" },
        { Result: "3", Diff: 0, BUE: "0", GRH: "0", OCP: "0", ICP: "1", IBP: "0", PEN: "0" },
        { Result: "4", Diff: 1, BUE: "0", GRH: "0", OCP: "0", ICP: "0", IBP: "1", PEN: "0" },
        { Result: "3", Diff: 0, BUE: "0", GRH: "1", OCP: "0", ICP: "1", IBP: "1", PEN: "0" },
        { Result: "5", Diff: 1, BUE: "0", GRH: "0", OCP: "0", ICP: "0", IBP: "1", PEN: "0" },
        { Result: "5", Diff: 1, BUE: "0", GRH: "1", OCP: "0", ICP: "2", IBP: "1", PEN: "0" },
        [], [], [], [], [], [], [],
      ],
      Sum: 35,
      Diff: 5,
      BUETotal: "22%",
      GRHTotal: "89%", // wait, this seems off — let me check
      OCPTotal: "1",
      ICPTotal: "43%",
      IBPTotal: "20",
      PenaltiesTotal: "0",
    },
  ],
};

const r9 = stats.computeRoundStats(mixed, "38501");
assert("9 holes played", r9.holesPlayed === 9, 9, r9.holesPlayed);
assert("Sum = 35", r9.sum === 35, 35, r9.sum);
// GRH=1 holes: H4, H9, H11 = 3 of 9 = 33.3% (API says 89% which is wrong/different metric)
assert("GRH hits = 3", r9.grh.hits === 3, 3, r9.grh.hits);

// ============================================================
// Test 10: Scramble with C2 + C1 miss
// ============================================================

console.log("\n=== Test 10: Scramble with C2+C1 miss ===");

const scrambleBogey = {
  ID: 1007,
  Tracks: [{ Par: "4" }],
  Results: [
    {
      UserID: "800",
      PlayerResults: [
        { Result: "5", Diff: 1, GRH: "0", BUE: "0", OCP: "1", ICP: "1", IBP: "1", PEN: "0" },
      ],
      Sum: 5, Diff: 1,
    },
  ],
};

const r10 = stats.computeRoundStats(scrambleBogey, "800");
assert("Par putt opp (Diff=+1, ICP>=1, GRH=0)", r10.parPutting.opps === 1, 1, r10.parPutting.opps);
assert("Par putt not made", r10.parPutting.made === 0, 0, r10.parPutting.made);
assert("C1 attempt", r10.c1.attempts === 1, 1, r10.c1.attempts);
assert("C1 made = 0 (IBP=1)", r10.c1.made === 0, 0, r10.c1.made);
assert("OCP attempt", r10.c2.attempts === 1, 1, r10.c2.attempts);
assert("OCP made = 0 (had ICP after)", r10.c2.made === 0, 0, r10.c2.made);
assert("Scramble opp", r10.scramble.opps === 1, 1, r10.scramble.opps);
assert("Scramble not saved", r10.scramble.saved === 0, 0, r10.scramble.saved);

// ============================================================
// Test 12: GRH=0, ICP=1, IBP=0, Diff=+1 — EI OLE par putt opp
// Mängija jõudis C1-sse liiga hilja, tegi ühe putti mis läks sisse,
// aga tulemus on bogey (approach play määras). Ei loeta par putt miss'iks.
// ============================================================

console.log("\n=== Test 12: GRH=0,ICP=1,IBP=0,Diff=+1 ei ole par putt opp ===");

const lateC1Bogey = {
  ID: 1009,
  Tracks: [{ Par: "4" }],
  Results: [
    {
      UserID: "900",
      PlayerResults: [
        { Result: "5", Diff: 1, GRH: "0", BUE: "0", OCP: "0", ICP: "1", IBP: "0", PEN: "0" },
      ],
      Sum: 5, Diff: 1,
      GRHTotal: "0%", BUETotal: "0%", ICPTotal: "100%", IBPTotal: "0", OCPTotal: "0", PenaltiesTotal: "0",
    },
  ],
};

const r12 = stats.computeRoundStats(lateC1Bogey, "900");
assert("GRH=0,ICP=1,IBP=0,Diff=+1: opps=0", r12.parPutting.opps === 0, 0, r12.parPutting.opps);
assert("GRH=0,ICP=1,IBP=0,Diff=+1: made=0", r12.parPutting.made === 0, 0, r12.parPutting.made);
assert("C1 attempt still counted", r12.c1.attempts === 1, 1, r12.c1.attempts);
assert("C1 made=1 (IBP=0)", r12.c1.made === 1, 1, r12.c1.made);

// ============================================================
// Test 11: Aggregation across rounds
// ============================================================

console.log("\n=== Test 11: Agregeerimine ===");

const agg = stats.aggregateRounds([r1, r2, r3, r4, r5]);
assert("Total rounds", agg.rounds === 5, 5, agg.rounds);
assert("Rounds with stats", agg.roundsWithStats === 4, 4, agg.roundsWithStats);
// Aces: r3 has 1
assert("Aces total", agg.aces === 1, 1, agg.aces);

// ============================================================
// Result
// ============================================================

console.log(`\n=== Tulemus ===`);
console.log(`PASS: ${passed}`);
console.log(`FAIL: ${failed}`);
if (failed > 0) {
  console.log("\nVead:");
  failures.forEach((f) => console.log(f));
  process.exit(1);
}
console.log("\nKõik testid läksid läbi.");
