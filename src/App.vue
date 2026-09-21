<script setup>
import Kalender from './components/Kalender.vue'
</script>

<template>
  <div class="app-inhalt">
    <h1 class="titel">Mein Kalender</h1>
    <Kalender />
  </div>
</template>

<style scoped>
/* Eigener Block, der Titel + Kalender untereinander anordnet -
   unabhängig davon, was #app/body global vorgeben (z.B. die
   Standard-Vite-CSS, die #app oft auf "display: flex" setzt). */
.app-inhalt {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.titel {
  width: 100%;
  max-width: 960px;
  box-sizing: border-box;
  margin: 1.5rem 1rem 1rem;
  text-align: left;
}
</style>