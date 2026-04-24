# Algoritmide täpne dokumentatsioon

Iga statistiku jaoks: definitsioon, valem, edge case'id, ristkontroll.

## Põhitüübid

```js
type Hole = {
  Result: string;     // "1" - "20+", lõppskoor sisaldab trahve
  Diff: number;       // Result - par
  GRH: string;        // "0" / "1"
  BUE: string;        // "0" / "1"
  OCP: string;        // "0", "1", "2", ...
  ICP: string;        // "0", "1", "2", ...
  IBP: string;        // "0" / "1"
  PEN: string;        // "0", "1", "2", ...
  _par?: number;      // Kohalik laiendus, võetud Tracks[i].Par
};
```

## Helper funktsioonid (kasuta neid alati)

```js
const num = (v) => Number(v || 0);
const isAce = (h) => h.Result === "1";
const hasPenalty = (h) => num(h.PEN) > 0;
const isValidHole = (h) =>
  h !== null && !Array.isArray(h) && typeof h === "object";

function attachPar(playerResults, tracks) {
  return playerResults.map((h, i) => {
    if (!isValidHole(h)) return h;
    return { ...h, _par: parseInt(tracks[i]?.Par || "0", 10) || null };
  });
}
```

---

## 1. GRH% — Green in Regulation Hit

**Definitsioon**: Aukude osakaal, kus mängija jõudis rohelisele (C1) `par - 2` löögiga.

**Valem**:
```js
function grhPct(validHoles) {
  if (validHoles.length === 0) return null;
  const hits = validHoles.filter(h => num(h.GRH) === 1).length;
  return hits / validHoles.length * 100;
}
```

**Ristkontroll**: peab võrduma `pctToNumber(player.GRHTotal)`.

