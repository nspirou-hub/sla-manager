# SLA Manager — Digital Center
## Οδηγίες Εγκατάστασης & Εκκίνησης

### Απαιτήσεις
- Node.js 18+ (https://nodejs.org)
- Python 3.9+ (για migration)

---

### Βήμα 1 — Supabase Schema
1. Πήγαινε στο https://supabase.com → το project σου
2. SQL Editor → New Query
3. Επικόλλησε το περιεχόμενο του `schema.sql` και τρέξε το

---

### Βήμα 2 — Migration δεδομένων (145 εγγραφές)
```bash
cd sla-manager
pip install supabase
python migrate.py
```

---

### Βήμα 3 — Εκκίνηση Web App
```bash
cd sla-manager
npm install
npm run dev
```
Άνοιξε http://localhost:5173

---

### Βήμα 4 — Build για παραγωγή (προαιρετικό)
```bash
npm run build
# Τα αρχεία είναι στο φάκελο dist/
# Μπορείς να κάνεις deploy στο Netlify, Vercel, κλπ.
```

---

### Χαρακτηριστικά
- **Dashboard** — KPIs, γραφήματα μήνα, τελευταίες εντολές
- **Εντολές** — λίστα με φίλτρα, προσθήκη/επεξεργασία
- **Αυτόματη κοστολόγηση** — από ώρες, χλμ, οδήγηση
- **Επεξεργάσιμα χλμ** — override ανά εντολή
- **Reports** — επιλογή διαστήματος, export CSV, εκτύπωση PDF
- **Τοποθεσίες** — διαχείριση με προκαθορισμένα χλμ
- **Ρυθμίσεις** — παράμετροι κοστολόγησης, πελάτες, τύποι εργασίας
- **Responsive** — λειτουργεί και σε κινητό
