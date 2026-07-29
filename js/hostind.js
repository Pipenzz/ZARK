import { supabase } from './supabase.js';

const pantallaCrear = document.getElementById('pantalla-crear');
const pantallaLobby = document.getElementById('pantalla-lobby');
const pantallaJuegoHost = document.getElementById('pantalla-juego-host');

const inputNombre = document.getElementById('input-nombre');
const btnCrearSala = document.getElementById('btn-crear-sala');
const btnArrancarJuego = document.getElementById('btn-arrancar-juego');
const pinDisplay = document.getElementById('pin-display');
const listaJugadores = document.getElementById('lista-jugadores');
const mensajeError = document.getElementById('mensaje-error');
const botonesJuego = document.querySelectorAll('.btn-juego-ind');

let miNombre = "";
let salaPin = "";
let juegoSeleccionado = "hacker"; 
let canalSalaGlobal = null;
let jugadoresActivos = [];

botonesJuego.forEach(btn => {
    btn.addEventListener('click', () => {
        botonesJuego.forEach(b => b.classList.remove('seleccionado'));
        btn.classList.add('seleccionado');
        juegoSeleccionado = btn.getAttribute('data-juego');
    });
});

inputNombre.addEventListener('input', function() { this.value = this.value.toUpperCase(); });

function generarPIN() {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let resultado = '';
    for (let i = 0; i < 4; i++) resultado += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    return resultado;
}

btnCrearSala.addEventListener('click', async () => {
    miNombre = inputNombre.value.trim();
    if (!miNombre) { mensajeError.innerText = "Ingresá un apodo."; return; }

    btnCrearSala.innerText = "Creando...";
    btnCrearSala.disabled = true;

    salaPin = generarPIN();
    jugadoresActivos.push(miNombre);

    const { error } = await supabase.from('Sala').insert([{ pin: salaPin, juego: juegoSeleccionado }]);
    if (error) { mensajeError.innerText = "Error BD"; btnCrearSala.disabled = false; return; }

    pinDisplay.innerText = salaPin;
    pantallaCrear.classList.add('oculto');
    pantallaLobby.classList.remove('oculto');

    conectarWebSocketHost();
    actualizarListaVisual();
});

function conectarWebSocketHost() {
    canalSalaGlobal = supabase.channel(`sala-${salaPin}`);

    canalSalaGlobal
        .on('broadcast', { event: 'solicitar_unirse' }, (mensaje) => {
            const { nombre, id_temp } = mensaje.payload;
            const existe = jugadoresActivos.some(j => j.toLowerCase() === nombre.toLowerCase());

            if (existe) {
                canalSalaGlobal.send({ type: 'broadcast', event: 'rechazo_unirse', payload: { id_temp: id_temp } });
            } else {
                jugadoresActivos.push(nombre);
                actualizarListaVisual();
                canalSalaGlobal.send({ type: 'broadcast', event: 'aceptacion_unirse', payload: { id_temp: id_temp, nombre: nombre, juego: juegoSeleccionado } });
                canalSalaGlobal.send({ type: 'broadcast', event: 'actualizar_lista', payload: { lista: jugadoresActivos } });
            }
        })
        /* --- EVENTOS DEL CEREBRO CENTRAL --- */
        .on('broadcast', { event: 'hacker_registro_modulos' }, (mensaje) => {
            window.ZarkHacker.todosLosModulos.push(...mensaje.payload.modulos);
            window.ZarkHacker.nodosListos++;
            if (window.ZarkHacker.nodosListos >= jugadoresActivos.length) {
                window.ZarkHacker.iniciarRondaHost();
            }
        })
        .on('broadcast', { event: 'hacker_accion' }, (mensaje) => {
            if (window.ZarkHacker.jugando) window.ZarkHacker.procesarAccionCentral(mensaje.payload);
        })
        .subscribe();
}

function actualizarListaVisual() {
    listaJugadores.innerHTML = '';
    jugadoresActivos.forEach((j, idx) => {
        const div = document.createElement('div'); div.classList.add('jugador-item');
        div.innerText = idx === 0 ? `[ADMIN] ${j}` : `> ${j}`;
        listaJugadores.appendChild(div);
    });
}

