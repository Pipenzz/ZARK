// Importamos Supabase directamente desde el CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Reemplazá esto con los datos de tu proyecto
const supabaseUrl = 'https://mrprkrkdbdawcmpjzbon.supabase.co'
const supabaseKey = 'sb_publishable_OGrli4zSRnLPLB1hvMcMmA_mntVEK4v'

// Creamos la conexión
export const supabase = createClient(supabaseUrl, supabaseKey)

// Un mensajito en la consola para confirmar que enganchó bien
console.log("¡Conexión con Supabase lista!", supabase)