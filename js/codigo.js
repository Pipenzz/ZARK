const tablero = document.getElementById('tablero-codigo');
const btnEspia = document.getElementById('btn-espia');

const contadorRojo = document.getElementById('contador-rojo');
const contadorAzul = document.getElementById('contador-azul');
const marcador = document.getElementById('marcador');
const mensajeFin = document.getElementById('mensaje-fin');
const textoFin = document.getElementById('texto-fin');
const btnReiniciarCodigo = document.getElementById('btn-reiniciar-codigo');

const bancoPalabras = [
    "FUEGO", "HIELO", "BOSQUE", "LUNA", "SOL", "REY", "REINA", "BARCO", "AVIÓN", "TREN",
    "PERRO", "GATO", "ÁGUILA", "SERPIENTE", "PEZ", "MANZANA", "PIZZA", "QUESO", "PAN", "CAFÉ",
    "ESPADA", "ESCUDO", "MAGIA", "FANTASMA", "ROBOT", "MÉDICO", "ESCUELA", "POLICÍA", "LADRÓN", "BANCO",
    "CINE", "MÚSICA", "GUITARRA", "FIESTA", "RELOJ", "TIEMPO", "ESPEJO", "SOMBRA", "LUZ", "CRISTAL",
    "PLAYA", "MONTAÑA", "DESIERTO", "RÍO", "NIEVE", "ORO", "PLATA", "HIERRO", "MADERA", "PIEDRA"
];

// Ahora son 8 rojas, 8 azules, 8 civiles y 1 asesino
const baseIdentidades = [
    ...Array(8).fill({ equipo: 'rojo', icono: 'diamond', clase: 'dorso-rojo' }),
    ...Array(8).fill({ equipo: 'azul', icono: 'circle', clase: 'dorso-azul' }),
    ...Array(8).fill({ equipo: 'civil', icono: 'square', clase: 'dorso-civil' }),
    { equipo: 'asesino', icono: 'close', clase: 'dorso-asesino' }
];

let cartaConfirmandoActual = null;
let estadoBtnEspia = 0; 

let rojosDescubiertos = 0;
let azulesDescubiertos = 0;
let juegoTerminado = false;

function iniciarJuego() {
    rojosDescubiertos = 0;
    azulesDescubiertos = 0;
    juegoTerminado = false;
    contadorRojo.innerText = "0";
    contadorAzul.innerText = "0";
    
    mensajeFin.classList.add('oculto');
    marcador.classList.remove('oculto');
    btnEspia.parentElement.classList.remove('oculto');
    
    estadoBtnEspia = 0;
    btnEspia.innerText = "Revelar Mapa Secreto";
    btnEspia.className = "btn-accion";
    
    tablero.innerHTML = '';
    tablero.classList.remove('modo-espia');
    
    const palabrasMezcladas = [...bancoPalabras].sort(() => Math.random() - 0.5).slice(0, 25);
    const identidadesMezcladas = [...baseIdentidades].sort(() => Math.random() - 0.5);

    for (let i = 0; i < 25; i++) {
        crearCartaDOM(palabrasMezcladas[i], identidadesMezcladas[i]);
    }
}

function crearCartaDOM(palabra, identidad) {
    const carta = document.createElement('div');
    carta.classList.add('carta-codigo');

    carta.innerHTML = `
        <div class="carta-inner">
            <div class="carta-frente">
                <span class="palabra">${palabra}</span>
                <span class="texto-confirmar">¿Tocar?</span>
            </div>
            <div class="carta-dorso ${identidad.clase}">
                <span class="material-symbols-outlined icono-identidad">${identidad.icono}</span>
                <span class="palabra-dorso">${palabra}</span>
            </div>
        </div>
    `;

    carta.addEventListener('click', () => {
        if (juegoTerminado || tablero.classList.contains('modo-espia')) return;
        if (carta.classList.contains('revelada')) return;

        if (cartaConfirmandoActual && cartaConfirmandoActual !== carta) {
            cartaConfirmandoActual.classList.remove('confirmando');
            cartaConfirmandoActual = null;
        }

        if (carta.classList.contains('confirmando')) {
            carta.classList.remove('confirmando');
            carta.classList.add('revelada'); 
            cartaConfirmandoActual = null;
            
            verificarCartaRevelada(identidad.equipo);
        } else {
            carta.classList.add('confirmando');
            cartaConfirmandoActual = carta;
        }
    });

    tablero.appendChild(carta);
}

function verificarCartaRevelada(equipo) {
    if (equipo === 'rojo') {
        rojosDescubiertos++;
        contadorRojo.innerText = rojosDescubiertos;
        // Ahora el rojo gana al llegar a 8
        if (rojosDescubiertos === 8) finalizarJuego("Gana el Equipo Rojo", "#ff4757");
    } 
    else if (equipo === 'azul') {
        azulesDescubiertos++;
        contadorAzul.innerText = azulesDescubiertos;
        if (azulesDescubiertos === 8) finalizarJuego("Gana el Equipo Azul", "#2e86de");
    } 
    else if (equipo === 'asesino') {
        finalizarJuego("Encontraron al Asesino \nFin del juego.", "#ff4757");
    }
}

function finalizarJuego(mensaje, color) {
    juegoTerminado = true;
    textoFin.innerText = mensaje;
    textoFin.style.color = color;
    
    tablero.classList.add('modo-espia');
    
    btnEspia.parentElement.classList.add('oculto');
    marcador.classList.add('oculto');
    mensajeFin.classList.remove('oculto');
}

btnEspia.addEventListener('click', () => {
    if (estadoBtnEspia === 0) {
        btnEspia.innerText = "¿Estás seguro? (Tocar para ver)";
        btnEspia.classList.add('btn-alerta');
        estadoBtnEspia = 1;
    } 
    else if (estadoBtnEspia === 1) {
        btnEspia.innerText = "Ocultar Mapa Secreto";
        btnEspia.classList.remove('btn-alerta');
        btnEspia.classList.replace('btn-accion', 'btn-secundario');
        tablero.classList.add('modo-espia');
        
        if (cartaConfirmandoActual) {
            cartaConfirmandoActual.classList.remove('confirmando');
            cartaConfirmandoActual = null;
        }
        
        estadoBtnEspia = 2;
    } 
    else if (estadoBtnEspia === 2) {
        btnEspia.innerText = "Revelar Mapa Secreto";
        btnEspia.classList.replace('btn-secundario', 'btn-accion');
        tablero.classList.remove('modo-espia'); 
        estadoBtnEspia = 0;
    }
});

btnReiniciarCodigo.addEventListener('click', iniciarJuego);

iniciarJuego();