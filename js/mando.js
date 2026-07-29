import { supabase } from './supabase.js';

const pantallaIngreso = document.getElementById('pantalla-ingreso');
const pantallaEspera = document.getElementById('pantalla-espera');
const controlDiccionario = document.getElementById('control-diccionario');
const controlVotacion = document.getElementById('control-votacion');
const contenedorBotones = document.getElementById('contenedor-botones-voto');

const textoEspera = document.getElementById('texto-espera');
const btnDirectorArrancar = document.getElementById('btn-director-arrancar');
const mensajeEsperaVoto = document.getElementById('mensaje-espera-voto');

const inputPin = document.getElementById('input-pin');
const inputNombre = document.getElementById('input-nombre');
const btnUnirse = document.getElementById('btn-unirse');
const mensajeError = document.getElementById('mensaje-error');

const btnMandarChamuyo = document.getElementById('btn-mandar-chamuyo');
const inputDefinicion = document.getElementById('input-definicion');

let canalSala = null;
let nombreActual = "";
let esDirector = false;
let miIdTemp = ""; // ID único temporal para el proceso de validación

inputPin.addEventListener('input', function() { this.value = this.value.toUpperCase(); });
btnUnirse.addEventListener('click', unirseASala);

async function unirseASala() {
    const pin = inputPin.value.trim();
    nombreActual = inputNombre.value.trim();

    if (pin.length !== 4 || !nombreActual) { mensajeError.innerText = "Llená los datos bien."; return; }

    btnUnirse.innerText = "Conectando...";
    btnUnirse.disabled = true;

    const { data, error } = await supabase.from('Sala').select('*').eq('pin', pin).single(); 

    if (error || !data) {
        mensajeError.innerText = "La sala no existe.";
        btnUnirse.innerText = "Entrar a la Sala";
        btnUnirse.disabled = false;
        return;
    }
    
    // Generamos un ID random para que el Host sepa a quién le contesta
    miIdTemp = Math.random().toString(36).substring(2, 9);
    conectarWebSocket(pin, nombreActual);
}

function conectarWebSocket(pin, nombre) {
    canalSala = supabase.channel(`sala-${pin}`);

    canalSala
        .on('broadcast', { event: 'rechazo_unirse' }, (mensaje) => {
            // Si el host rebota nuestra ID temporal, mostramos error
            if (mensaje.payload.id_temp === miIdTemp) {
                mensajeError.innerText = "Ese nombre ya está en uso. Elegí otro.";
                btnUnirse.innerText = "Entrar a la Sala";
                btnUnirse.disabled = false;
                supabase.removeChannel(canalSala); // Cortamos la conexión
            }
        })
        .on('broadcast', { event: 'aceptacion_unirse' }, (mensaje) => {
            // Si el host nos da luz verde
            if (mensaje.payload.id_temp === miIdTemp) {
                pantallaIngreso.classList.add('oculto');
                pantallaEspera.classList.remove('oculto');
            }
        })
        .on('broadcast', { event: 'asignar_director' }, (mensaje) => {
            if (nombre === mensaje.payload.director) {
                esDirector = true;
                btnDirectorArrancar.classList.remove('oculto');
                textoEspera.innerText = "Sos el VIP. Arrancá cuando estén todos.";
            }
        })
        .on('broadcast', { event: 'iniciar_diccionario' }, (mensaje) => {
            const { palabra, juez } = mensaje.payload;
            
            pantallaEspera.classList.add('oculto');
            controlVotacion.classList.add('oculto');
            controlDiccionario.classList.remove('oculto');
            
            document.getElementById('dic-palabra').innerText = palabra;
            
            if (nombre === juez) {
                document.getElementById('dic-instruccion').innerText = "Sos el Comelibros. Esperá a que los demás inventen algo.";
                document.getElementById('dic-input-container').classList.add('oculto');
            } else {
                document.getElementById('dic-instruccion').innerText = "Escribí algo formal para engañar al Comelibros.";
                document.getElementById('dic-input-container').classList.remove('oculto');
                inputDefinicion.value = ""; 
            }
        })
        .on('broadcast', { event: 'fase_votacion' }, (mensaje) => {
            const { opciones, juez } = mensaje.payload;
            controlDiccionario.classList.add('oculto');
            controlVotacion.classList.remove('oculto');
            
            contenedorBotones.style.display = 'grid';
            contenedorBotones.style.gridTemplateColumns = 'repeat(2, 1fr)';
            contenedorBotones.style.gap = '15px';
            contenedorBotones.innerHTML = ''; 

            if (nombre === juez) {
                mensajeEsperaVoto.classList.add('oculto');
                const letras = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
                
                opciones.forEach((opcion, index) => {
                    const btn = document.createElement('button');
                    btn.innerText = letras[index];
                    
                    btn.style.cssText = `
                        background-color: #e67e22; color: #fff; font-weight: 900; font-size: 3.5rem; border-radius: 15px; border: none; cursor: pointer; aspect-ratio: 1 / 1; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 15px rgba(0,0,0,0.3); transition: transform 0.1s;
                    `;
                    
                    btn.addEventListener('mousedown', () => btn.style.transform = 'scale(0.95)');
                    btn.addEventListener('mouseup', () => btn.style.transform = 'scale(1)');
                    
                    btn.addEventListener('click', () => {
                        canalSala.send({ type: 'broadcast', event: 'voto_emitido', payload: opcion });
                        contenedorBotones.innerHTML = '';
                        contenedorBotones.style.display = 'block'; 
                        mensajeEsperaVoto.innerText = "Voto enviado, mirá la pantalla.";
                        mensajeEsperaVoto.classList.remove('oculto');
                    });
                    contenedorBotones.appendChild(btn);
                });
            } else {
                contenedorBotones.style.display = 'block';
                mensajeEsperaVoto.innerText = "Esperando que el Comelibros decida...";
                mensajeEsperaVoto.classList.remove('oculto');
            }
        })
        .on('broadcast', { event: 'fin_de_ronda' }, () => {
            controlDiccionario.classList.add('oculto');
            controlVotacion.classList.add('oculto');
            pantallaEspera.classList.remove('oculto');

            if (esDirector) {
                btnDirectorArrancar.innerText = "Siguiente Ronda";
                btnDirectorArrancar.classList.remove('oculto');
                textoEspera.innerText = "Cuando estén listos, mandale a la siguiente.";
            } else {
                textoEspera.innerText = "Mirá los resultados en la pantalla...";
                btnDirectorArrancar.classList.add('oculto');
            }
        })
        .subscribe((estado) => {
            if (estado === 'SUBSCRIBED') {
                // En vez de entrar automáticamente, pedimos permiso al Host
                canalSala.send({ 
                    type: 'broadcast', 
                    event: 'solicitar_unirse', 
                    payload: { nombre: nombre, id_temp: miIdTemp } 
                });
            }
        });
}

btnDirectorArrancar.addEventListener('click', () => {
    canalSala.send({ type: 'broadcast', event: 'orden_arrancar' });
    btnDirectorArrancar.classList.add('oculto');
    textoEspera.innerText = "Mirá la pantalla principal...";
});

btnMandarChamuyo.addEventListener('click', () => {
    const definicionInventada = inputDefinicion.value.trim();
    if (!definicionInventada) return;

    canalSala.send({
        type: 'broadcast',
        event: 'respuesta_enviada',
        payload: { jugador: nombreActual, definicion: definicionInventada }
    });

    document.getElementById('dic-input-container').classList.add('oculto');
    document.getElementById('dic-instruccion').innerText = "¡Enviado! Esperando a que terminen los demás...";
});