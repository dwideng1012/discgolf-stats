/**
 * Discgolf Metrix statistika moodul.
 *
 * Sisaldab kõiki statistika valemeid + ristkontrolli funktsioone.
 * Kõik valemid on dokumenteeritud references/algorithms.md ja
 * testitud test cases'idega references/test-cases.md.
 *
 * Kasutamine:
 *   const stats = computeRoundStats(competition, userId);
 *   const issues = validateRound(player, validHoles);
 *
 * Sõltumata - sobib nii Node.js, Deno kui browser keskkonnaga.
 */

// ---------- Helperid ----------

const num = (v) => Number(v || 0);
const isAce = (h) => h.Result === "1";
const hasPenalty = (h) => num(h.PEN) > 0;

function isValidHole(h) {
  return h !== null && !Array.isArray(h) && typeof h === "object";
}

function pctToNumber(s) {
  if (s === null || s === undefined) return null;
  const n = parseFloat(String(s).replace("%", ""));
  return Number.isFinite(n) ? n : null;
}

function attachPar(playerResults, tracks) {
  return playerResults.map((h, i) => {
    if (!isValidHole(h)) return h;
    return { ...h, _par: parseInt(tracks[i]?.Par || "0", 10) || null };
  });
}

function getValidHoles(playerResults, tracks = []) {
  const withPar = attachPar(playerResults, tracks);
  return withPar.filter(isValidHole);
}

// ---------- Põhilised statistikud ----------

function grhStats(validHoles) {
  if (validHoles.length === 0) return null;
  const hits = validHoles.filter((h) => num(h.GRH) === 1).length;
  return {
    hits,
    total: validHoles.length,
    pct: (hits / validHoles.length) * 100,
  };
}

function bueStats(validHoles) {
  if (validHoles.length === 0) return null;
  const hits = validHoles.filter((h) => num(h.BUE) === 1).length;
  return {
    hits,
    total: validHoles.length,
    pct: (hits / validHoles.length) * 100,
  };
}

function c1PuttingStats(validHoles) {
  let attempts = 0;
  let made = 0;
  for (const h of validHoles) {
    const icp = num(h.ICP);
    if (icp === 0) continue;
    attempts += icp;
    if (num(h.IBP) === 0) made += 1;
  }
  return {
    attempts,
    made,
    pct: attempts > 0 ? (made / attempts) * 100 : null,
  };
}

function birdiePuttingStats(validHoles) {
  const opps = validHoles.filter(
    (h) =>
      !isAce(h) &&
      !hasPenalty(h) &&
      num(h.GRH) === 1 &&
      num(h.ICP) >= 1
  );
  const made = opps.filter((h) => num(h.ICP) === 1 && num(h.IBP) === 0);
  // Sanity check: each "made" should have Diff = -1
  const sanityWarnings = made
    .filter((h) => num(h.Diff) !== -1)
    .map((h) => ({ hole: h, msg: "birdie 'made' but Diff !== -1" }));
  return {
    opps: opps.length,
    made: made.length,
    pct: opps.length > 0 ? (made.length / opps.length) * 100 : null,
    warnings: sanityWarnings,
  };
}

function isParPuttOpp(h) {
  if (isAce(h)) return false;
  if (hasPenalty(h)) return false;
  const grh = num(h.GRH);
  const icp = num(h.ICP);
  const diff = num(h.Diff);
  if (icp < 1) return false;
  if (grh === 1) {
    return icp >= 2;
  } else {
    if (diff === 0) return true;
    if (diff === 1) return true;
    return false;
  }
}

function isParPuttMade(h) {
  return num(h.Diff) === 0;
}

function parPuttingStats(validHoles) {
  const opps = validHoles.filter(isParPuttOpp);
  const made = opps.filter(isParPuttMade);
  return {
    opps: opps.length,
    made: made.length,
    pct: opps.length > 0 ? (made.length / opps.length) * 100 : null,
  };
}

function scrambleStats(validHoles) {
  const opps = validHoles.filter((h) => !isAce(h) && num(h.GRH) === 0);
  const saved = opps.filter((h) => num(h.Diff) <= 0);
  return {
    opps: opps.length,
    saved: saved.length,
    pct: opps.length > 0 ? (saved.length / opps.length) * 100 : null,
  };
}

function generalPuttStats(validHoles) {
  const puttHoles = validHoles.filter(
    (h) => num(h.ICP) + num(h.IBP) + num(h.OCP) > 0
  );
  const totalPutts = puttHoles.reduce(
    (s, h) => s + num(h.ICP) + num(h.IBP) + num(h.OCP),
    0
  );
  return {
    puttHoles: puttHoles.length,
    totalPutts,
    avgPerHole:
      puttHoles.length > 0 ? totalPutts / puttHoles.length : null,
    inversePct:
      totalPutts > 0 ? (puttHoles.length / totalPutts) * 100 : null,
  };
}

