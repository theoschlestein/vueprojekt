<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import deLocale from '@fullcalendar/core/locales/de'
import { useTermineStore } from '@/stores/termine'
import Ueberschneidungen from './Ueberschneidungen.vue'

// Auswahl an Farben für Termine
const farbOptionen = ['#f59e0b', '#3b82f6', '#22c55e', '#ec4899', '#8b5cf6', '#ef4444']

// Referenz auf die FullCalendar-Instanz (für die Heute-Funktion)
const calendarRef = ref(null)

// Tageszahl für den Heute-Button (z.B. "21")
const heutigerTag = new Date().getDate()

// Zurück zum aktuellen Monat springen
function zuHeuteSpringen() {
  calendarRef.value?.getApi().today()
}

// Termine kommen jetzt aus Supabase, verwaltet über den Pinia-Store
const termineStore = useTermineStore()
const termine = computed(() => termineStore.termine)

onMounted(() => {
  termineStore.laden()
  termineStore.liveSyncStarten()
})

onUnmounted(() => {
  termineStore.liveSyncStoppen()
})

// Zustand des Fensters
const dialogOffen = ref(false)
const bearbeiteteId = ref(null) // null = neuer Termin, sonst wird bearbeitet
const gewaehltesDatum = ref('')
const name = ref('')
const vonZeit = ref('09:00')
const bisZeit = ref('17:00')
const farbe = ref(farbOptionen[0])
const fehler = ref('')

// Klick auf einen leeren Tag: Fenster für NEUEN Termin öffnen
function tagGeklickt(info) {
  bearbeiteteId.value = null
  gewaehltesDatum.value = info.dateStr
  name.value = ''
  vonZeit.value = '09:00'
  bisZeit.value = '17:00'
  farbe.value = farbOptionen[0]
  fehler.value = ''
  dialogOffen.value = true
}

// Klick auf einen BESTEHENDEN Termin: Fenster mit den vorhandenen
// Werten zum Bearbeiten/Löschen öffnen
function terminGeklickt(info) {
  const termin = termine.value.find((t) => t.id === info.event.id)
  if (!termin) return
  bearbeiteteId.value = termin.id
  gewaehltesDatum.value = termin.datum
  name.value = termin.name
  vonZeit.value = termin.vonZeit
  bisZeit.value = termin.bisZeit
  farbe.value = termin.farbe
  fehler.value = ''
  dialogOffen.value = true
}

// Speichern-Button im Fenster (legt neu an ODER aktualisiert)
async function speichern() {
  if (!name.value.trim()) {
    fehler.value = 'Bitte einen Namen eintragen.'
    return
  }
  if (bisZeit.value <= vonZeit.value) {
    fehler.value = 'Die Endzeit muss nach der Startzeit liegen.'
    return
  }

  if (bearbeiteteId.value) {
    // Bestehenden Termin aktualisieren
    await termineStore.aktualisieren(bearbeiteteId.value, {
      name: name.value.trim(),
      vonZeit: vonZeit.value,
      bisZeit: bisZeit.value,
      farbe: farbe.value
    })
  } else {
    // Neuen Termin anlegen
    await termineStore.anlegen({
      datum: gewaehltesDatum.value,
      name: name.value.trim(),
      vonZeit: vonZeit.value,
      bisZeit: bisZeit.value,
      farbe: farbe.value
    })
  }

  dialogOffen.value = false
}

// Löschen-Button im Fenster (nur sichtbar beim Bearbeiten)
async function loeschen() {
  await termineStore.loeschen(bearbeiteteId.value)
  dialogOffen.value = false
}

// Abbrechen-Button im Fenster
function abbrechen() {
  dialogOffen.value = false
}

