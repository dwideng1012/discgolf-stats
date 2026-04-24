# Discgolf Metrix API - väljade dokumentatsioon

## Endpoints

### `?content=my_competitions&code=XXX`
Tagastab kasutaja võistluste ID-de nimekirja:
```json
{ "my_competitions": [3571727, 3568123, ...], "Errors": [] }
```

### `?content=result&id=XXX&code=YYY`
Tagastab konkreetse võistluse täielikud andmed.

## Vastuse põhistruktuur

```json
{
  "Competition": {
    "ID": 3571727,
    "Name": "Võistluse nimi",
    "Date": "2026-04-11",
    "Time": "15:55:00",
    "CourseName": "Palivere → Punane 2024",
    "CourseID": "40203",
    "MetrixMode": "1",
    "Type": "2",
    "Results": [ /* mängijad */ ],
    "Tracks": [ /* augud par'idega */ ]
  },
  "Errors": []
}
```

## `Tracks` array (rajainfo)

Iga element = üks auk:
```json
{ "Number": "1", "NumberAlt": "", "Par": "4" }
```

- `Number` — augu number (string)
- `Par` — par (string, parsida `parseInt`)

**TÄHTIS**: `Tracks[i]` indeks vastab `PlayerResults[i]` indeksile. Kui mängija augul ei mänginud (PlayerResults[i] = []), siis Tracks[i].Par on ikkagi olemas, aga seda ei tohiks kasutada.

## `Results` array (mängijad)

Iga element = üks mängija:
```json
{
  "UserID": "2821",
  "ScorecardID": "14262715",
  "Name": "Kristjan Liiv",
  "ClassName": "",
  "CountryCode": "EE",
  "Group": "3",
  "PlayerResults": [ /* iga auk */ ],
  "Penalty": null,
  "Sum": 60,
  "Diff": -1,
  "DNF": null,
  "BUETotal": "11%",
  "GRHTotal": "28%",
  "OCPTotal": "1",
  "ICPTotal": "57%",
  "IBPTotal": "13",
  "PenaltiesTotal": "0",
  "PreviousRoundsSum": null,
  "PreviousRoundsDiff": null,
  "Place": 1,
  "OrderNumber": 1
}
```

### Mängija kogusummad (kasuta ristkontrolliks!)

| Väli | Tähendus | Formaat |
|------|----------|---------|
| `Sum` | Ringi koguskoor (koos trahvidega) | int |
| `Diff` | Sum - Par_kokku | int |
| `BUETotal` | (BUE=1 augud) / mängitud * 100, formatted | string nt "11%" |
| `GRHTotal` | (GRH=1 augud) / mängitud * 100 | string nt "28%" |
| `ICPTotal` | (tehtud C1 putid) / kõik C1 katsed * 100 | string nt "57%" |
| `OCPTotal` | C2 puttide katsete arv (mitte protsent!) | string nt "1" |
| `IBPTotal` | Tap-in'iga lõpetatud aukude arv | string nt "13" |
| `PenaltiesTotal` | Trahvilöökide arv kokku | string nt "0" |
| `Place` | Lõppkoht võistlusel | int või null |
| `DNF` | Did Not Finish | null või "1" |

### `PlayerResults` array

Iga element on KAS:
- **Objekt** = auk mängitud
- **Tühi array `[]`** = auk vahele jäetud / pole mängitud
- **`null`** = harv aga võimalik

Filtreeri **objektid** välja (vaata `validHoles` mustrit SKILL.md-s).

#### Augu objekti väljad

```json
{
  "Result": "4",
  "Diff": 0,
  "BUE": "0",
  "GRH": "0",
  "OCP": "0",
  "ICP": "0",
  "IBP": "1",
  "PEN": "0"
}
```

| Väli | Tüüp | Tähendus | Lubatud väärtused |
|------|------|----------|-------------------|
| `Result` | string | Augu lõppskoor (sisaldab trahve) | "1", "2", "3", ... |
| `Diff` | int | Result - Tracks[i].Par | nt -2, -1, 0, +1, +2 |
| `GRH` | string | Green reached in regulation | "0" / "1" |
| `BUE` | string | Parked (löök läks korvi otsa alla) | "0" / "1" |
| `OCP` | string | C2 (10-20m) puttide katsete arv | "0", "1", "2", ... |
| `ICP` | string | C1 (0-10m) **reaalsete** puttide katsete arv | "0", "1", "2", ... |
| `IBP` | string | Tap-in indikaator (auk lõpetati tap-iniga) | "0" / "1" |
| `PEN` | string | Trahvilöökide arv augul | "0", "1", "2", ... |

## Olulised detailid

### `MetrixMode`

- `"0"` — lihtne skoorikaart (ainult `Result`/`Diff`, ei pruugi olla ICP/IBP/GRH/OCP/BUE)
- `"1"` — täisstatistika kaart

Kui `MetrixMode = "0"` või statistikaväljad on kõik nullid, **ära** arvuta puti statistikat — andmed puuduvad. Loe ringi ja Diff-i ikka, aga jäta puti statistika `null`-iks.

Detekteeri programmaatiliselt:
```js
const hasStats = validHoles.some(h =>
  Number(h.GRH) > 0 || Number(h.BUE) > 0 ||
  Number(h.ICP) > 0 || Number(h.IBP) > 0 || Number(h.OCP) > 0
);
```

