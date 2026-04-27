# Changelog

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