function penaltyStats(validHoles) {
  const total = validHoles.reduce((s, h) => s + num(h.PEN), 0);
  const holesWithPen = validHoles.filter((h) => num(h.PEN) > 0).length;
  return {
    total,
    holesWithPen,
    avgPerHole: validHoles.length > 0 ? total / validHoles.length : 0,
  };
}

function c2Stats(validHoles) {
  const attempts = validHoles.reduce((s, h) => s + num(h.OCP), 0);
  const made = validHoles.filter(
    (h) =>
      num(h.OCP) >= 1 &&
      num(h.ICP) === 0 &&
      num(h.IBP) === 0 &&
      !isAce(h)
  ).length;
  return {
    attempts,
    made,
    pct: attempts > 0 ? (made / attempts) * 100 : null,
  };
}

function birdieCounts(validHoles) {
  const aces = validHoles.filter(isAce).length;
  const eagles = validHoles.filter(
    (h) => num(h.Diff) <= -2 && !isAce(h)
  ).length;
  const birdies = validHoles.filter(
    (h) => num(h.Diff) === -1 && !isAce(h)
  ).length;
  const pars = validHoles.filter((h) => num(h.Diff) === 0).length;
  const bogeys = validHoles.filter((h) => num(h.Diff) === 1).length;
  const doubles = validHoles.filter((h) => num(h.Diff) >= 2).length;
  return { aces, eagles, birdies, pars, bogeys, doubles };
}

function detectHasStats(validHoles) {
  return validHoles.some(
    (h) =>
      num(h.GRH) > 0 ||
      num(h.BUE) > 0 ||
      num(h.ICP) > 0 ||
      num(h.IBP) > 0 ||
      num(h.OCP) > 0
  );
}

// ---------- Põhifunktsioon: arvuta üks ring ----------

function computeRoundStats(competition, userId = null) {
  const tracks = competition.Tracks || [];
  const results = competition.Results || [];

  let player;
  if (userId) {
    player = results.find((r) => String(r.UserID) === String(userId));
  } else {
    player = results[0];
  }
  if (!player) return null;

  const validHoles = getValidHoles(player.PlayerResults || [], tracks);
  if (validHoles.length === 0) return null;

  const hasStats = detectHasStats(validHoles);

  const base = {
    competitionId: competition.ID,
    name: competition.Name || "",
    date: competition.Date || "",
    course: competition.CourseName || "",
    courseId: competition.CourseID || null,
    metrixMode: competition.MetrixMode || null,
    userId: player.UserID,
    playerName: player.Name || "",
    place: player.Place ?? null,
    sum: Number(player.Sum),
    diff: Number(player.Diff),
    holesPlayed: validHoles.length,
    hasStats,
    counts: birdieCounts(validHoles),
  };

  if (!hasStats) {
    return {
      ...base,
      grh: null,
      bue: null,
      c1: null,
      birdiePutting: null,
      parPutting: null,
      scramble: null,
      putting: null,
      penalties: penaltyStats(validHoles),
      c2: null,
    };
  }

  return {
    ...base,
    grh: grhStats(validHoles),
    bue: bueStats(validHoles),
    c1: c1PuttingStats(validHoles),
    birdiePutting: birdiePuttingStats(validHoles),
    parPutting: parPuttingStats(validHoles),
    scramble: scrambleStats(validHoles),
    putting: generalPuttStats(validHoles),
    penalties: penaltyStats(validHoles),
    c2: c2Stats(validHoles),
  };
}

// ---------- Validatsioon: ristkontroll API kogusummade vastu ----------

function validateRound(competition, userId = null, tolerance = 1) {
  const tracks = competition.Tracks || [];
  const results = competition.Results || [];
  const player = userId
    ? results.find((r) => String(r.UserID) === String(userId))
    : results[0];
  if (!player) return ["Player not found"];

  const validHoles = getValidHoles(player.PlayerResults || [], tracks);
  if (validHoles.length === 0) return ["No valid holes"];

  const issues = [];

  // Sum
  const sumCalc = validHoles.reduce(
    (s, h) => s + parseInt(h.Result, 10),
    0
  );
  if (sumCalc !== Number(player.Sum)) {
    issues.push(
      `Sum: arvutatud ${sumCalc}, API ${player.Sum}`
    );
  }

  // GRH
  const grh = grhStats(validHoles);
  const grhApi = pctToNumber(player.GRHTotal);
  if (grh && grhApi !== null && Math.abs(grh.pct - grhApi) > tolerance) {
    issues.push(
      `GRH%: arvutatud ${grh.pct.toFixed(2)}%, API ${grhApi}%`
    );
  }

  // BUE
  const bue = bueStats(validHoles);
  const bueApi = pctToNumber(player.BUETotal);
  if (bue && bueApi !== null && Math.abs(bue.pct - bueApi) > tolerance) {
    issues.push(
      `BUE%: arvutatud ${bue.pct.toFixed(2)}%, API ${bueApi}%`
    );
  }

  // C1
  const c1 = c1PuttingStats(validHoles);
  const c1Api = pctToNumber(player.ICPTotal);
  if (c1 && c1.pct !== null && c1Api !== null && Math.abs(c1.pct - c1Api) > tolerance) {
    issues.push(
      `C1%: arvutatud ${c1.pct.toFixed(2)}%, API ${c1Api}%`
    );
  }

  // IBP count
  const ibpCalc = validHoles.filter((h) => num(h.IBP) === 1).length;
  const ibpApi = parseInt(player.IBPTotal || "0", 10);
  if (Number.isFinite(ibpApi) && ibpCalc !== ibpApi) {
    issues.push(
      `IBP count: arvutatud ${ibpCalc}, API ${ibpApi}`
    );
  }

  // OCP count
  const ocpCalc = validHoles.reduce((s, h) => s + num(h.OCP), 0);
  const ocpApi = parseInt(player.OCPTotal || "0", 10);
  if (Number.isFinite(ocpApi) && ocpCalc !== ocpApi) {
    issues.push(
      `OCP count: arvutatud ${ocpCalc}, API ${ocpApi}`
    );
  }

  // Penalty count
  const penCalc = validHoles.reduce((s, h) => s + num(h.PEN), 0);
  const penApi = parseInt(player.PenaltiesTotal || "0", 10);
  if (Number.isFinite(penApi) && penCalc !== penApi) {
    issues.push(
      `Penalty count: arvutatud ${penCalc}, API ${penApi}`
    );
  }

  return issues;
}

