# Lotus & Eagle · Bewerber-Dashboard

Modernes Dashboard zum Verwalten von Bewerbern und ihrer Zuordnung zu
Unternehmen — mit Drag & Drop, integriertem PDF-Viewer für Lebenslauf und
Anschreiben, sowie lokaler Speicherung im Browser (IndexedDB).

## Features

- Große Personen-Kacheln mit Profilbild, Name, Alter und Arbeitswunsch
- Klick auf eine Kachel öffnet einen Detail-Dialog mit Lebenslauf (PDF) und
  Anschreiben (PDF) nebeneinander
- **Lotus & Eagle**: Bewerber-Pool als Hauptansicht, **Unternehmen** fest
  als Sidebar rechts — Drag & Drop zwischen Pool und Unternehmen
- Status: Verfügbar · Vorgeschlagen · Vermittelt (filterbar)
- Suche über Name und Arbeitswunsch
- Lokale Speicherung: PDFs und Bilder in IndexedDB, Metadaten in
  `localStorage` — kein Backend nötig

## Tech-Stack

- **Vite + React 18 + TypeScript**
- **TailwindCSS**
- **@dnd-kit** für Drag & Drop
- **zustand** mit Persistenz
- **idb** für IndexedDB
- **lucide-react** für Icons

## Setup

```bash
npm install
npm run dev
```

Die App läuft unter [http://localhost:5173](http://localhost:5173).

### Build

```bash
npm run build
npm run preview
```

## Daten zurücksetzen

In den Browser-DevTools unter **Application → Storage** für diese Origin die
Einträge für IndexedDB `lotus-eagle-dashboard` und `localStorage`-Schlüssel
`lotus-eagle-dashboard-store` löschen.

Beim ersten Start nach einem Update werden alte Daten automatisch von den
früheren Namen `dashboard-gevin` übernommen (IndexedDB und Store-Key).
