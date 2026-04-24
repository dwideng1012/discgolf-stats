# Test case'id

Need on käsitsi arvutatud näited reaalsetest API vastustest. Iga statistika muudatus peab läbima KÕIK need testid.

## Test 1: Palivere → Punane 2024 (täisstatistika ring)

**API**: `?content=result&id=3571727`
**Mängija**: Kristjan Liiv (UserID 2821)
**Datum**: 2026-04-11
**MetrixMode**: 1 (täisstatistika)

### Sisendandmed

Tracks (par):
```
[4, 4, 4, 3, 3, 3, 3, 3, 3, 4, 4, 3, 3, 3, 4, 3, 3, 4]
Par kokku: 61
```

PlayerResults (Result, Diff, BUE, GRH, OCP, ICP, IBP, PEN):
```
H1:  4, 0,  0, 0, 0, 0, 1, 0
H2:  4, 0,  0, 0, 0, 0, 1, 0
H3:  5, 1,  0, 0, 0, 1, 0, 0
H4:  3, 0,  0, 0, 0, 0, 1, 0
H5:  4, 1,  0, 1, 0, 2, 1, 0
H6:  2,-1,  0, 0, 1, 0, 0, 0
H7:  3, 0,  0, 0, 0, 1, 0, 0
H8:  2,-1,  1, 1, 0, 0, 1, 0
H9:  2,-1,  1, 1, 0, 0, 1, 0
H10: 4, 0,  0, 0, 0, 0, 1, 0
H11: 4, 0,  0, 1, 0, 1, 1, 0
H12: 3, 0,  0, 0, 0, 1, 0, 0
H13: 4, 1,  0, 0, 0, 0, 1, 0
H14: 2,-1,  0, 1, 0, 1, 0, 0
H15: 4, 0,  0, 0, 0, 0, 1, 0
H16: 3, 0,  0, 0, 0, 0, 1, 0
H17: 3, 0,  0, 0, 0, 0, 1, 0
H18: 4, 0,  0, 0, 0, 0, 1, 0
```

### Oodatud väljundid

| Statistik | Oodatud | Arvutus |
|-----------|---------|---------|
| Sum | 60 | summa |
| Diff | -1 | 60 - 61 |
| GRH% | 27.8% (5/18) | augud 5,8,9,11,14 |
| BUE% | 11.1% (2/18) | augud 8,9 |
| C1 putiprotsent (ICP%) | 57.1% (4/7) | made: H3, H7, H12, H14 (kõik ICP=1, IBP=0). Attempts: 1+1+2+1+1+1+1 = 7 |
| OCP attempts | 1 | hole 6 |
| IBP count | 13 | augud 1,2,4,5,8,9,10,11,13,15,16,17,18 |
| PEN total | 0 | – |
| HIO | 0 | – |
| **Birdie putt opps** | **3** | augud 5, 11, 14 (GRH=1, ICP≥1, mitte ace, PEN=0) |
| **Birdie putt made** | **1** | hole 14 (ICP=1, IBP=0, Diff=-1) |
| **Birdie putting %** | **33.3%** | 1/3 |
| Birdies kokku (loend) | 4 | augud 6, 8, 9, 14 (Diff=-1) |
| **Par putt opps (juht A)** | **1** | hole 5 (GRH=1, ICP=2) |
| **Par putt opps (juht B)** | **0** | mitte ühelgi GRH=0 augul ICP≥1 + (Diff=0 või Diff=+1)... vt analüüs |
| **Par putt opps kokku** | **1** | – |
| **Par putt made** | **0** | hole 5 missis (Diff=+1) |
| **Par putting %** | **0%** | 0/1 |
| Scramble opps | 13 | augud kus GRH=0: 1,2,3,4,6,7,10,12,13,15,16,17,18 |
| Scramble saved | 12 | kõik nad lõppesid Diff≤0, välja arvatud H3 (Diff=+1) ja H13 (Diff=+1)... oodake, peaks kontrollima |

### Detailne par putt analüüs (juht B)