// ---------- Agregeerimine üle ringide ----------

function aggregateRounds(roundStats) {
  const valid = roundStats.filter((r) => r != null);
  const withStats = valid.filter((r) => r.hasStats);

  const sumField = (arr, path) =>
    arr.reduce((s, r) => {
      const v = path.split(".").reduce((o, k) => (o ? o[k] : null), r);
      return s + (v || 0);
    }, 0);

  return {
    rounds: valid.length,
    roundsWithStats: withStats.length,

    bestDiff: valid.length ? Math.min(...valid.map((r) => r.diff)) : null,
    worstDiff: valid.length ? Math.max(...valid.map((r) => r.diff)) : null,
    avgDiff: valid.length
      ? valid.reduce((s, r) => s + r.diff, 0) / valid.length
      : null,

    aces: sumField(valid, "counts.aces"),
    eagles: sumField(valid, "counts.eagles"),
    birdies: sumField(valid, "counts.birdies"),

    grh: withStats.length
      ? {
          hits: sumField(withStats, "grh.hits"),
          total: sumField(withStats, "grh.total"),
          pct:
            sumField(withStats, "grh.total") > 0
              ? (sumField(withStats, "grh.hits") /
                  sumField(withStats, "grh.total")) *
                100
              : null,
        }
      : null,

    c1: withStats.length
      ? {
          made: sumField(withStats, "c1.made"),
          attempts: sumField(withStats, "c1.attempts"),
          pct:
            sumField(withStats, "c1.attempts") > 0
              ? (sumField(withStats, "c1.made") /
                  sumField(withStats, "c1.attempts")) *
                100
              : null,
        }
      : null,

    birdiePutting: withStats.length
      ? {
          made: sumField(withStats, "birdiePutting.made"),
          opps: sumField(withStats, "birdiePutting.opps"),
          pct:
            sumField(withStats, "birdiePutting.opps") > 0
              ? (sumField(withStats, "birdiePutting.made") /
                  sumField(withStats, "birdiePutting.opps")) *
                100
              : null,
        }
      : null,

    parPutting: withStats.length
      ? {
          made: sumField(withStats, "parPutting.made"),
          opps: sumField(withStats, "parPutting.opps"),
          pct:
            sumField(withStats, "parPutting.opps") > 0
              ? (sumField(withStats, "parPutting.made") /
                  sumField(withStats, "parPutting.opps")) *
                100
              : null,
        }
      : null,

    scramble: withStats.length
      ? {
          saved: sumField(withStats, "scramble.saved"),
          opps: sumField(withStats, "scramble.opps"),
          pct:
            sumField(withStats, "scramble.opps") > 0
              ? (sumField(withStats, "scramble.saved") /
                  sumField(withStats, "scramble.opps")) *
                100
              : null,
        }
      : null,
  };
}

// ---------- Eksport (Node + browser) ----------

const api = {
  // Helpers
  num,
  isAce,
  hasPenalty,
  isValidHole,
  pctToNumber,
  attachPar,
  getValidHoles,
  detectHasStats,
  // Stats
  grhStats,
  bueStats,
  c1PuttingStats,
  birdiePuttingStats,
  parPuttingStats,
  isParPuttOpp,
  isParPuttMade,
  scrambleStats,
  generalPuttStats,
  penaltyStats,
  c2Stats,
  birdieCounts,
  // Composite
  computeRoundStats,
  validateRound,
  aggregateRounds,
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = api;
}
if (typeof window !== "undefined") {
  window.MetrixStats = api;
}
