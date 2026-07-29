import { supabase } from './supabase.js';

const pantallaSeleccion = document.getElementById('pantalla-seleccion');
const pantallaLobby = document.getElementById('pantalla-lobby');
const tituloJuego = document.getElementById('titulo-juego');
const pinDisplay = document.getElementById('pin-display');
const contenedorJugadores = document.getElementById('jugadores-conectados');
const botonesJuego = document.querySelectorAll('.btn-juego');

let salaPin = "";
let juegoSeleccionado = "";
let jugadores = [];
let puntajes = {};
let canalSalaGlobal = null;

const palabrasDiccionario = [
    { palabra: "Garlito", definicion: "Trampa o red para pescar. Engaño o trampa." },
    { palabra: "Zaragata", definicion: "Alboroto, ruido o riña." },
    { palabra: "Jipiar", definicion: "Cantar con voz semejante a un gemido." },
    { palabra: "Nefelibata", definicion: "Persona soñadora que no se apercibe de la realidad." },
    { palabra: "Cachivache", definicion: "Cosa rota o arrinconada por inútil." },
    { palabra: "Jitanjáfora", definicion: "Texto sin sentido, creado solo por su sonoridad." }
];

let palabraActual = {};
let juezActual = "";
let respuestasDiccionario = [];

botonesJuego.forEach(boton => {
    boton.addEventListener('click', () => {
        juegoSeleccionado = boton.getAttribute('data-juego');
        const nombreJuego = boton.querySelector('.texto').innerText;
        
        pantallaSeleccion.classList.add('oculto');
        pantallaLobby.classList.remove('oculto');
        tituloJuego.innerText = `Sala de: ${nombreJuego}`;
        crearSala();
    });
});

function generarPIN() {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let resultado = '';
    for (let i = 0; i < 4; i++) resultado += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    return resultado;
}

async function crearSala() {
    salaPin = generarPIN();
    pinDisplay.innerText = salaPin;

    const { error } = await supabase.from('Sala').insert([{ pin: salaPin, juego: juegoSeleccionado }]);
    if (error) { pinDisplay.innerText = "ERROR"; return; }
    escucharJugadores();
}

function escucharJugadores() {
    canalSalaGlobal = supabase.channel(`sala-${salaPin}`);

    canalSalaGlobal
        .on('broadcast', { event: 'solicitar_unirse' }, (mensaje) => {
            const { nombre, id_temp } = mensaje.payload;

            // Validación de nombre duplicado (ignorando mayúsculas/minúsculas)
            const nombreExiste = jugadores.some(j => j.toLowerCase() === nombre.toLowerCase());

            if (nombreExiste) {
                // Si existe, lo rebotamos
                canalSalaGlobal.send({
                    type: 'broadcast',
                    event: 'rechazo_unirse',
                    payload: { id_temp: id_temp }
                });
            } else {
                // Si está libre, lo dejamos pasar y le avisamos que entró
                jugadores.push(nombre);
                puntajes[nombre] = 0;
                actualizarPantallaJugadores(nombre);

                canalSalaGlobal.send({
                    type: 'broadcast',
                    event: 'aceptacion_unirse',
                    payload: { id_temp: id_temp, nombre: nombre }
                });

                // Si es el primero en entrar, le damos el rol de Director
                if (jugadores.length === 1) {
                    canalSalaGlobal.send({
                        type: 'broadcast',
                        event: 'asignar_director',
                        payload: { director: nombre }
                    });
                }
            }
        })
        .on('broadcast', { event: 'orden_arrancar' }, () => {
            if (juegoSeleccionado === 'diccionario') iniciarRondaDiccionario();
        })
        .on('broadcast', { event: 'respuesta_enviada' }, (mensaje) => {
            respuestasDiccionario.push(mensaje.payload);
            const puntos = document.querySelectorAll('.punto:not(.listo)');
            if(puntos.length > 0) puntos[0].classList.add('listo');

            if(respuestasDiccionario.length >= (jugadores.length - 1)) mostrarFaseVotacion();
        })
        .on('broadcast', { event: 'voto_emitido' }, (mensaje) => {
            mostrarResultadoFinal(mensaje.payload);
        })
        .subscribe();
}

function actualizarPantallaJugadores(nombre) {
    const div = document.createElement('div');
    div.classList.add('jugador-chip');
    div.innerText = nombre;
    contenedorJugadores.appendChild(div);
}