GRH=0 augud kus võiks olla par putt opp (ICP≥1, mitte ace, PEN=0):
- H3: GRH=0, ICP=1, IBP=0, Diff=+1 → opp! made? Diff!=0 → miss
- H7: GRH=0, ICP=1, IBP=0, Diff=0 → opp! Diff=0 → made
- H12: GRH=0, ICP=1, IBP=0, Diff=0 → opp! → made

Tegelikult juht B opps = 3, made = 2.

Kokku:
- Par putt opps = 1 (juht A) + 3 (juht B) = **4**
- Par putt made = 0 + 2 = **2**
- Par putting % = 2/4 = **50%**

### Detailne scramble analüüs

GRH=0 augud (mitte ace): H1, H2, H3, H4, H6, H7, H10, H12, H13, H15, H16, H17, H18 = 13
Diff <= 0 nendest: H1(0), H2(0), H4(0), H6(-1), H7(0), H10(0), H12(0), H15(0), H16(0), H17(0), H18(0) = 11
Diff > 0: H3(+1), H13(+1) = 2

Scramble % = 11/13 = **84.6%**

### Validatsioon (peab läbima)

```
GRH% calc=27.78%, API="28%" → tolerance OK
BUE% calc=11.11%, API="11%" → tolerance OK
C1% calc=57.14%, API="57%" → tolerance OK
IBP count calc=13, API="13" → match
OCP count calc=1, API="1" → match
Sum calc=60, API=60 → match
```

---

## Test 2: Lihtne ring ilma statistikata (MetrixMode=0)

Hüpoteetiline andmestik:
```json
{
  "Competition": {
    "MetrixMode": "0",
    "Tracks": [{"Par": "3"}, {"Par": "3"}, {"Par": "3"}],
    "Results": [{
      "UserID": "100",
      "PlayerResults": [
        {"Result": "3", "Diff": 0, "GRH": "0", "BUE": "0", "OCP": "0", "ICP": "0", "IBP": "0", "PEN": "0"},
        {"Result": "4", "Diff": 1, "GRH": "0", "BUE": "0", "OCP": "0", "ICP": "0", "IBP": "0", "PEN": "0"},
        {"Result": "2", "Diff": -1, "GRH": "0", "BUE": "0", "OCP": "0", "ICP": "0", "IBP": "0", "PEN": "0"}
      ],
      "Sum": 9,
      "Diff": 0
    }]
  }
}
```

### Oodatud
- `hasStats = false` (kõik GRH/BUE/ICP/IBP on 0)
- Sum=9, Diff=0
- Birdie putt %, Par putt %, GRH%, BUE%, C1% — kõik **null** (andmed puuduvad)
- Birdie kokku = 1 (H3, Diff=-1)
- HIO = 0

---

## Test 3: Ring ace'iga

Hüpoteetiline:
```
Par 3 auk: Result=1, Diff=-2, GRH=1, BUE=0, OCP=0, ICP=0, IBP=0, PEN=0
```

### Oodatud
- HIO = 1
- See auk **EI loendata**:
  - Birdie putt opp'iks (sest Result === "1")
  - Birdie loendisse (eraldi: ace'id ≠ birdie'd)
  - C1 putiprotsenti (ICP=0 niikuinii)
- See auk **loendatakse**:
  - GRH (jõudis rohelisele)

---

## Test 4: 3-putt põllul (par putt miss bogey)

Hüpoteetiline auk:
```
Par 4: Result=5, Diff=+1, GRH=1, BUE=0, OCP=0, ICP=3, IBP=0, PEN=0
```

(Mängija jõudis rohelisele 2 löögiga, missis kaks C1 putti, tegi kolmanda → bogey)

### Oodatud
- Birdie putt opp = jah (GRH=1, ICP≥1)
- Birdie putt made = ei (ICP=3, mitte 1)
- Par putt opp = jah (juht A: GRH=1, ICP≥2)
- Par putt made = ei (Diff != 0)
- C1 attempts += 3, made += 1 (viimane ICP läks sisse, sest IBP=0)

