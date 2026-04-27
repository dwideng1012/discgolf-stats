# Changelog

## v1.37 (2026-04-27) — Adaptiivne hierarhiline võistlusfilter

Competition.Name split " - " järgi → `nameParts` massiiv. Tabelis iga osa
on eraldi klikitav span: klikk seab prefiksfiltri. Adaptiivne — töötab
suvalise sügavusega hierarhiaga (2–4+ taset).

Filter tüübid: `course` (raja järgi) + `prefix` (nimeprefiksi järgi).
Competition filter-icon eemaldatud (asendatud name-part klikkidega).

---

## v1.36 (2026-04-27) — Automaatne ristkontroll iga ringi pealt

Iga laetud ring valideeritakse API kogusummade vastu. Mismatch logitakse:
`console.warn("Stats mismatch round", id, { metric, calc, api })`

Kontrollitakse: Sum, GRH%, BUE%, ICP%, IBP count, OCP count.
Tolerants: 1 protsendipunkt. Vaikselt PASSis ringid ei logi midagi.

---

## v1.35 (2026-04-27) — Paranda hasStats valem ja OCP statistikaringid

**Probleem:** GRH%, BUE%, OCP, Putiprotsent, ICP putiprotsent arvestasid sisse
ringe kus statistikat polnud registreeritud (esimesed kolm Palivere võistlust).

**Juurpõhjus:** `hasStats` kasutas `h.GRH !== ""` kontrolli — kuna `"0" !== ""` on true,
loeti MetrixMode="1" aga kõik-nullid ringid statsiga ringideks. Skill kasutab
`Number(h.GRH) > 0 || ...` kontrolli (tegelik väärtus peab olema > 0).

OCP kasutab nüüd `statsRounds` allikana (mitte kõiki ringe), divisoriks `ns`.

**Muudatused:**
- `hasStats`: `h.GRH !== ""` → `Number(h.GRH) > 0 || Number(h.BUE) > 0 || ...`
- `ocpSum`: `sumR(chrono, "ocpTotal")` → `sumR(statsRounds, "ocpTotal")`
- OCP kaart: divisor `n` → `ns`, sub `n + " ringist"` → `ns + "/" + n + " ringist"`

---

## v1.34 (2026-04-27) — UserID sisestusväli

**Probleem:** Vale mängija valiti suurtest võistlustest (EDGL Pro Karikasari, 50+ mängijat).
Juurpõhjus: `my_competitions` API tagastab vanim-esimesena, pärast `.reverse()` on uusim
esimeses batch'is. Suurel võistlusel `Results[0]` = võitja, mitte kasutaja ise.

**Lahendus (v1.32–v1.34 kolmes sammus):**
- v1.32: lisati `compResults.length <= 5` künnis — UserID lukustatakse ainult väikestest ringidest
- v1.33: lisati `metrix_user_id` localStorage salvestus + lugemine enne fetch-tsüklit
- v1.34: lisati eraldi **UserID sisestusväli** UI-s; `myUserID` tuleb alati kasutaja sisendist,
  mitte `Results[0]` oletusest. Eemaldati künnis ja locking-heuristik täielikult.
  `playerName` leitakse ja salvestatakse localStorage'sse esimesest kehtivast ringist.

**Muudatused:**
- `index.html`: uus `<input id="userID">` väli controls-sektsioonis
- `index.html`: startup loeb `metrix_user_id` localStorage'st, täidab välja automaatselt
- `index.html`: `loadData()` valideerib UserID sisendi, kasutab `find(UserID)` kõikjal
- `index.html`: versioonimine + auto-deploy lisati reegliteks `briefing.md`-sse (reegel 4)

---

## v1.31 ja varasemad

Vaata git log: `git log --oneline`