btnArrancarJuego.addEventListener('click', () => {
    if (jugadoresActivos.length < 2) {
        alert("Se necesitan al menos 2 jugadores.");
        return;
    }
    
    window.ZarkHacker.todosLosModulos = [];
    window.ZarkHacker.instruccionesActivas = {};
    window.ZarkHacker.saludGlobal = 100;
    window.ZarkHacker.fondosGlobal = 0;
    window.ZarkHacker.nodosListos = 0;
    window.ZarkHacker.rondaIniciada = false;

    canalSalaGlobal.send({ type: 'broadcast', event: 'orden_iniciar_juego', payload: { juego: juegoSeleccionado } });
    pantallaLobby.classList.add('oculto');
    pantallaJuegoHost.classList.remove('oculto');
    
    if (juegoSeleccionado === 'hacker') inyectarJuegoHacker(pantallaJuegoHost, canalSalaGlobal);
});

async function destruirSala() { if (salaPin) await supabase.from('Sala').delete().eq('pin', salaPin); }
window.addEventListener('beforeunload', destruirSala);
window.addEventListener('pagehide', destruirSala);

// ==========================================
// LÓGICA DEL JUEGO: HACKEO (CEREBRO / HOST)
// ==========================================
const PREFIJOS = ["MAIN", "SUB", "CORE", "NET", "SYS", "AUX", "VIRT", "GHOST", "CYBER", "QUANT", "DARK", "DEEP", "NULL", "VOID", "SYN", "ACK"];
const SUSTANTIVOS = ["PROXY", "FIREWALL", "NODE", "PORT", "ROUTER", "SERVER", "CACHE", "DNS", "IP", "MAC", "PACKET", "TUNNEL", "SOCKET", "KERNEL", "SHELL", "DRIVE"];

function generarNombreModulo() {
    return `${PREFIJOS[Math.floor(Math.random() * PREFIJOS.length)]} ${SUSTANTIVOS[Math.floor(Math.random() * SUSTANTIVOS.length)]}`;
}

window.ZarkHacker = { 
    canal: null, soyHost: true, misModulos: [], todosLosModulos: [], 
    instruccionesActivas: {}, bucleJuego: null, jugando: false, 
    saludGlobal: 100, fondosGlobal: 0, nodosListos: 0, rondaIniciada: false, huellaTimers: {} 
};

export function inyectarJuegoHacker(contenedorDOM, canal) {
    window.ZarkHacker.canal = canal;
    window.ZarkHacker.jugando = true;

    contenedorDOM.innerHTML = `
        <div id="pantalla-transicion-hacker" class="transicion-matrix"><div id="texto-matrix" class="texto-matrix"></div></div>
        <div id="interfaz-hacker" class="interfaz-hacker oculto">
            <div class="panel-estado-hacker">
                <div class="etiqueta-barra">INTEGRIDAD DEL ENLACE</div>
                <div class="barra-contenedor"><div id="barra-notoriedad" class="barra-fill bg-verde" style="width: 100%; transition: width 0.3s;"></div></div>
                <div class="etiqueta-barra">TRANSFERENCIA DE FONDOS</div>
                <div class="barra-contenedor"><div id="barra-descarga" class="barra-fill bg-azul" style="width: 0%; transition: width 0.3s;"></div></div>
            </div>
            <div class="caja-instruccion-hacker">
                <div class="texto-instruccion" id="texto-instruccion">> ESPERANDO CONEXIÓN GLOBAL...</div>
                <div class="barra-timer-contenedor"><div id="barra-timer" class="barra-fill bg-verde" style="width: 100%;"></div></div>
            </div>
            <div id="panel-controles-hacker" class="panel-controles-hacker"></div>
        </div>
    `;

    const pantallaTransicion = document.getElementById('pantalla-transicion-hacker');
    const interfazHacker = document.getElementById('interfaz-hacker');
    const cajaTexto = document.getElementById('texto-matrix');
    const frases = [ "> Vulnerando Firewall...", "> Inyectando Troyano...", "> ESTABLECIENDO CONEXIÓN P2P..." ];
    let fIdx = 0, cIdx = 0;

    function typeWriter() {
        if (fIdx < frases.length) {
            if (cIdx < frases[fIdx].length) {
                cajaTexto.innerHTML += frases[fIdx].charAt(cIdx); cIdx++; setTimeout(typeWriter, 30);
            } else {
                cajaTexto.innerHTML += "<br>"; fIdx++; cIdx = 0; setTimeout(typeWriter, 300);
            }
        } else {
            setTimeout(() => {
                pantallaTransicion.classList.add('oculto');
                interfazHacker.classList.remove('oculto');
                generarMisModulosYRegistrar();
            }, 500);
        }
    }
    typeWriter();
}

