import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabaseClient'

// Wandelt eine Zeile aus Supabase (snake_case, Zeit mit Sekunden)
// in unser Termin-Format im Frontend um (camelCase, HH:MM)
function vonSupabase(row) {
  return {
    id: row.id,
    datum: row.datum,
    name: row.name,
    vonZeit: row.von_zeit.slice(0, 5),
    bisZeit: row.bis_zeit.slice(0, 5)
  }
}

export const useTermineStore = defineStore('termine', () => {
  const termine = ref([])
  const laedt = ref(false)
  const fehler = ref('')

  let kanal = null

  // Einmalig alle Termine aus der Datenbank laden
  async function laden() {
    laedt.value = true
    fehler.value = ''

    const { data, error } = await supabase
      .from('termine')
      .select('*')
      .order('datum', { ascending: true })

    if (error) {
      fehler.value = error.message
    } else {
      termine.value = data.map(vonSupabase)
    }
    laedt.value = false
  }

  async function anlegen({ datum, name, vonZeit, bisZeit }) {
    const { data, error } = await supabase
      .from('termine')
      .insert({ datum, name, von_zeit: vonZeit, bis_zeit: bisZeit })
      .select()
      .single()

    if (error) {
      fehler.value = error.message
      return
    }
    termine.value.push(vonSupabase(data))
  }

  async function aktualisieren(id, { name, vonZeit, bisZeit }) {
    const { data, error } = await supabase
      .from('termine')
      .update({ name, von_zeit: vonZeit, bis_zeit: bisZeit })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      fehler.value = error.message
      return
    }
    const index = termine.value.findIndex((t) => t.id === id)
    if (index !== -1) termine.value[index] = vonSupabase(data)
  }

  async function loeschen(id) {
    const { error } = await supabase.from('termine').delete().eq('id', id)

    if (error) {
      fehler.value = error.message
      return
    }
    termine.value = termine.value.filter((t) => t.id !== id)
  }

  // Live-Updates von anderen Geräten empfangen, solange die App offen ist
  function liveSyncStarten() {
    if (kanal) return

    kanal = supabase
      .channel('termine-aenderungen')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'termine' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const existiertSchon = termine.value.some((t) => t.id === payload.new.id)
            if (!existiertSchon) termine.value.push(vonSupabase(payload.new))
          } else if (payload.eventType === 'UPDATE') {
            const index = termine.value.findIndex((t) => t.id === payload.new.id)
            if (index !== -1) termine.value[index] = vonSupabase(payload.new)
          } else if (payload.eventType === 'DELETE') {
            termine.value = termine.value.filter((t) => t.id !== payload.old.id)
          }
        }
      )
      .subscribe()
  }

  function liveSyncStoppen() {
    if (kanal) {
      supabase.removeChannel(kanal)
      kanal = null
    }
  }

  return {
    termine,
    laedt,
    fehler,
    laden,
    anlegen,
    aktualisieren,
    loeschen,
    liveSyncStarten,
    liveSyncStoppen
  }
})
