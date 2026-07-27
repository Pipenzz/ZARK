const conceptoIzq = document.getElementById('concepto-izq');
const conceptoDer = document.getElementById('concepto-der');
const zonaObjetivo = document.getElementById('zona-objetivo');
const tapaRueda = document.getElementById('tapa-rueda');
const aguja = document.getElementById('aguja');
const sliderAguja = document.getElementById('slider-aguja');
const btnAccion = document.getElementById('btn-accion-principal');
const textoEstado = document.getElementById('texto-estado');

const ptsRojo = document.getElementById('puntos-rojo');
const ptsAzul = document.getElementById('puntos-azul');

const bancoConceptos = [
    ["Mondongo", "Manjar"],
    ["Asado quemado", "Asado del diego"],
    ["Juego aburrido", "Frenetico y competitivo"],
    ["Frio", "Caliente"],
    ["Pilates", "Triatlon"],
    ["Cerca", "Lejos"],
    ["Pelicula zzz", "Es cine"],
    ["Inutil", "Super util"],
    ["Se rompe facil", "Indestructible"],
    ["Gasto innecesario", "La mejor inversion"],
    ["Mala idea", "Idea millonaria"]
];

let puntosEquipoRojo = 0;
let puntosEquipoAzul = 0;
let turnoRojo = true; 
let objetivoActual = 90;
let estadoFase = 0; 

function prepararRonda() {
    estadoFase = 0;
    
    const par = bancoConceptos[Math.floor(Math.random() * bancoConceptos.length)];
    conceptoIzq.innerText = par[0];
    conceptoDer.innerText = par[1];

    objetivoActual = Math.floor(Math.random() * 140) + 20;
    
    zonaObjetivo.style.transform = `rotate(${objetivoActual - 90}deg)`;
    
    tapaRueda.classList.remove('oculta');
    sliderAguja.value = 90;
    sliderAguja.disabled = true;
    actualizarAguja();
    
    textoEstado.innerText = turnoRojo ? "Turno del Psiquico (Rojo)" : "Turno del Psiquico (Azul)";
    textoEstado.style.color = turnoRojo ? "#ff4757" : "#2e86de";
    
    btnAccion.innerText = "Ver Zona Ganadora";
    btnAccion.className = "btn-accion";
}

sliderAguja.addEventListener('input', actualizarAguja);

function actualizarAguja() {
    let valor = sliderAguja.value;
    aguja.style.transform = `rotate(${valor - 90}deg)`;
}

btnAccion.addEventListener('click', () => {
    
    if (estadoFase === 0) {
        tapaRueda.classList.add('oculta');
        btnAccion.innerText = "Ocultar y Pasar Celular";
        btnAccion.classList.replace('btn-accion', 'btn-secundario');
        estadoFase = 1;
    } 
    else if (estadoFase === 1) {
        tapaRueda.classList.remove('oculta');
        sliderAguja.disabled = false; 
        
        textoEstado.innerText = "El equipo debate y mueve la aguja";
        textoEstado.style.color = "#fff";
        btnAccion.innerText = "Revelar Puntaje";
        btnAccion.classList.replace('btn-secundario', 'btn-accion');
        estadoFase = 2;
    }
    else if (estadoFase === 2) {
        sliderAguja.disabled = true;
        tapaRueda.classList.add('oculta');
        
        calcularPuntos();
        
        btnAccion.innerText = "Siguiente Ronda";
        estadoFase = 3;
    }
    else if (estadoFase === 3) {
        turnoRojo = !turnoRojo;
        prepararRonda();
    }
});

function calcularPuntos() {
    let valorAguja = parseInt(sliderAguja.value);
    let diferencia = Math.abs(objetivoActual - valorAguja);
    let puntosObtenidos = 0;

    if (diferencia <= 4) {
        puntosObtenidos = 4; 
    } else if (diferencia <= 14) {
        puntosObtenidos = 3; 
    } else if (diferencia <= 30) {
        puntosObtenidos = 2; 
    } else {
        puntosObtenidos = 0; 
    }

    if (turnoRojo) {
        puntosEquipoRojo += puntosObtenidos;
        ptsRojo.innerText = puntosEquipoRojo;
    } else {
        puntosEquipoAzul += puntosObtenidos;
        ptsAzul.innerText = puntosEquipoAzul;
    }

    if (puntosObtenidos === 4) {
        textoEstado.innerText = "En el blanco. +4 Puntos";
        textoEstado.style.color = "#2ecc71";
    } else if (puntosObtenidos > 0) {
        textoEstado.innerText = `Bien. Sumaron +${puntosObtenidos} Puntos`;
        textoEstado.style.color = "#2ecc71";
    } else {
        textoEstado.innerText = "Le erraron. 0 Puntos";
        textoEstado.style.color = "#e74c3c";
    }
}

prepararRonda();