**Edge case'id**:
- Ace = `Result=1` peaks loogiliselt olema GRH=1 (jõudis rohelisele tee shot'iga)
- Kui mängija mängis ainult osa auke (early DNF): kasuta `validHoles.length`, mitte 18
- `MetrixMode = "0"` korral on GRH=0 kogu aja → ära kuva, määra null

---

## 2. BUE% — Parked %

**Definitsioon**: Aukude osakaal, kus mingi löök pargis (jättis ketta korvi otsa alla).

**Valem**: identne GRH%-iga, ainult välja nimi erineb.
```js
function buePct(validHoles) {
  if (validHoles.length === 0) return null;
  const hits = validHoles.filter(h => num(h.BUE) === 1).length;
  return hits / validHoles.length * 100;
}
```

**Ristkontroll**: `pctToNumber(player.BUETotal)`.

---

## 3. C1 putiprotsent (ICPTotal järgi)

**Definitsioon**: Tehtud C1 putid / kõik C1 katsed * 100.

**Loogika augukaupa**:
- Kui auk lõpeb tap-iniga (`IBP=1`), siis viimane päris-putt oli miss → kõik ICP katsed on missid
- Kui auk lõpeb C1 putiga (`IBP=0` AND `ICP≥1`), siis viimane ICP läks sisse → 1 made, ülejäänud (ICP-1) missed

**Valem**:
```js
function c1PuttingPct(validHoles) {
  let attempts = 0, made = 0;
  for (const h of validHoles) {
    const icp = num(h.ICP);
    if (icp === 0) continue;
    attempts += icp;
    if (num(h.IBP) === 0) made += 1; // viimane C1 läks sisse
  }
  return attempts > 0 ? { pct: made / attempts * 100, made, attempts } : null;
}
```

**Ristkontroll**: `pctToNumber(player.ICPTotal)`.

**Edge case'id**:
- Ace `Result=1`: `ICP=0`, `IBP=0` — ei mõjuta arvutust (ei lähe sisse, sest `icp === 0`)
- Parked + tap-in (`ICP=0, IBP=1`): ei loendata (tap-in pole "putt" selle statistiku mõttes)
- 3-putt põllul (`ICP=3, IBP=0`): attempts += 3, made += 1 → 33.3% selle augu kohta

---

## 4. Birdie putting %

**Definitsioon**: Aukudest, kus mängija oli C1-s **birdie potentsiaaliga** (st rohelisele regulatsiooniga jõudnud), mitu protsenti läks esimese C1 putiga sisse.

### Strict definition (eelistatud)

**Opportunity**:
- `GRH = 1` (jõudis rohelisele regulatsioonis)
- `ICP >= 1` (üritas vähemalt ühte C1 putti)
- `Result !== "1"` (mitte ace)
- `PEN === "0"` (trahv rikub vaate)

**Made**:
- `ICP = 1` AND `IBP = 0` (üks C1 katse, mis läks sisse)
- *Sanity check*: `Diff = -1` peab olema

```js
function birdiePuttingStats(validHoles) {
  const opps = validHoles.filter(h =>
    !isAce(h) &&
    !hasPenalty(h) &&
    num(h.GRH) === 1 &&
    num(h.ICP) >= 1
  );
  const made = opps.filter(h =>
    num(h.ICP) === 1 && num(h.IBP) === 0
  );
  // Sanity
  for (const h of made) {
    if (num(h.Diff) !== -1) {
      console.warn("birdie 'made' aga Diff !== -1:", h);
    }
  }
  return {
    opps: opps.length,
    made: made.length,
    pct: opps.length > 0 ? made.length / opps.length * 100 : null,
  };
}
```

### Mida statistik **ei** sisalda (ja miks)

| Olukord | Miks ei loe |
|---------|-------------|
| Ace | Putti polnud |
| Parked birdie (`GRH=1, ICP=0, IBP=1, Diff=-1`) | Reaalset C1 putti polnud, oli tap-in |
| C2 birdie (`GRH=0, OCP≥1`, made) | C2 putt, mitte C1 |
| Throw-in eagle/birdie (`Result=2 par 4-l, GRH=0, OCP=0, ICP=0`) | Mitte putt |
| Birdie trahviga (`PEN>0`) | Hägune juhtum |

Need on omaette **birdie kogusummad**, aga eraldi statistika.

### Üldine birdie loend (bonus statistika)

```js
function totalBirdies(validHoles) {
  return validHoles.filter(h => num(h.Diff) === -1 && !isAce(h)).length;
}
function totalEagles(validHoles) {
  return validHoles.filter(h => num(h.Diff) <= -2 && !isAce(h)).length;
}
function totalAces(validHoles) {
  return validHoles.filter(h => isAce(h)).length;
}
```

---

## 5. Par putting % (C1 par save %)

**Definitsioon**: Mängijal oli C1-s par putt opportunity (kas birdie miss'i järel või scramble par save'iga). Mitu protsenti neist läks sisse?

### Kaks juhtu

**Juht A: Birdie miss → par putt** (GRH=1)
- Mängija jõudis rohelisele, missis birdie putti, putib pari eest
- Tingimus: `GRH=1 AND ICP >= 2 AND PEN=0 AND mitte ace`
- Made: `ICP=2 AND IBP=0 AND Diff=0`
- Miss kahel viisil:
  - `ICP=2 AND IBP=1 AND Diff=+1` — kaks katset, lõpetas tap-iniga = 3 putti = bogey
  - `ICP>=3` — kolm või enam C1 katset = juba mitu missi

**Juht B: Scramble par save** (GRH=0)
- Mängija jõudis C1-sse hiljem (3+ löögiga par 4-l vms) ja putib pari
- Tingimus: `GRH=0 AND ICP >= 1 AND PEN=0 AND mitte ace`
- Lisaks peab augu lõppskoor olema *par või bogey*: `Diff=0` (made) või `Diff=+1` (miss)
- Diff <= -1 GRH=0 puhul = C1 birdie kuidagi tehtud (harv, scramble birdie); Diff >= +2 = topelt-bogey, ei ole "par putt"
- Eristamine made/miss:
  - **Made**: `Diff=0 AND IBP=0` (tap-in ei ole "par save C1-st", aga see on tegelikult parem — tap-in järelkäsitletakse eraldi)
  - **Miss**: `Diff=+1` AND (auk lõppes mingi C1 missi tõttu)

**Tähtis nüanss**: **tap-in par** ehk `GRH=0, ICP=0, IBP=1, Diff=0` (parked tee shot par 3-l) — see on tegelikult parked par, mitte putt. Kuna `ICP=0`, see filtreeritakse niikuinii välja meie definitsioonist. Hea.

```js
function isParPuttOpp(h) {
  if (isAce(h)) return false;
  if (hasPenalty(h)) return false;
  const grh = num(h.GRH);
  const icp = num(h.ICP);
  const diff = num(h.Diff);
  if (icp < 1) return false;

  if (grh === 1) {
    // Juht A
    return icp >= 2;
  } else {
    // Juht B
    if (diff === 0) return true;  // tehtud par C1-st
    if (diff === 1) return true;  // bogey, viimane löök oli C1 katse mis missis
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
    pct: opps.length > 0 ? made.length / opps.length * 100 : null,
  };
}
```

### Diskussioon: praeguse koodi viga

Praeguses koodis (HTML jpg-st) on:
```js
const parHoles = validHoles.filter(h => {
  if (h.Result === "1") return false;
  if (h.ICP === "") return false;
  const grh = Number(h.GRH), icp = Number(h.ICP), ibp = Number(h.IBP), ocp = Number(h.OCP);
  if (grh === 1) return icp >= 2;
  if (h._par === null) return false;
  return parseInt(h.Result, 10) === h._par && ibp === 0 && ocp === 0 && icp >= 1;
});
```

**Vead**:
1. Nõuab `Result === Par` (st `Diff = 0`) — see välistab miss'i juhtumi täiesti, st arvestatakse ainult tehtud put'e ja seetõttu protsent on alati 100% kui keegi proovis
2. Nõuab `OCP === 0` GRH=0 puhul — välistab legitiimsed scramble pari, kus mängija proovis enne C2 putti (täiesti normaalne)
3. Made/miss'i eristamine: `parSaved = parHoles.filter(grh === 1 ? (icp === 2 && ibp === 0) : icp === 1)` — siin GRH=0 made = `icp===1` (mis on enamasti tõsi, sest filter juba nõuab `Result === Par`). Aga kuna OPP arvestus on vale, nimetaja on vale.
4. PEN-i ei kontrolli — birdie putt trahviga arvestatakse

---

## 6. Scramble %

**Definitsioon**: Aukudest, kus mängija EI jõudnud rohelisele regulatsioonis (GRH=0), mitu protsenti lõpetas par'iga või paremaga.

```js
function scrambleStats(validHoles) {
  const opps = validHoles.filter(h => !isAce(h) && num(h.GRH) === 0);
  const saved = opps.filter(h => num(h.Diff) <= 0);
  return {
    opps: opps.length,
    saved: saved.length,
    pct: opps.length > 0 ? saved.length / opps.length * 100 : null,
  };
}
```

---

## 7. Putiprotsent (üldine)

**Definitsioon (kõige tavalisem)**: Aukudest, kus oli vähemalt üks putistroke (ICP+IBP+OCP > 0), mitu putistroke'i augu kohta keskmiselt — kuvatakse pööratuna `holes/strokes * 100`.

```js
function puttPct(validHoles) {
  const puttHoles = validHoles.filter(h =>
    num(h.ICP) + num(h.IBP) + num(h.OCP) > 0
  );
  const totalPutts = puttHoles.reduce((s, h) =>
    s + num(h.ICP) + num(h.IBP) + num(h.OCP), 0
  );
  return totalPutts > 0
    ? puttHoles.length / totalPutts * 100
    : null;
}
```

**Alternatiivne sõnastus**: keskmine putte augu kohta:
```js
const avgPuttsPerHole = totalPutts / puttHoles.length;
```

Vali üks ja dokumenteeri.

---

## 8. Trahvid (PEN)

```js
function penaltyStats(validHoles) {
  const total = validHoles.reduce((s, h) => s + num(h.PEN), 0);
  const holesWithPen = validHoles.filter(h => num(h.PEN) > 0).length;
  return {
    total,
    holesWithPen,
    avgPerRound: total,        // see on ringi sees, agregaadis jagad ringide arvuga
    avgPerHole: total / validHoles.length,
  };
}
```

**Ristkontroll**: `parseInt(player.PenaltiesTotal)`.

---

## 9. C2 putid (OCP)

```js
function c2Stats(validHoles) {
  const totalAttempts = validHoles.reduce((s, h) => s + num(h.OCP), 0);
  // C2 made: peavad olema augud, kus OCP≥1 ja viimane löök oli see C2 putt
  // Made = OCP >= 1 AND ICP === 0 AND IBP === 0 AND mitte ace
  // Miss made + tap-in: OCP >= 1 AND IBP === 1 AND ICP === 0
  // (Edasi C1: OCP missis, sai C1 katse, mis võis minna)
  const made = validHoles.filter(h =>
    num(h.OCP) >= 1 && num(h.ICP) === 0 && num(h.IBP) === 0 && !isAce(h)
  ).length;
  return {
    attempts: totalAttempts,
    made,
    pct: totalAttempts > 0 ? made / totalAttempts * 100 : null,
  };
}
```

**Ristkontroll**: API `OCPTotal` on **arv**, mitte protsent — peab võrduma `totalAttempts`.

---

## 10. Hole-in-one (HIO/Ace)

```js
function hioCount(validHoles) {
  return validHoles.filter(h => isAce(h)).length;
}
```

---

## Agregeerimine üle ringide

Kui sul on mitu ringi:

**Mikro-keskmine** (eelistatud kõige jaoks): summeeri made ja attempts üle kõikide ringide, siis arvuta protsent.
```js
const totalMade = rounds.reduce((s, r) => s + r.birdieMade, 0);
const totalOpps = rounds.reduce((s, r) => s + r.birdieOpps, 0);
const overallPct = totalMade / totalOpps * 100;
```

**Makro-keskmine** (vahel kasulik trendide jaoks): arvuta iga ringi protsent eraldi, võta keskmine.
```js
const ringWisePcts = rounds.map(r => r.birdiePct).filter(x => x !== null);
const avg = ringWisePcts.reduce((s, x) => s + x, 0) / ringWisePcts.length;
```

Mikro-keskmine on robustsem (väikesed sample'id ei hüppa). Makro-keskmist kasuta kui tahad "tüüpilise ringi" tunnetust.

**Ainult `hasStats=true` ringid**: kõikide puti statistikute jaoks jäta välja ringid, kus ei ole detailstatistikat. Lisa ka kuva "X / Y ringist" et kasutaja näeks katvust.

---

## Validatsioon: ristkontroll-helper

```js
function validateRound(player, validHoles) {
  const issues = [];

  // GRH
  const grhCalc = validHoles.filter(h => num(h.GRH) === 1).length / validHoles.length * 100;
  const grhApi = pctToNumber(player.GRHTotal);
  if (grhApi !== null && Math.abs(grhCalc - grhApi) > 1) {
    issues.push(`GRH erinevus: arvutatud ${grhCalc.toFixed(1)}%, API ${grhApi}%`);
  }

  // BUE
  const bueCalc = validHoles.filter(h => num(h.BUE) === 1).length / validHoles.length * 100;
  const bueApi = pctToNumber(player.BUETotal);
  if (bueApi !== null && Math.abs(bueCalc - bueApi) > 1) {
    issues.push(`BUE erinevus: ${bueCalc.toFixed(1)} vs ${bueApi}`);
  }

  // ICP
  const icpStats = c1PuttingPct(validHoles);
  const icpApi = pctToNumber(player.ICPTotal);
  if (icpStats && icpApi !== null && Math.abs(icpStats.pct - icpApi) > 1) {
    issues.push(`ICP erinevus: ${icpStats.pct.toFixed(1)} vs ${icpApi}`);
  }

  // IBP
  const ibpCalc = validHoles.filter(h => num(h.IBP) === 1).length;
  const ibpApi = parseInt(player.IBPTotal || "0", 10);
  if (ibpCalc !== ibpApi) {
    issues.push(`IBP count: arvutatud ${ibpCalc}, API ${ibpApi}`);
  }

  // OCP
  const ocpCalc = validHoles.reduce((s, h) => s + num(h.OCP), 0);
  const ocpApi = parseInt(player.OCPTotal || "0", 10);
  if (ocpCalc !== ocpApi) {
    issues.push(`OCP count: ${ocpCalc} vs ${ocpApi}`);
  }

  // Sum
  const sumCalc = validHoles.reduce((s, h) => s + parseInt(h.Result, 10), 0);
  if (sumCalc !== player.Sum) {
    issues.push(`Sum: arvutatud ${sumCalc}, API ${player.Sum}`);
  }

  return issues;
}
```

Kasuta seda iga uue ringi laadimisel arendamise ajal — kui issues array pole tühi, sul on kuskil viga.
