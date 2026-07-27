const bancoFrases = [
    "Lo peor que le podés decir a tu dentista en medio de una revisión",
    "Un nombre poco convincente para una marca de preservativos",
    "La verdadera razón por la que los dinosaurios se extinguieron",
    "Algo que jamás deberías gritar en medio de un velorio",
    "Una pésima excusa para llegar tres horas tarde al laburo",
    "El peor superpoder que te podría tocar",
    "Un título que jamás le pondrías a un libro de autoayuda",
    "Lo primero que pensaría un perro si pudiera hablar por cinco minutos",
    "La peor combinacion",
    "Sabes que tu ex te extraña cuando...",
    "Sabor de empanada que debería ser ilegal",
    "Que New York ni Paris, aguante",
    "Esa cosa rara que encontrás abajo del colchón cuando vas a ordenar la pieza",
    "Lo primero que pensás cuando escuchás que tu pareja te dice 'tenemos que hablar'",
    "Frase bien de camionero"
];

let jugadores = [];
let puntajes = {};
let rondaActual = 0;
let fraseActual = "";
let juezActualIndex = 0;
let escritores = [];
let turnoEscritorIndex = 0;
let respuestasRonda = []; 
let seleccionPodioTemp = []; 

// DOM Elements
const pantallaSetup = document.getElementById('pantalla-setup');
const pantallaPase = document.getElementById('pantalla-pase');
const pantallaEscritura = document.getElementById('pantalla-escritura');
const pantallaJuez = document.getElementById('pantalla-juez');
const pantallaLeaderboard = document.getElementById('pantalla-leaderboard');

const inputNombre = document.getElementById('input-nombre');
const btnAgregar = document.getElementById('btn-agregar');
const listaJugadores = document.getElementById('lista-jugadores');
const btnIniciar = document.getElementById('btn-iniciar');
const contadorMinimo = document.getElementById('contador-minimo');

const tituloPase = document.getElementById('titulo-pase');
const textoAvisoPase = document.getElementById('texto-aviso-pase');
const nombreSiguiente = document.getElementById('nombre-siguiente');
const btnListoPase = document.getElementById('btn-listo-pase');

const turnoEscritor = document.getElementById('turno-escritor');
const textoConsignaEscritura = document.getElementById('texto-consigna-escritura');
const inputRespuesta = document.getElementById('input-respuesta');
const btnEnviarRespuesta = document.getElementById('btn-enviar-respuesta');

const nombreJuez = document.getElementById('nombre-juez');
const textoConsignajuez = document.getElementById('texto-consigna-juez');
const contenedorTarjetas = document.getElementById('contenedor-tarjetas');
const panelPodioInfo = document.getElementById('panel-podio-info');
const textoInstruccionPodio = document.getElementById('texto-instruccion-podio');
const btnConfirmarPodio = document.getElementById('btn-confirmar-podio');

const listaLeaderboard = document.getElementById('lista-leaderboard');
const btnSiguienteRonda = document.getElementById('btn-siguiente-ronda');

// --- 1. SETUP DE JUGADORES ---
btnAgregar.addEventListener('click', () => {
    agregarJugador();
});

inputNombre.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        agregarJugador();
    }
});

function agregarJugador() {
    let nombre = inputNombre.value.trim();
    if (nombre && !jugadores.includes(nombre)) {
        jugadores.push(nombre);
        puntajes[nombre] = 0;
        inputNombre.value = '';
        actualizarListaJugadores();
    }
}

function actualizarListaJugadores() {
    listaJugadores.innerHTML = '';
    jugadores.forEach((j, index) => {
        let li = document.createElement('li');
        li.innerHTML = `
            <span>${j}</span>
            <button class="btn-eliminar-jugador material-symbols-outlined" onclick="eliminarJugador(${index})">close</button>
        `;
        listaJugadores.appendChild(li);
    });

    let faltantes = 3 - jugadores.length;
    if (faltantes > 0) {
        contadorMinimo.innerText = `Faltan ${faltantes} jugadores más (Mínimo 3)`;
        btnIniciar.disabled = true;
    } else {
        contadorMinimo.innerText = `Listos para jugar (${jugadores.length} jugadores)`;
        btnIniciar.disabled = false;
    }
}

window.eliminarJugador = function(index) {
    let eliminado = jugadores.splice(index, 1)[0];
    delete puntajes[eliminado];
    actualizarListaJugadores();
};

btnIniciar.addEventListener('click', () => {
    rondaActual = 0;
    juezActualIndex = 0;
    iniciarRonda();
});

// --- 2. CONTROL DE RONDA Y ROLES ---
function iniciarRonda() {
    fraseActual = bancoFrases[Math.floor(Math.random() * bancoFrases.length)];
    let juez = jugadores[juezActualIndex];
    
    escritores = jugadores.filter(j => j !== juez);
    turnoEscritorIndex = 0;
    respuestasRonda = [];
    seleccionPodioTemp = [];

    pantallaLeaderboard.classList.add('oculto');
    mostrarPantallaPase(escritores[0], "Escribir respuesta secreta");
}

function mostrarPantallaPase(siguientePersona, accionTexto) {
    pantallaSetup.classList.add('oculto');
    pantallaEscritura.classList.add('oculto');
    pantallaJuez.classList.add('oculto');
    pantallaLeaderboard.classList.add('oculto');
    
    pantallaPase.classList.remove('oculto');
    tituloPase.innerText = `${siguientePersona}`;
    textoAvisoPase.innerText = `${accionTexto}`;
    nombreSiguiente.innerText = siguientePersona;
}

