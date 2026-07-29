import { supabase } from './supabase.js';

const pantallaIngreso = document.getElementById('pantalla-ingreso');
const pantallaEspera = document.getElementById('pantalla-espera');
const pantallaJuegoInvitado = document.getElementById('pantalla-juego-invitado');

const inputPin = document.getElementById('input-pin');
const inputNombre = document.getElementById('input-nombre');
const btnUnirse = document.getElementById('btn-unirse');
const mensajeError = document.getElementById('mensaje-error');
const listaJugadores = document.getElementById('lista-jugadores');

let miNombre = "";
let salaPin = "";
let canalSala = null;
let miIdTemp = "";

inputPin.addEventListener('input', function() { this.value = this.value.toUpperCase(); });
inputNombre.addEventListener('input', function() { this.value = this.value.toUpperCase(); });

btnUnirse.addEventListener('click', async () => {
    salaPin = inputPin.value.trim();
    miNombre = inputNombre.value.trim();

    if (salaPin.length !== 4 || !miNombre) { mensajeError.innerText = "Completá los datos."; return; }
    btnUnirse.innerText = "Buscando..."; btnUnirse.disabled = true;

    const { data, error } = await supabase.from('Sala').select('*').eq('pin', salaPin).single();
    if (error || !data) {
        mensajeError.innerText = "La sala no existe.";
        btnUnirse.innerText = "Entrar a la Sala"; btnUnirse.disabled = false;
        return;
    }

    miIdTemp = Math.random().toString(36).substring(2, 9);
    conectarWebSocketInvitado();
});

function conectarWebSocketInvitado() {
    canalSala = supabase.channel(`sala-${salaPin}`);
    canalSala
        .on('broadcast', { event: 'rechazo_unirse' }, (mensaje) => {
            if (mensaje.payload.id_temp === miIdTemp) {
                mensajeError.innerText = "Ese nombre ya está en uso.";
                btnUnirse.innerText = "Entrar a la Sala"; btnUnirse.disabled = false;
                supabase.removeChannel(canalSala);
            }
        })
        .on('broadcast', { event: 'aceptacion_unirse' }, (mensaje) => {
            if (mensaje.payload.id_temp === miIdTemp) {
                pantallaIngreso.classList.add('oculto');
                pantallaEspera.classList.remove('oculto');
            }
        })
        .on('broadcast', { event: 'actualizar_lista' }, (mensaje) => {
            listaJugadores.innerHTML = '';
            mensaje.payload.lista.forEach((j, idx) => {
                const div = document.createElement('div'); div.classList.add('jugador-item');
                div.innerText = idx === 0 ? `[ADMIN] ${j}` : `> ${j}`;
                listaJugadores.appendChild(div);
            });
        })
        .on('broadcast', { event: 'orden_iniciar_juego' }, (mensaje) => {
            pantallaEspera.classList.add('oculto');
            pantallaJuegoInvitado.classList.remove('oculto');
            if (mensaje.payload.juego === 'hacker') inyectarJuegoHacker(pantallaJuegoInvitado, canalSala);
        })
        /* --- LECTURA DEL CEREBRO CENTRAL --- */
        .on('broadcast', { event: 'hacker_instruccion_individual' }, (mensaje) => {
            if (mensaje.payload.jugador === miNombre) {
                const el = document.getElementById('texto-instruccion');
                if (el) el.innerText = mensaje.payload.texto;
            }
        })
        .on('broadcast', { event: 'hacker_timers' }, (mensaje) => {
            if (mensaje.payload[miNombre] !== undefined) {
                window.actualizarBarraTimerLocal(mensaje.payload[miNombre]);
            }
        })
        .on('broadcast', { event: 'hacker_estado' }, (mensaje) => {
            window.actualizarBarrasVisuales(mensaje.payload.salud, mensaje.payload.fondos);
        })
        .on('broadcast', { event: 'hacker_fin' }, (mensaje) => {
            window.terminarJuegoVisual(mensaje.payload.victoria);
        })
        .subscribe((estado) => {
            if (estado === 'SUBSCRIBED') {
                canalSala.send({ type: 'broadcast', event: 'solicitar_unirse', payload: { nombre: miNombre, id_temp: miIdTemp } });
            }
        });
}

// ==========================================
// LÓGICA DEL JUEGO: HACKEO (INVITADO)
// ==========================================
const PREFIJOS = ["MAIN", "SUB", "CORE", "NET", "SYS", "AUX", "VIRT", "GHOST", "CYBER", "QUANT", "DARK", "DEEP", "NULL", "VOID", "SYN", "ACK"];
const SUSTANTIVOS = ["PROXY", "FIREWALL", "NODE", "PORT", "ROUTER", "SERVER", "CACHE", "DNS", "IP", "MAC", "PACKET", "TUNNEL", "SOCKET", "KERNEL", "SHELL", "DRIVE"];

function generarNombreModulo() {
    return `${PREFIJOS[Math.floor(Math.random() * PREFIJOS.length)]} ${SUSTANTIVOS[Math.floor(Math.random() * SUSTANTIVOS.length)]}`;
}

window.ZarkHacker = { canal: null, jugando: false, huellaTimers: {}, misModulos: [] };

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

    window.ZarkHacker.canal.send({ type: 'broadcast', event: 'hacker_registro_modulos', payload: { modulos: window.ZarkHacker.misModulos } });
}

window.ZarkHacker.accionar = function(nombre, tipo, valor) {
    if (!window.ZarkHacker.jugando) return;
    window.ZarkHacker.canal.send({ type: 'broadcast', event: 'hacker_accion', payload: { nombre, tipo, valor } });
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
    
    if (salud < 30) { barraNot.classList.remove('bg-verde'); barraNot.classList.add('bg-rojo'); } 
    else { barraNot.classList.remove('bg-rojo'); barraNot.classList.add('bg-verde'); }
}

window.terminarJuegoVisual = function(victoria) {
    window.ZarkHacker.jugando = false;
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