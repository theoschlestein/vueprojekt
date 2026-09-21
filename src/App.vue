<script setup>
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'

const calendarOptions = {
  plugins: [dayGridPlugin],
  initialView: 'dayGridMonth',
  events: [
    { title: 'Erster Termin', start: '2026-09-22' },
    { title: 'Zweiter Termin', start: '2026-09-25' }
  ]
}
</script>

<template>
  <FullCalendar :options="calendarOptions" />
</template>