function generarMisModulosYRegistrar() {
    const panel = document.getElementById('panel-controles-hacker');
    panel.innerHTML = ''; window.ZarkHacker.misModulos = [];
    const tiposDisponibles = ['boton', 'palanca', 'teclado', 'slider', 'flechas', 'dial', 'huella'];
    const nombresUsados = new Set();
    const tiposElegidos = tiposDisponibles.sort(() => Math.random() - 0.5).slice(0, 4);

    tiposElegidos.forEach(tipo => {
        const div = document.createElement('div'); div.classList.add('modulo-hacker');
        let titulo = generarNombreModulo();
        while(nombresUsados.has(titulo)) titulo = generarNombreModulo();
        nombresUsados.add(titulo);

        window.ZarkHacker.misModulos.push({ nombre: titulo, tipo: tipo });
        let html = `<div class="modulo-titulo">${titulo}</div>`;

        if (tipo === 'boton') html += `<div class="ctrl-boton" onclick="ZarkHacker.accionar('${titulo}', 'boton', 'click')"></div>`;
        else if (tipo === 'palanca') html += `<div class="ctrl-palanca" onclick="this.classList.toggle('on'); ZarkHacker.accionar('${titulo}', 'palanca', this.classList.contains('on'))"><div class="ctrl-palanca-switch"></div></div>`;
        else if (tipo === 'teclado') html += `<div class="ctrl-teclado"><div class="ctrl-btn-num" onclick="activarTecladoHacker(this); ZarkHacker.accionar('${titulo}', 'teclado', 1)">1</div><div class="ctrl-btn-num" onclick="activarTecladoHacker(this); ZarkHacker.accionar('${titulo}', 'teclado', 2)">2</div><div class="ctrl-btn-num" onclick="activarTecladoHacker(this); ZarkHacker.accionar('${titulo}', 'teclado', 3)">3</div></div>`;
        else if (tipo === 'slider') html += `<div class="ctrl-slider-container"><input type="range" min="0" max="100" step="25" value="0" class="ctrl-slider" onchange="ZarkHacker.accionar('${titulo}', 'slider', this.value)"><div class="slider-labels"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div></div>`;
        else if (tipo === 'flechas') html += `<div class="ctrl-flechas"><div class="ctrl-flecha" onclick="ZarkHacker.accionar('${titulo}', 'flechas', 'ARRIBA')">↑</div><div class="ctrl-flecha" onclick="ZarkHacker.accionar('${titulo}', 'flechas', 'ABAJO')">↓</div><div class="ctrl-flecha" onclick="ZarkHacker.accionar('${titulo}', 'flechas', 'IZQ')">←</div><div class="ctrl-flecha" onclick="ZarkHacker.accionar('${titulo}', 'flechas', 'DER')">→</div></div>`;
        else if (tipo === 'dial') html += `<div class="ctrl-dial-container" onclick="girarDialMetalico(this, '${titulo}')" data-valor="1"><div class="dial-metalico"><div class="dial-notch"></div></div><div class="dial-valor-texto">POS: <span class="dial-num">1</span></div></div>`;
        else if (tipo === 'huella') html += `<div class="ctrl-huella-container"><div class="ctrl-huella" onmousedown="ZarkHacker.iniciarHuella('${titulo}')" onmouseup="ZarkHacker.soltarHuella('${titulo}')" onmouseleave="ZarkHacker.soltarHuella('${titulo}')" ontouchstart="ZarkHacker.iniciarHuella('${titulo}')" ontouchend="ZarkHacker.soltarHuella('${titulo}')"><span class="material-symbols-outlined icono-huella">fingerprint</span><div class="huella-progreso" id="huella-progreso-${titulo}"></div></div></div>`;
        
        div.innerHTML = html; panel.appendChild(div);
    });

    window.ZarkHacker.todosLosModulos.push(...window.ZarkHacker.misModulos);
    window.ZarkHacker.nodosListos++;
    if (window.ZarkHacker.nodosListos >= jugadoresActivos.length) {
        window.ZarkHacker.iniciarRondaHost();
    }
}

