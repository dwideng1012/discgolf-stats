---
name: discgolf-metrix-stats
description: Arvuta korrektselt discgolfi statistikat Discgolf Metrix API andmetest (scorecard JSON). Kasuta alati, kui töötad Discgolf Metrix andmetega - eriti birdie putting %, par putting %, C1 putting %, GRH%, BUE%, putiprotsent, scramble - sest Metrix'i väljade tähendused (ICP, IBP, GRH, OCP, BUE, PEN) on ebaintuitiivsed ja vale interpretatsioon toob peaaegu alati vigu statistikavalemites. Kasuta seda skilli alati, kui kasutaja mainib discgolfi statistikat, puti protsente, Metrix'i API'd, skoorikaarte, birdie/par putte, või kui koodis on ICP/IBP/GRH/OCP/BUE välju - ka siis kui kasutaja ei küsi otseselt "paranda statistika".
---

# Discgolf Metrix statistika

Eesmärk: tagada, et discgolfi statistika (eriti *birdie putting %* ja *par putting %*) oleks alati matemaatiliselt korrektne ning kataks kõik discgolfis ette tulevad olukorrad.

## Miks see skill on olemas

Discgolf Metrix API tagastab augupõhiseid andmeid, mille väljad **pole intuitiivsed**:
- `IBP` **EI OLE** "inside birdie putts" — see on **tap-in indikaator** (0/1)
- `ICP` **EI OLE** "inside circle *putts made*" — see on **C1 puttide katsete arv**
- `BUE` **EI OLE** seotud bogey'iga — see on **parked** indikaator
- `GRH` tähendab **green reached in regulation** (löökidega `par - 2`), mitte "green hit"

Kui neid väljasid valesti tõlgendada, siis birdie/par putting % tuleb süstemaatiliselt vale. Enne mistahes statistikat lisamast või muutmast kontrolli tehtud arvutust **tegelike API kogusummade vastu** (`BUETotal`, `GRHTotal`, `ICPTotal`, `IBPTotal`) — need annavad ground truth'i. Kui arvutus ei ühti, loogika on vigane.

## Väljade definitsioon (kontrollitud)

Iga auk `PlayerResults` arrays:

| Väli | Tähendus | Väärtused |
|------|----------|-----------|
| `Result` | Lõppskoor augul (koos trahvidega) | string, nt `"4"` |
| `Diff` | Skoor vs par (Result - Par) | int |
| `GRH` | 1 = roheline saavutatud regulatsiooni löökidega (`par - 2`) | "0" / "1" |
| `BUE` | 1 = parked (kasutatakse ka "parked from tee" tähenduses) | "0" / "1" |
| `OCP` | C2 puttide (10–20m) katsete arv | "0", "1", "2", ... |
| `ICP` | C1 puttide (kuni 10m) **reaalsete** katsete arv (**ei sisalda tap-ine**) | "0", "1", "2", ... |
| `IBP` | 1 = auk lõpetati tap-iniga (väga lähedal korvile, pärast mõnda missi) | "0" / "1" |
| `PEN` | Trahvilöökide arv | "0", "1", "2", ... |

**Augu kokkuvõte `Results[].XXXTotal`**:
- `GRHTotal` = (GRH=1 aukude arv) / (mängitud auke) * 100, kuva: "28%"
- `BUETotal` = (BUE=1 aukude arv) / (mängitud auke) * 100, kuva: "11%"
- `ICPTotal` = (tehtud C1 putid) / (kõik C1 katsed) * 100 = `count(ICP≥1 AND IBP=0) / sum(ICP)` — kontrolli oma valemit selle vastu
- `IBPTotal` = tap-in'itega lõpetatud aukude arv (mitte protsent)
- `OCPTotal` = C2 puttide katsete arv

**Tühjad augud**: kui mängija augul ei mänginud (nt kohtunik, DNF vms), siis `PlayerResults[i]` on tühi array `[]`. Filtreeri välja:

```js
const validHoles = playerResults.filter(h =>
  h !== null && !Array.isArray(h) && typeof h === "object"
);
```