### Mitu mängijat

`Results` võib sisaldada palju mängijaid. Tuvasta enda mängija:
1. Esimese ringi puhul: `Results[0]` (kus `Sum > 0` ja vähemalt üks valid hole) on tavaliselt sisselogitud kasutaja
2. Salvesta `UserID` järgnevateks päringuteks
3. Edaspidi otsi `Results.find(r => r.UserID === myUserID)`

### Tühi mängija ring

Mängija on `Results` arrays, aga:
- `Sum = 0` ja kõik `PlayerResults` on `[]` → mängija oli registreeritud, aga ei mänginud
- Filtreeri välja: `Sum > 0` AND vähemalt üks `validHoles` element

### IBP semantics

`IBPTotal` on **count**, mitte protsent — kui Total kuvatakse "13", siis 13 auku lõppes tap-iniga. See võimaldab ristkontrolli:

```js
const ibpCount = validHoles.filter(h => Number(h.IBP) === 1).length;
// peab võrduma parseInt(player.IBPTotal)
```

### GRH formaal definitsioon

`GRH = 1` kui mängija jõudis rohelisele (C1) `par - 2` löögiga:
- Par 3: 1 löök rohelisele (st GRH = "tee shot landed in C1")
- Par 4: 2 lööki rohelisele
- Par 5: 3 lööki rohelisele

Ace puhul: par 3 GRH = 1 alati (sest tee shot **läks** rohelisele... ja korvi).

### Ristkontroll-formaadid

Pane tähele, et stringe tuleb parsida:
- `"57%"` → `parseInt("57%", 10) = 57` (parseInt ignoreerib `%`)
- `"0"` → `parseInt = 0`
- `""` → `parseInt = NaN` (kontrolli enne!)

Kasuta turvalist konversiooni:
```js
function pctToNumber(s) {
  const n = parseFloat(String(s).replace("%", ""));
  return Number.isFinite(n) ? n : null;
}
```

## Konkreetne näide: Palivere ring

ID: 3571727. Mängija "Kristjan Liiv", UserID 2821.

**Kogusummad API-st:**
- Sum: 60, Diff: -1
- 18 auku, par kokku 61
- BUETotal: "11%" → 2 auku parked (11.1% = 2/18)
- GRHTotal: "28%" → 5 auku GRH (27.8% = 5/18)
- ICPTotal: "57%" → C1 made / C1 attempts = ~57%
- OCPTotal: "1" → 1 C2 katse kokku
- IBPTotal: "13" → 13 auku lõppes tap-iniga
- PenaltiesTotal: "0" → 0 trahvi
- Place: 1

**Käsitsi kontrollitud arvutused:**
- BUE=1 augud: hole 8 ja 9 → 2 auku → 2/18 = 11.1% ✓
- GRH=1 augud: hole 5, 8, 9, 11, 14 → 5 auku → 5/18 = 27.8% ✓
- ICP kokku: 1+0+1+0+2+0+1+0+0+0+1+1+0+1+0+0+0+0 = 7 katset
- IBP kokku: 1+1+0+1+1+0+0+1+1+1+1+0+1+0+1+1+1+1 = 13 ✓
- C1 made: augud kus ICP≥1 AND IBP=0:
  - hole 3 (ICP=1, IBP=0): made
  - hole 7 (ICP=1, IBP=0): made
  - hole 12 (ICP=1, IBP=0): made
  - hole 14 (ICP=1, IBP=0): made
  → 4 made / 7 attempts = 57.1% ✓ (vastab "57%")
- OCP kokku: hole 6 (OCP=1) → 1 ✓

**Birdie analüüs (Diff=-1 augud):**
- Hole 6: Diff=-1, GRH=0, OCP=1, IBP=0 → C2 birdie (ei ole C1 birdie putt)
- Hole 8: Diff=-1, GRH=1, ICP=0, IBP=1, BUE=1 → parked birdie (ei ole C1 birdie putt — putt oli tap-in)
- Hole 9: Diff=-1, GRH=1, ICP=0, IBP=1, BUE=1 → parked birdie (sama)
- Hole 14: Diff=-1, GRH=1, ICP=1, IBP=0 → **C1 birdie putt made** ✓

**Birdie putting % rangelt:**
- Opportunities (GRH=1, ICP≥1, PEN=0, mitte ace): hole 5, 11, 14 = 3 opp
  - Hole 5: ICP=2, IBP=1, Diff=+1 → birdie miss (kaks katset, tap-in bogey)
  - Hole 11: ICP=1, IBP=1, Diff=0 → birdie miss, tap-in par save
  - Hole 14: ICP=1, IBP=0, Diff=-1 → **birdie made**
- Birdie putting % = 1/3 = 33.3%

**Par putting %:**
- Hole 5: GRH=1, ICP=2, OPP juht A, IBP=1 → miss (Diff=+1, bogey)
- Hole 11: GRH=1, ICP=1 → ICP < 2, ei ole juht A par putt opp
- Hole 1: GRH=0, ICP=0 → ei ole opp (ei putitud C1-st)
- Hole 4: GRH=0, ICP=0, IBP=1, Diff=0 → **parked par save** (tap-in), aga ei ole C1 par putt
- ...

Vaata `test-cases.md` täismassiivi.