// Aus den gespeicherten Terminen die FullCalendar-Events bauen
const terminEvents = computed(() =>
  termine.value.map((t) => ({
    id: t.id,
    title: `${t.name}: ${t.vonZeit}–${t.bisZeit} Uhr`,
    start: `${t.datum}T${t.vonZeit}:00`,
    end: `${t.datum}T${t.bisZeit}:00`,
    backgroundColor: t.farbe,
    borderColor: t.farbe
  }))
)

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  locale: deLocale,
  // Wochentagskürzel explizit erzwingen (Mo, Di, Mi, Do, Fr, Sa, So),
  // unabhängig davon, was die Locale-Datei sonst liefert
  dayHeaderFormat: { weekday: 'short' },
  headerToolbar: {
    left: 'title',
    center: '',
    right: 'heuteButton,prev,next'
  },
  customButtons: {
    heuteButton: {
      text: String(heutigerTag),
      click: zuHeuteSpringen
    }
  },
  height: 'auto',
  fixedWeekCount: false,
  showNonCurrentDates: true,
  dateClick: tagGeklickt,
  eventClick: terminGeklickt,
  events: terminEvents.value
}))
</script>

<template>
  <div class="kalender-seite">

    <div class="kalender-layout">
      <!-- 2. Monat + Wechsel (kommt aus FullCalendars eigenem Toolbar) -->
      <!-- 3. Raster -->
      <div class="kalender-wrapper">
        <FullCalendar ref="calendarRef" :options="calendarOptions" class="kalender" />
      </div>

      <Ueberschneidungen />
    </div>

    <!-- Das Fenster: nur sichtbar, wenn dialogOffen true ist -->
    <div v-if="dialogOffen" class="overlay" @click.self="abbrechen">
      <div class="fenster">
        <h3>{{ bearbeiteteId ? 'Termin bearbeiten' : 'Neuer Termin' }} – {{ gewaehltesDatum }}</h3>

        <label>
          Name:
          <input type="text" v-model="name" placeholder="Wer hat Zeit?" />
        </label>

        <label>
          Von:
          <input type="time" v-model="vonZeit" />
        </label>

        <label>
          Bis:
          <input type="time" v-model="bisZeit" />
        </label>

        <label>
          Farbe:
          <span class="farbauswahl">
            <button
              v-for="option in farbOptionen"
              :key="option"
              type="button"
              class="farbknopf"
              :class="{ aktiv: farbe === option }"
              :style="{ backgroundColor: option }"
              :aria-label="`Farbe ${option}`"
              @click="farbe = option"
            ></button>
          </span>
        </label>

        <p v-if="fehler" class="fehler">{{ fehler }}</p>
        <p v-else-if="termineStore.fehler" class="fehler">{{ termineStore.fehler }}</p>

        <div class="knoepfe">
          <button v-if="bearbeiteteId" @click="loeschen" class="loeschen">Löschen</button>
          <button @click="abbrechen">Abbrechen</button>
          <button @click="speichern" class="primaer">Speichern</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.kalender-seite {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 1rem;
  box-sizing: border-box;
}