## Discgolfi domeeni loogika

### Stroke recipe (kuidas skoor tekib)

Iga löök on üks järgnevatest:
1. **Tee shot** — algulöök
2. **Fairway / approach** — löök keset rada, ei ole putt
3. **C2 putt** (OCP) — putistroke 10-20m kauguselt
4. **C1 putt** (ICP) — reaalne putt 0-10m kauguselt, aga **mitte tap-in**
5. **Tap-in** (IBP) — praktiliselt automaatne lühike putt pärast missi

**NB**: `BUE=1` (parked) tähendab, et mingi löök jõudis **korvi otsa alla** (praktiliselt 100% katsetest läheks sisse). Parked + tap-in on sama asi, aga parked võib tulla ka tee shot'ist: kui par 3 augul tee shot pargib, siis `GRH=1, ICP=0, IBP=1, BUE=1, Result=2, Diff=-1` (birdie).

### Põhivalem (ristkontroll)

Iga auk peab vastama:
```
Result = (reg_strokes) + putting_strokes + PEN
kus putting_strokes = ICP + IBP + OCP
ja reg_strokes = Par - 2, kui GRH=1 (mõnikord veidi teisiti scramble'i korral)
```

See ei ole alati täpne, aga annab sanity check'i.

### Ace (hole-in-one)

`Result = "1"` — jäta VÄLJA peaaegu kõigist puti statistikatest. Putte ei olnud. Aga loenda eraldi `hio` loendurisse.

## Põhilised algoritmid

**Sul on kaks võimalust iga statistiku jaoks**: "katsete põhine" (kui palju võimalusi oli) ja "tulemuse põhine" (mis juhtus). Kasuta Diff'i ja Result'i tulemuste tuvastamiseks (need sisaldavad juba trahvilööke ja on kõige robustsemad).

### GRH% (rohelisele regulatsioonis)

```js
const grhHits = validHoles.filter(h => Number(h.GRH) === 1).length;
const grhPct = grhHits / validHoles.length * 100;
```

**Ristkontroll**: võrdle `GRHTotal` väljaga. Peab ühtima.

### BUE% (parked %)

```js
const bueHits = validHoles.filter(h => Number(h.BUE) === 1).length;
const buePct = bueHits / validHoles.length * 100;
```

**Ristkontroll**: `BUETotal`.

### C1 putiprotsent (ICP putting %) — *tehtud C1 putid kõigist C1 katsetest*

See on kõige lihtsam puti statistik. **Definitsioon**: ICP katse loetakse "tehtuks" siis, kui sellele ei järgnenud tap-in ega teist ICP katset — st see oli **augu viimane puttilöök**.

**Kõige töökindlam valem:**
```js
// iga auk: kui oli ≥1 C1 katse ja IBP=0, siis VIIMANE C1 katse läks sisse
// = made = 1 tehtud C1 putt
// missed = ICP - 1 (ülejäänud ICP katsed)
let icpAttempts = 0, icpMade = 0;
for (const h of validHoles) {
  const icp = Number(h.ICP || 0);
  const ibp = Number(h.IBP || 0);
  if (icp === 0) continue;
  icpAttempts += icp;
  if (ibp === 0) icpMade += 1; // viimane C1 katse tehtud
  // kui ibp=1, siis viimane löök oli tap-in, st ükski ICP ei läinud sisse
}
const c1Pct = icpAttempts > 0 ? icpMade / icpAttempts * 100 : null;
```

**Ristkontroll**: peab ühtima `ICPTotal` väljaga (väike protsent).

### Birdie putting %

**Definitsioon** (rangelt): C1 katsetest birdie'iks (ühe ettenähtud putilöögiga lõpetatud) tehtud protsent.

**Võimalus (opportunity)** = mängija seisab C1-s ja eesolev putt oleks birdie:
- `GRH=1` (roheline saavutatud regulatsioonis)
- `ICP >= 1` (vähemalt üks C1 putt üritati)
- `Result !== "1"` (mitte ace)
- `PEN === "0"` (trahv tõstab skoori — "birdie putt koos trahviga" ei ole enam birdie)