window.ZarkHacker.iniciarRondaHost = function() {
    if (window.ZarkHacker.rondaIniciada) return;
    window.ZarkHacker.rondaIniciada = true;

    jugadoresActivos.forEach(jugador => window.ZarkHacker.asignarNuevaInstruccion(jugador));

    window.ZarkHacker.bucleJuego = setInterval(() => {
        if (!window.ZarkHacker.jugando) return;
        let actualizacionTimers = {};
        let huboFallo = false;

        jugadoresActivos.forEach(jugador => {
            let inst = window.ZarkHacker.instruccionesActivas[jugador];
            if (inst) {
                inst.tiempo -= 1.5;
                actualizacionTimers[jugador] = inst.tiempo;

                // Penalización por dejar acabar el tiempo
                if (inst.tiempo <= 0) {
                    huboFallo = true;
                    window.ZarkHacker.asignarNuevaInstruccion(jugador);
                }
            }
        });

        if (huboFallo) {
            window.ZarkHacker.saludGlobal = Math.max(0, window.ZarkHacker.saludGlobal - 15);
            actualizarYEnviarEstado();
            if (window.ZarkHacker.saludGlobal <= 0) { window.ZarkHacker.terminarJuegoGlobal(false); return; }
        }

        window.ZarkHacker.canal.send({ type: 'broadcast', event: 'hacker_timers', payload: actualizacionTimers });
        window.actualizarBarraTimerLocal(actualizacionTimers[miNombre]);

    }, 150);
}

window.ZarkHacker.asignarNuevaInstruccion = function(jugador) {
    const modulos = window.ZarkHacker.todosLosModulos;
    const mod = modulos[Math.floor(Math.random() * modulos.length)]; 
    let texto = ""; let valorEsperado = null;
    
    switch(mod.tipo) {
        case 'boton': texto = `> APRETAR BOTON DE ${mod.nombre}`; valorEsperado = 'click'; break;
        case 'palanca': const on = Math.random() > 0.5; texto = `> ${mod.nombre} ${on ? 'ON' : 'OFF'}`; valorEsperado = on; break;
        case 'teclado': const num = [1, 2, 3][Math.floor(Math.random()*3)]; texto = `> INGRESAR [${num}] EN ${mod.nombre}`; valorEsperado = num; break;
        case 'slider': const val = [0, 25, 50, 75, 100][Math.floor(Math.random()*5)]; texto = `> SETTEAR ${mod.nombre} EN ${val}%`; valorEsperado = val; break;
        case 'flechas': const dir = ['ARRIBA', 'ABAJO', 'IZQ', 'DER'][Math.floor(Math.random()*4)]; texto = `> MOVER ${mod.nombre} A LA ${dir}`; valorEsperado = dir; break;
        case 'dial': const dVal = [1, 2, 3, 4, 5][Math.floor(Math.random()*5)]; texto = `> ROTAR ${mod.nombre} A ${dVal}`; valorEsperado = dVal; break;
        case 'huella': texto = `> IDENTIFICAR ${mod.nombre}`; valorEsperado = 'ok'; break;
    }
    
    window.ZarkHacker.instruccionesActivas[jugador] = { nombreModulo: mod.nombre, tipo: mod.tipo, valorEsperado: valorEsperado, tiempo: 100 };

    if (jugador === miNombre) {
        document.getElementById('texto-instruccion').innerText = texto;
    } else {
        window.ZarkHacker.canal.send({ type: 'broadcast', event: 'hacker_instruccion_individual', payload: { jugador: jugador, texto: texto } });
    }
}

// CEREBRO: Evalúa las acciones para no penalizar a lo loco
window.ZarkHacker.procesarAccionCentral = function(payload) {
    if (!window.ZarkHacker.jugando) return;
    let acierto = false;
    let jugadorResuelto = null;
    let esModuloActivo = false;

    // Busca si ese botón resuelve la instrucción activa de CUALQUIER jugador
    for (let jugador of jugadoresActivos) {
        let inst = window.ZarkHacker.instruccionesActivas[jugador];
        if (inst && inst.nombreModulo === payload.nombre) {
            esModuloActivo = true; // El módulo sí era requerido, lo tocaste bien pero capaz aún no llegaste al valor
            if (payload.tipo === 'boton' || payload.tipo === 'huella' || inst.valorEsperado == payload.valor) {
                acierto = true;
                jugadorResuelto = jugador;
                break;
            }
        }
    }

    if (acierto) {
        window.ZarkHacker.fondosGlobal = Math.min(100, window.ZarkHacker.fondosGlobal + 10);
        window.ZarkHacker.saludGlobal = Math.min(100, window.ZarkHacker.saludGlobal + 2); // Un respiro al acertar
        actualizarYEnviarEstado();
        if (window.ZarkHacker.fondosGlobal >= 100) window.ZarkHacker.terminarJuegoGlobal(true);
        else window.ZarkHacker.asignarNuevaInstruccion(jugadorResuelto);
    } else if (!esModuloActivo) {
        // Toco un control que NADIE pidió: Castigamos el mashing (apretar a lo loco)
        window.ZarkHacker.saludGlobal = Math.max(0, window.ZarkHacker.saludGlobal - 5);
        actualizarYEnviarEstado();
        if (window.ZarkHacker.saludGlobal <= 0) window.ZarkHacker.terminarJuegoGlobal(false);
    }
}