---

## Test 5: Tap-in birdie (parked tee shot)

Auk (par 3):
```
Result=2, Diff=-1, GRH=1, BUE=1, OCP=0, ICP=0, IBP=1, PEN=0
```

### Oodatud
- Birdie loend += 1
- Birdie putt opp = **ei** (ICP=0, ei olnud reaalset C1 putti)
- C1 attempts += 0
- BUE += 1
- IBP count += 1

See on Palivere ringi H8 ja H9 muster.

---

## Test 6: C2 birdie

Auk (par 4):
```
Result=3, Diff=-1, GRH=0, BUE=0, OCP=1, ICP=0, IBP=0, PEN=0
```

(Mängija ei jõudnud rohelisele regulatsioonis, aga 3. löögist tegi C2 putiga birdie.)

### Oodatud
- Birdie loend += 1
- Birdie putt opp = **ei** (GRH=0)
- OCP attempts += 1
- C2 made += 1 (ICP=0 ja IBP=0 → viimane löök oli see OCP)
- Scramble opp = jah, saved = jah (Diff=-1)

See on Palivere ringi H6 muster.

---

## Test 7: Trahviga "birdie" mis pole birdie

Auk (par 4):
```
Result=4, Diff=0, GRH=1, BUE=0, OCP=0, ICP=1, IBP=0, PEN=1
```

(Mängija sai trahvilöögi (OB), aga tegi siis pari koos C1 putiga.)

### Oodatud
- Birdie putt opp = **ei** (PEN > 0 — välistab)
- Par putt opp = **ei** (PEN > 0)
- C1 attempts += 1, made += 1
- GRH += 1
- Diff = 0 (par)

---

## Test 8: Mängija ei mänginud kõiki auke (early DNF)

Hüpoteetiline `PlayerResults`:
```js
[
  {Result:"4", Diff:0, GRH:"1", BUE:"0", OCP:"0", ICP:"0", IBP:"1", PEN:"0"},
  {Result:"3", Diff:0, GRH:"1", BUE:"0", OCP:"0", ICP:"0", IBP:"1", PEN:"0"},
  {Result:"5", Diff:1, GRH:"0", BUE:"0", OCP:"0", ICP:"1", IBP:"0", PEN:"0"},
  [], [], [], [], [], [], [], [], [], [], [], [], [], [], []
]
```

### Oodatud
- `validHoles.length = 3` (mitte 18)
- GRH% = 2/3 = 66.7%
- Sum, Diff arvutatud ainult mängitud aukude põhjal

---

## Test 9: Mixed-format augud (jane mängija näide Paliverest)

API tagastas teise mängija (johan Laidoner) `PlayerResults`-i:
```
[[], [], {h3}, {h4}, {h5}, ..., {h11}, [], [], [], [], [], [], []]
```

### Oodatud
- Filter `isValidHole(h)` jätab alles 9 mängitud auku (H3–H11)
- Statistikud arvutatud ainult nende 9 augu põhjal
- `validHoles.length = 9`

---

## Test 10: Mitu C1 katset koos OCP-ga (scramble)

Auk (par 4):
```
Result=5, Diff=+1, GRH=0, BUE=0, OCP=1, ICP=1, IBP=1, PEN=0
```

(Mängija missis C2, missis C1, tap-in. Kokku 5 lööki par 4-l = bogey.)

### Oodatud
- C1 attempts += 1, made += 0 (IBP=1)
- C2 attempts += 1, made += 0 (ICP > 0 või IBP > 0 → ei olnud lõpetav putt)
- Par putt opp = jah (GRH=0, ICP≥1, Diff=+1)
- Par putt made = ei (Diff != 0)
- Scramble opp = jah, saved = ei (Diff > 0)

---

## Käivitamine

Salvesta need testid `validate_stats.js` skripti hindajaks. Iga test peab läbima 100% — kui mõni ei lähe läbi, peatu ja paranda algoritm enne edasiminekut.