**Tehtud birdie** = `ICP = 1 AND IBP = 0` — üks C1 katse, mis läks esmakordselt sisse, tap-in'i ei olnud.

**Ristkontroll läbi Diff'i**: kui tingimused birdie opp'i jaoks täidetud, siis Diff peab olema:
- -1 (tehtud birdie)
- 0 (miss → tap-in parile) — st `ICP=1, IBP=1`
- +1 või enam (miss ja 3-putt või veel hullem)

```js
const birdieOps = validHoles.filter(h =>
  h.Result !== "1" &&
  Number(h.GRH) === 1 &&
  Number(h.ICP || 0) >= 1 &&
  Number(h.PEN || 0) === 0
);
const birdieMade = birdieOps.filter(h =>
  Number(h.ICP) === 1 && Number(h.IBP) === 0
).length;
// Sanity check: birdie made peaks ka olema Diff = -1
const sanity = birdieOps.filter(h =>
  Number(h.ICP) === 1 && Number(h.IBP) === 0 && Number(h.Diff) === -1
).length;
if (sanity !== birdieMade) console.warn("Birdie made ≠ Diff=-1!", sanity, birdieMade);
```

**TÄHTIS edge case'id:**
- **Parked birdie** (`GRH=1, ICP=0, IBP=1, Diff=-1`): tee shot pargis, tap-in birdie → **ei loenda** birdie putting % hulka (ei olnud reaalset putti), aga loenda *birdie'ide koguarvu* hulka eraldi statistikuks
- **C2 birdie** (`GRH=0, OCP=1 made, ICP=0, IBP=0, Diff=-1`, nt hole 6 näites): pikk C2 putt läks sisse → birdie, aga mitte "C1 birdie putt"
- **Ace** (`Result=1, Diff ≤ -1`): ei ole putt üldse — loe eraldi

### Par putting % (C1 par-save %)

**Definitsioon**: C1 puttide katsed, mille tegemisel saab par, väljendatuna protsendina.

Par-putt opportunity jaguneb kaheks juhuks:

**Juht A: GRH=1** (mängija oli rohelisele, aga esimese C1 putiga birdie ei tulnud, nüüd putib pari eest)
- Tingimus: `GRH=1 AND ICP >= 2 AND PEN=0 AND Result !== "1"`
- Tehtud par: `ICP=2 AND IBP=0 AND Diff=0` (teine C1 putt läks sisse, par)
- Miss: `ICP >= 2 AND (IBP=1 OR ICP >= 3)` → Diff ≥ +1

**Juht B: GRH=0** (ei olnud rohelisel regulatsioonis, aga jõudis C1'ni hilisema löögiga ja pihib nüüd par'i)
- Peab lõpetama auk **C1 putiga** (viimane löök oli C1, mitte tap-in): `IBP=0 AND ICP >= 1`
- *Ja* see C1 putt pidi andma par: `Diff = 0 AND Result = Par` (tehtud) või `Diff = +1` (miss, mille korral C1 ei läinud sisse)
- OCP võib olla > 0 (enne C1 putti oli C2 katse) — see EI VÄLISTA par putti C1-st