function actualizarYEnviarEstado() {
    window.ZarkHacker.canal.send({ type: 'broadcast', event: 'hacker_estado', payload: { salud: window.ZarkHacker.saludGlobal, fondos: window.ZarkHacker.fondosGlobal } });
    window.actualizarBarrasVisuales(window.ZarkHacker.saludGlobal, window.ZarkHacker.fondosGlobal);
}

window.ZarkHacker.terminarJuegoGlobal = function(victoria) {
    window.ZarkHacker.jugando = false;
    clearInterval(window.ZarkHacker.bucleJuego);
    window.ZarkHacker.canal.send({ type: 'broadcast', event: 'hacker_fin', payload: { victoria: victoria } });
    window.terminarJuegoVisual(victoria);
}

// Botones del Host (Directo al cerebro)
window.ZarkHacker.accionar = function(nombre, tipo, valor) {
    window.ZarkHacker.procesarAccionCentral({ nombre, tipo, valor });
}

window.actualizarBarraTimerLocal = function(tiempo) {
    const barra = document.getElementById('barra-timer');
    if (!barra) return;
    barra.style.width = `${tiempo}%`;
    if (tiempo < 25) { barra.classList.remove('bg-verde'); barra.classList.add('bg-rojo'); } 
    else { barra.classList.remove('bg-rojo'); barra.classList.add('bg-verde'); }
}

window.actualizarBarrasVisuales = function(salud, fondos) {
    const barraNot = document.getElementById('barra-notoriedad');
    const barraFon = document.getElementById('barra-descarga');
    if(barraNot) barraNot.style.width = `${salud}%`;
    if(barraFon) barraFon.style.width = `${fondos}%`;
    
    // Si la salud es baja, se pone en rojo de peligro
    if (salud < 30) { barraNot.classList.remove('bg-verde'); barraNot.classList.add('bg-rojo'); } 
    else { barraNot.classList.remove('bg-rojo'); barraNot.classList.add('bg-verde'); }
}

window.terminarJuegoVisual = function(victoria) {
    const el = document.getElementById('texto-instruccion');
    if (el) {
        el.innerText = victoria ? "> DESCARGA COMPLETADA." : "> SISTEMA COMPROMETIDO.";
        el.style.color = victoria ? "#00ff33" : "#ff3333";
    }
}

window.activarTecladoHacker = function(elemento) {
    const hermanos = elemento.parentElement.children;
    for(let i=0; i<hermanos.length; i++) hermanos[i].classList.remove('activo');
    elemento.classList.add('activo');
}

window.girarDialMetalico = function(container, nombre) {
    let valorActual = parseInt(container.getAttribute('data-valor')) || 1;
    valorActual = valorActual >= 5 ? 1 : valorActual + 1;
    container.setAttribute('data-valor', valorActual);
    container.querySelector('.dial-num').innerText = valorActual;
    container.querySelector('.dial-metalico').style.transform = `rotate(${(valorActual - 1) * 72}deg)`;
    window.ZarkHacker.accionar(nombre, 'dial', valorActual);
}

window.ZarkHacker.iniciarHuella = function(nombre) {
    let progreso = 0; const barra = document.getElementById(`huella-progreso-${nombre}`);
    if(barra) barra.style.height = '0%';
    window.ZarkHacker.huellaTimers[nombre] = setInterval(() => {
        progreso += 10; if(barra) barra.style.height = `${progreso}%`;
        if (progreso >= 100) {
            clearInterval(window.ZarkHacker.huellaTimers[nombre]);
            if(barra) barra.style.height = '100%';
            window.ZarkHacker.accionar(nombre, 'huella', 'ok');
        }
    }, 150); 
}
window.ZarkHacker.soltarHuella = function(nombre) {
    if (window.ZarkHacker.huellaTimers[nombre]) clearInterval(window.ZarkHacker.huellaTimers[nombre]);
    const barra = document.getElementById(`huella-progreso-${nombre}`);
    if(barra) barra.style.height = '0%';
}