# Discgolf Stats - arendusjuhend

See fail kirjeldab, **kuidas teha muudatusi** sellesse projekti. Toote tehniline kirjeldus, API struktuur ja statistika valemid on dokumenteeritud mujal — see fail on töövoog, mida järgi iga ülesande puhul.

---

## Reeglid igale ülesandele

### 1. Loe enne kirjutamist

Enne kui hakkad koodi muutma, loe alati:

- **`.claude/skills/discgolf-metrix-stats/SKILL.md`** — väljade tähendused (eriti `IBP`, `ICP`, `GRH`), miks Metrix andmed on petlikud
- **`.claude/skills/discgolf-metrix-stats/references/algorithms.md`** — kõik statistika valemid (GRH%, BUE%, par putting %, birdie putting %, scramble %, putiprotsent)
- **`.claude/skills/discgolf-metrix-stats/references/api-fields.md`** — API JSON struktuur, väljade formaadid
- **Praegune `index.html`** — kuidas asjad praegu töötavad

### 2. Statistika muudatused — alati skilli järgi

Kui ülesanne puudutab statistikat (birdie %, par %, putiprotsent, GRH%, BUE%, scramble %, putid kokku, OCP, PEN, hole-in-one, eagle, vms), **järgi skilli algoritme**. Ära mõtle valemeid uuesti välja.

Kui sulle tundub et skill annab "vale" tulemuse — **peatu ja kontrolli**:
- Käivita `node .claude/skills/discgolf-metrix-stats/scripts/test.js` — kas testid lähevad läbi?
- Käivita `node .claude/skills/discgolf-metrix-stats/scripts/validate.js <api-vastus.json> <user_id>` — kas API kogusummad ühtivad?

Kui testid lähevad läbi ja validate ütleb "KÕIK ÕIGE", siis algoritm on õige ja sinu intuitsioon vale. Kui testid kukuvad, siis on tõesti viga skillis ja **uuenda skilli ennast** (lisa puuduv test case, paranda algoritm), mitte ära kirjuta `index.html`-i hoopis teistsugust loogikat.

### 3. Pärast iga muudatust

```bash
# 1. Käivita skilli testid (kui muutsid statistika loogikat)
node .claude/skills/discgolf-metrix-stats/scripts/test.js
# Oodatud: "PASS: 73 / FAIL: 0"

# 2. Salvesta praegune Palivere API vastus ja validate selle vastu
# (vaata "Validate skript" sektsiooni allpool)
node .claude/skills/discgolf-metrix-stats/scripts/validate.js /tmp/palivere.json 2821
# Oodatud: "KÕIK ÕIGE - statistika ühtib API kogusummadega"

# 3. Ava index.html brauseris, lae andmed, vaata konsooli
# Browseris automaatne ristkontroll peab olema vaikne (mitte console.warn)

# 4. Tõsta versiooninumbrit lehe alumises paremas nurgas (käsitsi, +0.1)

# 5. Commit + push
git add index.html .claude/skills/
git commit -m "<lühike kirjeldus>"
git push origin main
```

### 4. Versioonimine ja deploy — automaatselt iga muudatuse järel

Pärast iga `index.html` muutmist (ilma kasutajalt küsimata):

1. Tõsta versiooni `+0.1` — muuda `"v1.XX"` string `index.html` skriptis
2. `git add index.html` (ja skill failid kui muutsid)
3. `git commit -m "Round N: <lühike kirjeldus>"`
4. `git push origin main`

Versiooni numbrit ei tõsta kui muudad ainult `prompts/` või `.claude/` faile.

### 5. Ära tee neid asju

- **Ära hardcode** API koodi `index.html`-i (kasuta `localStorage.metrix_api_code`)
- **Ära hardcode** kasutaja UserID-d (loe see esimesest kehtivast ringist)
- **Ära kasuta** API kogusummasid kuvamiseks (`BUETotal`, `GRHTotal`, `ICPTotal`) — need on ainult ristkontrolliks. Arvuta kõik augupõhiselt.
- **Ära keskmista protsente** üle ringide. Kasuta `sum(made) / sum(attempts) * 100` mustrit (mikro-keskmine).
- **Ära kasuta `DNF`** ringi kehtivuse kontrollimiseks — see ei ole alati `null`. Kasuta `Sum > 0` ja `validHoles.length > 0`.
- **Ära lisa npm pakette** ega build tööriistu. Vanilla JS, üks fail.

### 6. Uue ülesande haldamine

Kui kasutaja kirjeldab uut ülesannet (bug, feature, parandus), siis:

1. **Kirjuta ülesanne kõigepealt briefingusse** "Pending tasks" sektsiooni —
   sõnasta lühidalt mis on probleem ja mis on oodatud tulemus
2. **Küsi kasutajalt kinnitust:** "Lisasin briefingusse järgmise ülesande:
   <pealkiri>. Kas alustan tegemist või tahad enne midagi täpsustada?"
3. **Pärast kasutaja OK-d** tee ülesanne ära järgides reegleid 1–4
4. **Pärast tegemist** kustuta task briefingust (või liiguta `CHANGELOG.md`-sse)

Erand: kui kasutaja ütleb selgelt "tee kohe" või "lihtne fix, ära küsi",
jäta vahesamm 2 vahele.

---

## Validate skripti kasutamine

Kui muudad statistika loogikat ja tahad olla kindel et brauseri tulemused ühtivad reaalse API-ga:

**1. Salvesta üks reaalne API vastus testimiseks:**

PowerShellis (Windows):
```powershell
Invoke-WebRequest "https://discgolfmetrix.com/api.php?content=result&id=3571727&code=$env:METRIX_API_CODE" -OutFile "$env:TEMP\palivere.json"
```

Või lihtsalt brauseris ava URL ja Save As.

**2. Käivita validate:**
```bash
node .claude/skills/discgolf-metrix-stats/scripts/validate.js C:\Users\krist\AppData\Local\Temp\palivere.json 2821
```

**3. Oodatud väljund:**
```
Põhistatistika:
  GRH%:              27.8% (5/18)
  Birdie putting %:  33.3% (1/3)
  Par putting %:     50.0% (2/4)
  ...

Ristkontroll API kogusummade vastu:
  KÕIK ÕIGE - statistika ühtib API kogusummadega.
```

Kui näed "PROBLEEMID LEITUD", siis kas algoritm või sinu muudatus on vale.

---

## Brauseripoolne automaatne ristkontroll

`index.html` jookseb iga laetud ringi pealt sama ristkontrolli mida `validate.js` teeb (vt skill `metrix-stats.js` `validateRound`). Kui leiad mismatch'i:

```
Stats mismatch round 3571727 { metric: "GRH%", calc: 27.8, api: 35.0 }
```

See on **tõsine asi** — kas API andmed on muutunud, või sa tegid äsja regressiooni. Uuri kohe.

---

## Skill'i hooldamine

Skill `.claude/skills/discgolf-metrix-stats/` on **algoritmide tõe allikas**. Kui leiad uue edge case'i mida skill ei kata:

1. Lisa test case `references/test-cases.md`-sse
2. Lisa vastav assertion `scripts/test.js`-i
3. Käivita test → näe et see kukub
4. Paranda algoritm `scripts/metrix-stats.js`-is
5. Käivita test uuesti → näe et see läheb läbi
6. Alles **siis** muuda `index.html`-i

Nii ei saa keegi tulevikus seda algoritmi kogemata uuesti rikkuda.

---

## Pending tasks