**Ühtne valem:**
```js
function isParPuttOpp(h, par) {
  if (h.Result === "1") return false;
  if (Number(h.PEN || 0) > 0) return false; // penalty makes it non-comparable
  const grh = Number(h.GRH || 0);
  const icp = Number(h.ICP || 0);
  const ibp = Number(h.IBP || 0);
  const diff = Number(h.Diff);
  if (icp < 1) return false; // vähemalt üks C1 katse
  if (grh === 1) {
    // Juht A: birdie miss, par putt attempt
    return icp >= 2;
  } else {
    // Juht B: scramble par putt
    // C1 putt oli viimane löök, mis andis par või läks mööda tuues bogey
    // (A) tehtud: ICP >= 1, IBP = 0, Diff = 0
    // (B) miss: ICP >= 1 AND (IBP = 1 AND Diff = +1) OR (ICP >= 2 AND IBP = 0 AND Diff = +1)
    if (diff === 0 && ibp === 0) return true;  // tehtud
    if (diff === 1 && ibp === 1) return true;  // missitud C1 → tap-in bogey
    if (diff === 1 && ibp === 0 && icp >= 2) return true; // kaks C1 katset, teine tehtud, aga bogey
    return false;
  }
}

function isParPuttMade(h) {
  if (Number(h.Diff) !== 0) return false; // par peab olema
  const grh = Number(h.GRH || 0);
  const icp = Number(h.ICP || 0);
  const ibp = Number(h.IBP || 0);
  if (grh === 1) return icp === 2 && ibp === 0;
  return icp >= 1 && ibp === 0;
}

const parOpps = validHoles.filter(h => isParPuttOpp(h, /* par võetakse Tracks-ist */));
const parMade = parOpps.filter(isParPuttMade).length;
const parPct = parOpps.length > 0 ? parMade / parOpps.length * 100 : null;
```

**Kuhu par'i väärtus saada:** `data.Competition.Tracks[i].Par` — tee see kättesaadavaks iga augu juures.

### Scramble %

**Definitsioon**: aukudel, kus GRH=0, mitu protsenti sai par või parem.

```js
const scrambleOpps = validHoles.filter(h => Number(h.GRH) === 0 && h.Result !== "1");
const scrambled = scrambleOpps.filter(h => Number(h.Diff) <= 0).length;
const scramblePct = scrambleOpps.length > 0 ? scrambled / scrambleOpps.length * 100 : null;
```

### Putiprotsent (putts-per-hole-style)

Praeguses koodis: aukude arv / putte kokku * 100 — mida kõrgem, seda vähem putte augu kohta.

```js
// Kasuta ainult auke kus oli vähemalt üks putistroke (ICP + IBP + OCP > 0)
const puttHoles = validHoles.filter(h =>
  (Number(h.ICP || 0) + Number(h.IBP || 0) + Number(h.OCP || 0)) > 0
);
const totalPutts = puttHoles.reduce((s, h) =>
  s + Number(h.ICP || 0) + Number(h.IBP || 0) + Number(h.OCP || 0), 0
);
const puttPct = totalPutts > 0 ? puttHoles.length / totalPutts * 100 : null;
```

**NB**: Praegu kood arvutab `ICP + IBP` (ilma OCP-ta). Vali üks definitsioon ja hoia seda dokumenteerituna.

## Enne statistika commit'imist: validation checklist

Kui muudad või lisad statistikat, *alati* käi need sammud läbi:

1. **Ristkontroll API kogusummadega** — arvuta mängija enda ringi statistika API-st tagastatud `XXXTotal` väljade vastu. Kui ei ühti, sul on valem vale.
2. **Diff sanity check** — kui sul on "birdie made" lipp, veendu, et `Diff = -1` neil aukudel. Kui ei, vaata üle.
3. **Penalty handling** — veendu, et PEN>0 korral statistika ei kuva neid auke birdie/par "made" tulemustena (trahv rikub võrdluse).
4. **Ace handling** — kõikjal `Result === "1"` välja filtreeri, kui statistika on puti kohta.
5. **Parked birdie'd ja C2 birdie'd** — need EI OLE C1 birdie putid, aga on birdie'd. Hoia need eraldi statistikutena või dokumenteeri konkreetselt, et "Birdie putt %" ei loe neid.
6. **Opportunity vs Made** — kontrolli, et *opportunity* arvestab ka missitud olukordi (nii tehtud kui missitud), mitte ainult tehtuid. Praeguses koodis on GRH=0 par putt opp arvestus puudulik selle koha pealt.
7. **Tühjad augud** filtreeritud välja ja `validHoles.length` on õige.
8. **`ICPTotal` parsing** — API väärtus on string kujul "57%" — muuda numbriks enne võrdlust.

## Test case'id

