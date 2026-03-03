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
- DB veri dosyasi (`server/database/kinderlab.db`) bu repoda bilinclli olarak takiptedir; secret/gercek prod veri konmamalidir.
- Local prompt yardimci dosyalari (`agentsmdpromptu.txt`, `güvenlikodyazmapromptu.txt`, `optimizasyonpromptu.txt`) repoya alinmaz.
- Auth token tek basina yeterli degildir; middleware DB re-validation yapar.
- Siparislerde odeme alani ayridir (`payment_status`); odeme `paid` olmadan fulfillment status'lerine gecis engellenir.
- Admin fulfillment akisi `received -> preparing -> shipping` ile sinirlidir; `shipping` icin carrier + tracking zorunludur.
- `delivered` durumu varsayilan olarak sadece carrier webhook ile guncellenir (`POST /webhooks/carrier/orders/:id/status`).
- Admin order modalinda payment alani read-only snapshot olarak gosterilir; tek aksiyon fulfillment update'dir (`Update Order`).
- PSP (iyzico/stripe/paytr) henuz bagli degil; payment domain hazirligi (`payment_attempts`, `payment_events`, payment-status endpointleri) aktiftir.
- Admin panelinde orders/users/contacts/blog/press/media/events tablari ve ana modallar `src/components/admin/*` altina parcali yapiya alinmistir.
