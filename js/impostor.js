// --- ELEMENTOS DE FASES ---
const faseConfig = document.getElementById('fase-configuracion');
const faseRoles = document.getElementById('fase-roles');
const faseCronometro = document.getElementById('fase-cronometro');
const faseResultados = document.getElementById('fase-resultados');

// --- CONFIGURACIÓN ---
const inputJugador = document.getElementById('input-jugador');
const listaJugadoresEl = document.getElementById('lista-jugadores');
const btnAgregarJugador = document.getElementById('btn-agregar-jugador');
const inputImpostores = document.getElementById('input-impostores');
const inputTiempo = document.getElementById('input-tiempo');
const selectTema = document.getElementById('select-tema');
const btnIniciar = document.getElementById('btn-iniciar');

// --- ROLES ---
const turnoDe = document.getElementById('turno-de');
const tarjetaRol = document.getElementById('tarjeta-rol');
const textoRol = document.getElementById('texto-rol');
const btnVerRol = document.getElementById('btn-ver-rol');
const btnOcultarRol = document.getElementById('btn-ocultar-rol');

// --- CRONÓMETRO Y RESULTADOS ---
const reloj = document.getElementById('reloj');
const btnRevelar = document.getElementById('btn-revelar');
const palabraRevelada = document.getElementById('palabra-revelada');
const listaImpostoresFinal = document.getElementById('lista-impostores-final');
const btnReiniciar = document.getElementById('btn-reiniciar');

// --- DATOS DEL JUEGO ---
let jugadores = [];
let rolesAsignados = []; // Array de objetos {nombre, rol, esImpostor}
let indiceJugadorActual = 0;
let palabraElegida = "";
let timerInterval;

// Diccionarios de palabras por temática
const tematicas = {
    comidas: ["Hamburguesa", "Sushi", "Milanesa", "Tacos", "Pizza", "Empanadas", "Asado", "Helado", "Fideos", "Paella", "Choripan", "Ensalada"],
    lugares: ["Playa", "Cine", "Zoológico", "Aeropuerto", "Hospital", "Supermercado", "Gimnasio", "Biblioteca", "Estadio", "Cementerio", "Circo", "Casino"],
    famosos: ["Messi", "Michael Jackson", "Shakira", "Ricardo Fort", "Brad Pitt", "Marilyn Monroe", "Cristiano Ronaldo", "Mirtha Legrand", "Batman", "Spider-Man"],
    animales: ["Perro", "Gato", "Elefante", "Tiburón", "León", "Pingüino", "Serpiente", "Delfín", "Mono", "Araña", "Caballo", "Cocodrilo"],
    profesiones: ["Médico", "Policía", "Bombero", "Maestro", "Astronauta", "Abogado", "Plomero", "Programador", "Carpintero", "Cocinero", "Peluquero", "Presidente"]
};

// ================= 1. AGREGAR JUGADORES =================
function agregarJugador() {
    const nombre = inputJugador.value.trim();
    if (nombre !== "" && !jugadores.includes(nombre)) {
        jugadores.push(nombre);
        actualizarListaJugadores();
        inputJugador.value = "";
    }
}

inputJugador.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') agregarJugador();
});
btnAgregarJugador.addEventListener('click', agregarJugador);