Vaata `references/test-cases.md` konkreetseteks käsitsi arvutatud näideteks (koos kontrollitud väljunditega).

## Edge case'id mida alati meeles pidada

1. **Ainult pooled augud mängitud** (early stop) — mängija lahkus 9 augu pealt. `validHoles.length = 9`, mitte 18. Ära kasuta fikseeritud 18.
2. **Mixed-player-array** — API tagastab `PlayerResults` segamini `[{...}, [], {...}, []]`. Filtreeri empty array'd välja objektide kohalt, mitte ei indekseeri kindla positsiooni järgi.
3. **Tee-to-basket ace** — `Result=1`, `Diff=-2` (par 3-l), `Diff=-3` (par 4-l) — *kõik* puti statistikud ei loe seda.
4. **Throw-in skill shots** — harv aga võimalik: mängija viskab fairway'ilt korvi (eagle). `Result=2` par 4-l, GRH=0, OCP=0, ICP=0, IBP=0, Diff=-2. **Ei ole C1 birdie putt.** Jätta välja.
5. **Penaltyga birdie'laadne** — mängija pargib, aga võttis trahvilöögi eelmise viskega (OB). `Result=par, Diff=0, PEN=1, GRH=1, ICP=0, IBP=1`. See pole birdie ega miss.
6. **3-putt põllul** — `GRH=1, ICP=3, IBP=0`: kaks C1 missi + kolmas C1 tehtud. Score = `par-2 + 3 = par+1` (bogey). Par putt opp (ICP≥2 on täidetud), aga *miss* (made=false).
7. **OCP + ICP kombineerime** — mängija missis C2, sai tagasi C1-sse, missis C1, tap-in. `GRH=0, OCP=1, ICP=1, IBP=1, Result=par+1`. See on par putt opportunity (scramble, missitud C1) ning see ei ole par save.
8. **GRH definitsioon äärmustes** — mõni Metrix versioon loeb GRH=1 ka siis, kui mängija jõuab C1-st väljapoole (kuni C2-ni) regulatsioonilöökide arvuga. Usalda API `GRH` välja, mitte ei proovi seda ise tuletada.
9. **`MetrixMode`** — `data.Competition.MetrixMode` näitab statistikarežiimi. Kui see on `"0"`, ring ei sisaldanud detailstatistikat (ICP/IBP/GRH võib olla kogu rea ulatuses 0 või "") — näita "andmed puuduvad" ning ära agregeeri seda. Programmaatiliselt detekteerimiseks pead kontrollima **kõiki viit** välja:
    ```js
    const hasStats = validHoles.some(h =>
      Number(h.GRH) > 0 || Number(h.BUE) > 0 ||
      Number(h.ICP) > 0 || Number(h.IBP) > 0 || Number(h.OCP) > 0
    );
    ```
    NB: kui jätta OCP välja, siis ring kus mängija tegi C2 birdie (ainult `OCP=1`, kõik ülejäänud 0) klassifitseeritakse ekslikult statistikata ringiks.
10. **BUETotal kuvatakse protsendina stringina** (nt `"11%"`), aga mõnes vanemas ringis hoopis arvuna. Tee parsimisel `parseInt(x)` mõlemat teha.

## Viited

- `references/api-fields.md` — põhjalik väljade kirjeldus, näidis API vastus kontrollsummade kontrollimiseks
- `references/algorithms.md` — kõikide statistikute detailsed algoritmid koos edge case'ide põhjendustega
- `references/test-cases.md` — konkreetsed käsitsi arvutatud näited (sh Palivere ring), mis tuleb alati läbi lasta pärast statistika muutmist
- `scripts/validate_stats.js` — käivitatav skript, mis võtab API response JSON-i sisendiks ja trükib iga statistiku koos ristkontrolliga kogusumma vastu

Kui leiad uue statistika formuleerimisel vasturääkivuse (nt oma valemi tulemus ≠ `ICPTotal`), **peatu ja uuri**, mis läks valesti — ära redigeeri "liba-paranduseks". Küsi kasutajalt selgitust või lisa uus edge case siia skilli.