btnListoPase.addEventListener('click', () => {
    pantallaPase.classList.add('oculto');
    
    if (turnoEscritorIndex < escritores.length) {
        pantallaEscritura.classList.remove('oculto');
        let escritorActual = escritores[turnoEscritorIndex];
        turnoEscritor.innerText = escritorActual;
        textoConsignaEscritura.innerText = fraseActual;
        inputRespuesta.value = '';
    } else {
        pantallaJuez.classList.remove('oculto');
        let juez = jugadores[juezActualIndex];
        nombreJuez.innerText = juez;
        textoConsignajuez.innerText = fraseActual;
        renderizarTarjetasJuez();
    }
});

// --- 3. ESCRITURA DE RESPUESTAS ---
btnEnviarRespuesta.addEventListener('click', () => {
    let texto = inputRespuesta.value.trim();
    if (!texto) return;

    let escritorActual = escritores[turnoEscritorIndex];
    respuestasRonda.push({
        autor: escritorActual,
        texto: texto,
        revelada: false,
        puntosAsignados: 0
    });

    turnoEscritorIndex++;

    if (turnoEscritorIndex < escritores.length) {
        mostrarPantallaPase(escritores[turnoEscritorIndex], "Escribir respuesta secreta");
    } else {
        let juez = jugadores[juezActualIndex];
        mostrarPantallaPase(juez, "Evaluar y puntuar respuestas");
    }
});

// --- 4. FASE DEL JUEZ ---
function renderizarTarjetasJuez() {
    contenedorTarjetas.innerHTML = '';

    respuestasRonda.forEach((resp, index) => {
        let tarjeta = document.createElement('div');
        tarjeta.classList.add('tarjeta-respuesta');
        
        if (resp.revelada) {
            tarjeta.classList.add('revelada');
            tarjeta.innerHTML = `<span>${resp.texto}</span>`;
            
            if (resp.puntosAsignados > 0) {
                let badge = document.createElement('span');
                badge.classList.add('badge-puntos');
                badge.innerText = `+${resp.puntosAsignados} pts`;
                tarjeta.appendChild(badge);
                
                if (resp.puntosAsignados === 3) tarjeta.classList.add('seleccionada-3');
                if (resp.puntosAsignados === 2) tarjeta.classList.add('seleccionada-2');
                if (resp.puntosAsignados === 1) tarjeta.classList.add('seleccionada-1');
            }
        } else {
            tarjeta.innerHTML = `<span>Tocar para revelar respuesta ${index + 1}</span>`;
        }

        tarjeta.addEventListener('click', () => {
            if (!resp.revelada) {
                // Revelar tarjeta
                resp.revelada = true;
                renderizarTarjetasJuez();
                verificarSiTodasReveladas();
            } else if (seleccionPodioTemp.length < 3 && !seleccionPodioTemp.includes(index) && resp.puntosAsignados === 0) {
                // Asignar puntos de podio (3, 2, 1)
                let puntosOtorgar = 3 - seleccionPodioTemp.length; 
                resp.puntosAsignados = puntosOtorgar;
                seleccionPodioTemp.push(index);
                renderizarTarjetasJuez();
                actualizarEstadoPodio();
            }
        });

        contenedorTarjetas.appendChild(tarjeta);
    });

    verificarSiTodasReveladas();
}

function verificarSiTodasReveladas() {
    let todasReveladas = respuestasRonda.every(r => r.revelada);
    if (todasReveladas) {
        panelPodioInfo.classList.remove('oculto');
        actualizarEstadoPodio();
    } else {
        panelPodioInfo.classList.add('oculto');
    }
}

function actualizarEstadoPodio() {
    let seleccionados = seleccionPodioTemp.length;
    if (seleccionados === 0) {
        textoInstruccionPodio.innerText = "Toca la respuesta que se lleva 3 Puntos";
        btnConfirmarPodio.disabled = true;
    } else if (seleccionados === 1) {
        textoInstruccionPodio.innerText = "Toca la respuesta que se lleva 2 Puntos";
        btnConfirmarPodio.disabled = true;
    } else if (seleccionados === 2) {
        textoInstruccionPodio.innerText = "Toca la respuesta que se lleva 1 Punto";
        btnConfirmarPodio.disabled = true;
    } else {
        textoInstruccionPodio.innerText = "Podio completo";
        btnConfirmarPodio.disabled = false;
    }
}

// Evento único para el botón de confirmar podio
btnConfirmarPodio.onclick = () => {
    respuestasRonda.forEach(resp => {
        if (resp.puntosAsignados > 0) {
            puntajes[resp.autor] += resp.puntosAsignados;
        }
    });

    mostrarLeaderboard();
};

// --- 5. LEADERBOARD Y ROTACIÓN ---
function mostrarLeaderboard() {
    pantallaJuez.classList.add('oculto');
    pantallaLeaderboard.classList.remove('oculto');

    let jugadoresOrdenados = [...jugadores].sort((a, b) => puntajes[b] - puntajes[a]);

    listaLeaderboard.innerHTML = '';
    jugadoresOrdenados.forEach((j, index) => {
        let div = document.createElement('div');
        div.classList.add('leaderboard-item');
        div.innerHTML = `<span>${index + 1}. ${j}</span> <strong>${puntajes[j]} pts</strong>`;
        listaLeaderboard.appendChild(div);
    });
}

btnSiguienteRonda.onclick = () => {
    juezActualIndex = (juezActualIndex + 1) % jugadores.length;
    iniciarRonda();
};