function actualizarListaJugadores() {
    listaJugadoresEl.innerHTML = "";
    jugadores.forEach((jugador, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${jugador}</span>
            <span class="material-symbols-outlined" style="color:#ff4757; cursor:pointer;" onclick="eliminarJugador(${index})">close</span>
        `;
        listaJugadoresEl.appendChild(li);
    });
}

window.eliminarJugador = function(index) {
    jugadores.splice(index, 1);
    actualizarListaJugadores();
};

// ================= 2. INICIAR JUEGO =================
btnIniciar.addEventListener('click', () => {
    const cantImpostores = parseInt(inputImpostores.value);
    
    if (jugadores.length < 3) {
        alert("¡Necesitan ser al menos 3 jugadores!");
        return;
    }
    if (cantImpostores >= jugadores.length) {
        alert("La cantidad de impostores no puede ser mayor o igual a los jugadores.");
        return;
    }

    // Preparar el juego
    const tema = selectTema.value;
    const listaPalabras = tematicas[tema];
    palabraElegida = listaPalabras[Math.floor(Math.random() * listaPalabras.length)];
    
    asignarRoles(cantImpostores);
    
    indiceJugadorActual = 0;
    
    // Cambiar de pantalla
    faseConfig.classList.add('oculto');
    faseRoles.classList.remove('oculto');
    prepararTurno();
});

function asignarRoles(cantImpostores) {
    // Copiamos y mezclamos el array de jugadores
    let jugadoresMezclados = [...jugadores].sort(() => Math.random() - 0.5);
    rolesAsignados = [];

    // Los primeros 'cantImpostores' de la lista mezclada son los impostores
    jugadoresMezclados.forEach((jugador, index) => {
        if (index < cantImpostores) {
            rolesAsignados.push({ nombre: jugador, rol: "IMPOSTOR", esImpostor: true });
        } else {
            rolesAsignados.push({ nombre: jugador, rol: palabraElegida, esImpostor: false });
        }
    });

    // Volvemos a mezclar rolesAsignados para que el orden de pase del celu sea aleatorio
    rolesAsignados.sort(() => Math.random() - 0.5);
}

// ================= 3. PASAR EL CELULAR =================
function prepararTurno() {
    let jugadorActual = rolesAsignados[indiceJugadorActual];
    turnoDe.innerText = `Turno de ${jugadorActual.nombre}`;
    
    tarjetaRol.classList.add('oculta');
    btnVerRol.classList.remove('oculto');
    btnOcultarRol.classList.add('oculto');
    
    textoRol.innerText = jugadorActual.rol;
    if (jugadorActual.esImpostor) {
        textoRol.classList.add('rol-impostor');
    } else {
        textoRol.classList.remove('rol-impostor');
    }
}

btnVerRol.addEventListener('click', () => {
    tarjetaRol.classList.remove('oculta');
    btnVerRol.classList.add('oculto');
    btnOcultarRol.classList.remove('oculto');
});

btnOcultarRol.addEventListener('click', () => {
    // 1. Ocultamos la tarjeta INMEDIATAMENTE al hacer clic
    tarjetaRol.classList.add('oculta');
    
    // 2. Esperamos 300ms (el tiempo exacto que tarda en desaparecer por el CSS)
    setTimeout(() => {
        indiceJugadorActual++;
        
        // 3. Recién ahora que la tarjeta es invisible, cambiamos los textos
        if (indiceJugadorActual < rolesAsignados.length) {
            prepararTurno();
        } else {
            faseRoles.classList.add('oculto');
            faseCronometro.classList.remove('oculto');
            iniciarCronometro();
        }
    }, 300); 
});

// ================= 4. CRONÓMETRO =================
function iniciarCronometro() {
    let tiempoSegundos = parseInt(inputTiempo.value) * 60;
    
    actualizarRelojUI(tiempoSegundos);
    
    timerInterval = setInterval(() => {
        tiempoSegundos--;
        actualizarRelojUI(tiempoSegundos);
        
        if (tiempoSegundos <= 0) {
            clearInterval(timerInterval);
            reloj.innerText = "¡TIEMPO!";
            reloj.style.color = "#ff4757";
        }
    }, 1000);
}

function actualizarRelojUI(segundosTotales) {
    if (segundosTotales < 0) return;
    let min = Math.floor(segundosTotales / 60);
    let seg = segundosTotales % 60;
    reloj.innerText = `${min.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;
}

// ================= 5. RESULTADOS =================
btnRevelar.addEventListener('click', () => {
    clearInterval(timerInterval);
    
    faseCronometro.classList.add('oculto');
    faseResultados.classList.remove('oculto');
    
    palabraRevelada.innerText = palabraElegida;
    
    listaImpostoresFinal.innerHTML = "";
    rolesAsignados.forEach(j => {
        if (j.esImpostor) {
            let li = document.createElement('li');
            li.innerText = j.nombre;
            listaImpostoresFinal.appendChild(li);
        }
    });
});

btnReiniciar.addEventListener('click', () => {
    // Volver a la configuración
    reloj.style.color = "#fff"; // Resetear color del reloj
    faseResultados.classList.add('oculto');
    faseConfig.classList.remove('oculto');
});