function iniciarRondaDiccionario() {
    palabraActual = palabrasDiccionario[Math.floor(Math.random() * palabrasDiccionario.length)];
    juezActual = jugadores[Math.floor(Math.random() * jugadores.length)];
    respuestasDiccionario = []; 

    canalSalaGlobal.send({
        type: 'broadcast',
        event: 'iniciar_diccionario',
        payload: { palabra: palabraActual.palabra, juez: juezActual }
    });

    let puntosHTML = '';
    for(let i = 0; i < (jugadores.length - 1); i++){ puntosHTML += '<div class="punto"></div>'; }

    pantallaLobby.innerHTML = `
        <h2 class="subtitulo mb-10" style="color: #e67e22;">Fase de Escritura</h2>
        <p class="texto-ayuda mb-20" style="font-size: 1.5rem;">El Comelibros es: <strong>${juezActual}</strong></p>
        <h3 class="texto-ayuda">Esperando mentiras...</h3>
        <div id="contenedor-puntos" class="puntos-container">${puntosHTML}</div>
    `;
}

function mostrarFaseVotacion() {
    respuestasDiccionario.push({ jugador: "El Sistema", definicion: palabraActual.definicion, esLaPosta: true });
    respuestasDiccionario.sort(() => Math.random() - 0.5);

    canalSalaGlobal.send({
        type: 'broadcast',
        event: 'fase_votacion',
        payload: { opciones: respuestasDiccionario, juez: juezActual }
    });

    const letras = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    let definicionesHTML = '<div class="caja-scroll" style="display: flex; flex-direction: column; gap: 8px; text-align: left; margin-top: 15px;">';
    
    respuestasDiccionario.forEach((resp, index) => {
        definicionesHTML += `
            <div style="background-color: #1a1a1a; padding: 10px 20px; border-radius: 12px; border-left: 5px solid #e67e22; font-size: 1.1rem; color: #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
                <strong style="color: #e67e22; margin-right: 10px; font-size: 1.3rem;">${letras[index]}.</strong> ${resp.definicion}
            </div>
        `;
    });
    definicionesHTML += '</div>';

    pantallaLobby.innerHTML = `
        <h2 class="subtitulo" style="color: #e67e22; margin: 0;">Todo listo</h2>
        <h1 class="pin-gigante" style="font-family: 'Georgia', serif; text-transform: lowercase; background: none; box-shadow: none; padding: 0; margin: 15px 0 25px 0; line-height: 1;">${palabraActual.palabra}</h1>
        <p class="texto-ayuda" style="margin: 0 0 15px 0; font-size: 1.2rem;">El Comelibros (${juezActual}) está leyendo estas opciones...</p>
        ${definicionesHTML}
    `;
}

function mostrarResultadoFinal(voto) {
    let titulo = "", color = "", subtitulo = "";

    if (voto.esLaPosta) {
        titulo = "EL COMELIBROS SABE"; color = "#2ecc71"; subtitulo = "Eligió la definición real."; puntajes[juezActual] += 1; 
    } else {
        titulo = "SE COMIÓ EL CHAMUYO"; color = "#e74c3c"; subtitulo = `Eligió la mentira de <strong>${voto.jugador}</strong>`; puntajes[voto.jugador] += 1; 
    }

    let scoreboardHTML = `
        <div class="caja-scroll" style="margin-top: 20px; padding: 15px; background: #111; border-radius: 15px;">
            <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px;">
                ${Object.entries(puntajes).map(([jug, pts]) => `
                    <div style="background: #2a2a2a; padding: 8px 15px; border-radius: 10px; font-weight: bold; font-size: 1.1rem; border: 2px solid ${jug === juezActual ? color : '#555'}">
                        ${jug}: <span style="color: #e67e22;">${pts} pts</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    pantallaLobby.innerHTML = `
        <h1 class="pin-gigante" style="background: none; box-shadow: none; color: ${color}; padding: 0; font-size: 3.5rem; margin: 0; line-height: 1;">${titulo}</h1>
        <h2 class="subtitulo" style="margin: 15px 0 20px 0;">${subtitulo}</h2>
        
        <div style="max-width: 600px; margin: 0 auto; background: #222; padding: 20px; border-radius: 15px; box-shadow: inset 0 0 10px rgba(0,0,0,0.5);">
            <h3 style="color: #e67e22; font-size: 1.8rem; margin: 0 0 10px 0;">${palabraActual.palabra}</h3>
            <p style="font-style: italic; font-size: 1.2rem; margin: 0;">"${palabraActual.definicion}"</p>
        </div>
        ${scoreboardHTML}
    `;

    canalSalaGlobal.send({ type: 'broadcast', event: 'fin_de_ronda' });
}

// Limpieza automática
async function destruirSala() {
    if (salaPin) {
        await supabase.from('Sala').delete().eq('pin', salaPin);
        salaPin = ""; 
    }
}
window.addEventListener('beforeunload', destruirSala);
window.addEventListener('pagehide', destruirSala);