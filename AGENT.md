# AGENT.md

Kisa giris dosyasi. Detayli rehberler:

- Ana operasyon rehberi: `AGENTS.md`
- Session devri notlari: `HANDOFF.md`

## 60 saniye hizli baslangic

1. Sirayla `AGENT.md`, `AGENTS.md`, `HANDOFF.md`, `README.md` oku.
2. `git status -sb` calistir.
3. Degisiklik yapmadan once ilgili modulu oku.
4. Degisiklikten sonra su dogrulamayi kos:

```bash
npm run lint && npm test && npm run build -- --logLevel error
```

## Kritik kurallar

- Secret dosyalari commit etme (`server/.env` vb.).
- DB veri dosyasi (`server/database/kinderlab.db`) koddan farkli bir varliktir; policy'ye gore yonet.
- Auth token tek basina yeterli degildir; middleware DB re-validation yapar.
