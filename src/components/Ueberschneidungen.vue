<script setup>
import { useTermineStore } from '@/stores/termine'

const termineStore = useTermineStore()
</script>

<template>
  <div class="ueberschneidungen">
    <h3>Überschneidungen</h3>

    <p v-if="termineStore.tageMitUeberschneidung.length === 0" class="leer">
      Keine Terminüberschneidungen.
    </p>

    <ul v-else class="tage-liste">
      <li v-for="tag in termineStore.tageMitUeberschneidung" :key="tag.datum">
        <strong>{{ tag.datum }}</strong>
        <ul class="termin-liste">
          <li v-for="termin in tag.termine" :key="termin.id">
            <span class="farbpunkt" :style="{ backgroundColor: termin.farbe }"></span>
            {{ termin.name }}: {{ termin.vonZeit }}–{{ termin.bisZeit }} Uhr
          </li>
        </ul>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.ueberschneidungen {
  width: 260px;
  flex-shrink: 0;
  box-sizing: border-box;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
}

.ueberschneidungen h3 {
  margin: 0 0 0.75rem;
  font-size: 1rem;
  font-weight: 700;
}

.leer {
  color: #64748b;
  font-size: 0.9rem;
  margin: 0;
}

.tage-liste {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.termin-liste {
  list-style: none;
  margin: 0.25rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.9rem;
}

.farbpunkt {
  display: inline-block;
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  margin-right: 0.4rem;
}

@media (max-width: 780px) {
  .ueberschneidungen {
    width: 100%;
  }
}
</style>
