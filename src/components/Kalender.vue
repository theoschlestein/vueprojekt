<script setup>
import { ref, computed } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'

const termine = ref([])

const dialogOffen = ref(false)
const gewaehltesDatum = ref('')
const vonZeit = ref('09:00')
const bisZeit = ref('17:00')
const fehler = ref('')

function tagGeklickt(info) {
  gewaehltesDatum.value = info.dateStr
  vonZeit.value = '09:00'
  bisZeit.value = '17:00'
  fehler.value = ''
  dialogOffen.value = true
}

function speichern() {
  if (bisZeit.value <= vonZeit.value) {
    fehler.value = 'Die Endzeit muss nach der Startzeit liegen.'
    return
  }
  termine.value.push({
    title: `${vonZeit.value}–${bisZeit.value} Uhr`,
    start: `${gewaehltesDatum.value}T${vonZeit.value}:00`,
    end: `${gewaehltesDatum.value}T${bisZeit.value}:00`
  })
  dialogOffen.value = false
}

function abbrechen() {
  dialogOffen.value = false
}

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  dateClick: tagGeklickt,
  events: termine.value
}))
</script>

<template>
  <div>
    <FullCalendar :options="calendarOptions" />

    <!-- Kein Hintergrund mehr, nur das schwebende Fenster -->
    <div v-if="dialogOffen" class="fenster">
      <h3>Zeit für den {{ gewaehltesDatum }}</h3>

      <label>
        Von:
        <input type="time" v-model="vonZeit" />
      </label>

      <label>
        Bis:
        <input type="time" v-model="bisZeit" />
      </label>

      <p v-if="fehler" class="fehler">{{ fehler }}</p>

      <div class="knoepfe">
        <button @click="abbrechen">Abbrechen</button>
        <button @click="speichern" class="primaer">Speichern</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fenster {
  position: fixed;
  top: 1rem;
  right: 1rem;
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  min-width: 260px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  z-index: 1000;
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
.knoepfe {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
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
:deep(.fc-daygrid-day:hover) {
  background-color: #e5e7eb;
  cursor: pointer;
}
.fehler {
  color: #dc2626;
  margin: 0;
}
</style>