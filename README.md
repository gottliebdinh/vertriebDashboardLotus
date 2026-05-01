# Dashboard GeVin

Cleanes, modernes Dashboard zum Verwalten von Bewerbern und ihrer Zuordnung
zu Unternehmen — mit Drag & Drop, integriertem PDF-Viewer für Lebenslauf
und Anschreiben, und vollständiger lokaler Speicherung im Browser
(IndexedDB).

## Features

- Personen-Kacheln mit Profilbild, Name, Alter und Arbeitswunsch
- Klick auf eine Kachel öffnet einen Detail-Dialog mit:
  - Lebenslauf (PDF) und Anschreiben (PDF) nebeneinander
  - Bearbeiten / Löschen / Unternehmen umzuordnen
- Unternehmen als Spalten — Personen per Drag & Drop verschieben
- Personen-Pool für noch nicht zugeordnete Bewerber
- Suche über Name & Arbeitswunsch
- Alles lokal: PDFs und Bilder werden in IndexedDB gespeichert,
  Metadaten in `localStorage`. Kein Backend nötig.

## Tech-Stack

- **Vite + React 18 + TypeScript**
- **TailwindCSS** für das UI
- **@dnd-kit** für Drag & Drop
- **zustand** für State Management (mit Persistenz)
- **idb** für IndexedDB
- **lucide-react** für Icons

## Setup

```bash
npm install
npm run dev
```

Das Dashboard läuft dann unter [http://localhost:5173](http://localhost:5173).

### Build

```bash
npm run build
npm run preview
```

## Bedienung

1. **Person anlegen**: Oben rechts auf „Person" klicken. Profilbild,
   Lebenslauf (PDF) und Anschreiben (PDF) hochladen — alles wird
   lokal im Browser gespeichert.
2. **Unternehmen anlegen**: Oben rechts auf „Unternehmen" klicken oder
   die gestrichelte Karte rechts.
3. **Drag & Drop**: Person aus dem Pool links auf eine Unternehmens-Spalte
   ziehen. Mit dem Griff-Symbol oben rechts an der Karte greifen.
4. **Detail öffnen**: Auf eine Person klicken → PDFs, Notizen und
   Aktionen erscheinen im Modal.

## Daten zurücksetzen

Da alles lokal gespeichert ist, kannst du in den Browser-DevTools unter
*Application → Storage* den Eintrag für `localhost:5173` löschen,
um sauber neu zu starten.