/* Kalender links, Überschneidungs-Fenster rechts daneben */
.kalender-layout {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

/* Äußerer Rahmen: feste Breite, kein "Atmen" durch Inhalt */
.kalender-wrapper {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  overflow: hidden;
}

@media (max-width: 780px) {
  .kalender-layout {
    flex-direction: column;
  }
}

/* ---------- Toolbar (Monat + Wechsel) ---------- */
/* Titel links, Buttons rechtsbündig - eine Zeile, keine Buttons
   über dem Monatsnamen. */
.kalender :deep(.fc-header-toolbar) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.kalender :deep(.fc-toolbar-chunk:last-child) {
  display: flex;
  align-items: center;
}

/* FullCalendar "verklebt" per Komma verbundene Buttons standardmäßig
   zu einer nahtlosen Gruppe (keine Lücke, eckige Innenkanten). Das
   heben wir auf: jeder Button bleibt ein eigener Kasten mit kleinem
   Abstand zum nächsten. */
.kalender :deep(.fc-button-group) {
  display: flex;
  gap: 0.4rem;
}

.kalender :deep(.fc-button-group > .fc-button) {
  margin-left: 0 !important;
  border-radius: 6px !important;
}

.kalender :deep(.fc-toolbar-title) {
  text-align: left;
  margin: 0;
  font-size: clamp(1rem, 1.5vw + 0.7rem, 1.25rem);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  font-weight: 700;
}

.kalender :deep(.fc-prev-button),
.kalender :deep(.fc-next-button) {
  width: 2.25rem;
  height: 2.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Heute-Button: Kasten mit der aktuellen Tageszahl, wie ein Kalender-Icon */
.kalender :deep(.fc-heuteButton-button) {
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.95rem;
  border-radius: 6px;
  border: 1px solid #94a3b8;
  background: white;
  color: #1e293b;
  line-height: 1;
}

.kalender :deep(.fc-heuteButton-button:hover) {
  background: #f1f5f9;
}

/* ---------- Raster ---------- */
/* Feste Tabellen-Spaltenbreiten: 7 gleich breite Spalten,
   unabhängig vom Inhalt der Zellen oder der Titellänge. */
.kalender :deep(.fc-scrollgrid),
.kalender :deep(table) {
  table-layout: fixed;
  width: 100%;
}

.kalender :deep(.fc-col-header-cell),
.kalender :deep(.fc-daygrid-day) {
  width: calc(100% / 7);
}

/* Zellenhöhe stabil halten, egal wie viel Text/Events drin ist */
.kalender :deep(.fc-daygrid-day-frame) {
  min-height: 5.5rem;
  box-sizing: border-box;
}

/* ---------- Hover NUR für Tage des aktuellen Monats ---------- */
.kalender :deep(.fc-daygrid-day:not(.fc-day-other):hover .fc-daygrid-day-frame) {
  background-color: #e5e7eb;
  cursor: pointer;
  transition: background-color 0.1s ease;
}

/* Fremdmonats-Tage bewusst NICHT grau hovern lassen */
.kalender :deep(.fc-day-other .fc-daygrid-day-frame:hover) {
  background-color: transparent;
}

/* ---------- Mobile Anpassung ---------- */
@media (max-width: 600px) {
  .kalender-seite {
    padding: 0 0.5rem;
  }

  .kalender :deep(.fc-daygrid-day-frame) {
    min-height: 3.5rem;
  }

  .kalender :deep(.fc-daygrid-day-number) {
    font-size: 0.8rem;
    padding: 2px 4px;
  }

  .kalender :deep(.fc-prev-button),
  .kalender :deep(.fc-next-button),
  .kalender :deep(.fc-heuteButton-button) {
    width: 2rem;
    height: 2rem;
    font-size: 0.85rem;
  }
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.fenster {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  min-width: 260px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.fenster label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}
.fenster label input[type='text'] {
  flex: 1;
  min-width: 0;
  padding: 0.35rem 0.5rem;
  box-sizing: border-box;
}
.farbauswahl {
  display: flex;
  gap: 0.4rem;
}
.farbknopf {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  border: 2px solid transparent;
  padding: 0;
  cursor: pointer;
}
.farbknopf.aktiv {
  border-color: #1e293b;
}
.knoepfe {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
/* Löschen-Button an den linken Rand schieben, Abbrechen/Speichern bleiben rechts */
.knoepfe .loeschen {
  margin-right: auto;
  background: white;
  border: 1px solid #dc2626;
  color: #dc2626;
  border-radius: 4px;
}
.knoepfe .loeschen:hover {
  background: #fef2f2;
}
button {
  padding: 0.5rem 1rem;
  cursor: pointer;
}
.primaer {
  background: #f59e0b;
  border: none;
  color: white;
  border-radius: 4px;
}
.fehler {
  color: #dc2626;
  margin: 0;
}
</style>
