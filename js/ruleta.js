const canvas = document.getElementById('ruleta-canvas');
const ctx = canvas.getContext('2d'); 
const btnGirar = document.getElementById('btn-girar');
const btnLimpiar = document.getElementById('btn-limpiar');
const inputNombre = document.getElementById('input-nombre');
const listaUI = document.getElementById('lista-participantes');
const mensaje = document.getElementById('mensaje');

const colores = ['#D96C6C', '#75B975', '#6C8CD9', '#D96CBA', '#6CD9D2', '#D9CA6C', '#9F6CD9', '#D9946C', '#C05C5C', '#5FA872'];

let participantes = [];
let girosAcumulados = 0;

// ================= 1. CARGA RÁPIDA (ENTER) =================
inputNombre.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') {
        evento.preventDefault(); 
        const nombreLimpio = inputNombre.value.trim();
        
        if (nombreLimpio !== "") {
            participantes.push({
                nombre: nombreLimpio,
                peso: 1,
                color: colores[participantes.length % colores.length]
            });
            inputNombre.value = "";
            actualizarUI(); 
        }
    }
});

// ================= 2. BOTÓN LIMPIAR TODO =================
btnLimpiar.addEventListener('click', () => {
    participantes = []; // Vaciamos la lista por completo
    actualizarUI();
    mensaje.innerText = "Agregá participantes y girá";
});

// ================= 3. ACTUALIZAR LISTA Y DIBUJAR =================
function actualizarUI() {
    listaUI.innerHTML = "";
    
    participantes.forEach((p, index) => {
        const li = document.createElement('li');
        li.innerText = p.nombre;
        li.style.borderLeftColor = p.color;
        
        // Magia: Si tocas el nombre, se elimina
        li.addEventListener('click', () => {
            participantes.splice(index, 1); // Lo saca del listado
            actualizarUI(); // Refresca la pantalla
        });
        
        listaUI.appendChild(li);
    });
    
    dibujarRuleta();
}

function dibujarRuleta() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (participantes.length === 0) return;

    const totalPeso = participantes.reduce((suma, p) => suma + p.peso, 0);
    let anguloInicio = 0; 

    for (let i = 0; i < participantes.length; i++) {
        const p = participantes[i];
        const porcionAngulo = (p.peso / totalPeso) * 2 * Math.PI;

        ctx.beginPath();
        ctx.moveTo(150, 150); 
        ctx.arc(150, 150, 150, anguloInicio, anguloInicio + porcionAngulo);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.stroke(); 

        ctx.save();
        ctx.translate(150, 150);
        ctx.rotate(anguloInicio + porcionAngulo / 2); 
        ctx.textAlign = "right";
        ctx.fillStyle = "#121212"; 
        ctx.font = "bold 16px sans-serif";
        ctx.fillText(p.nombre, 140, 5); 
        ctx.restore();

        anguloInicio += porcionAngulo;
    }
}

// ================= 4. GIRAR (AZAR FÍSICO REAL) =================
btnGirar.addEventListener('click', () => {
    if (participantes.length === 0) {
        mensaje.innerText = "¡Agregá gente primero!";
        return;
    }

    btnGirar.disabled = true;
    mensaje.innerText = "Girando...";

    const vueltasRandom = 5 + Math.floor(Math.random() * 5); 
    const gradosRandom = Math.floor(Math.random() * 360); 
    
    girosAcumulados += (vueltasRandom * 360) + gradosRandom;
    canvas.style.transform = `rotate(${girosAcumulados}deg)`;

    setTimeout(() => {
        let gradosPuntero = (270 - (girosAcumulados % 360) + 360) % 360;
        const totalPeso = participantes.reduce((suma, p) => suma + p.peso, 0);
        
        let anguloActual = 0;
        let ganador = null;

        for (let p of participantes) {
            let proporcion = p.peso / totalPeso;
            let anguloGrados = proporcion * 360;

            if (gradosPuntero >= anguloActual && gradosPuntero < (anguloActual + anguloGrados)) {
                ganador = p;
                break; 
            }
            anguloActual += anguloGrados;
        }

        mensaje.innerText = `¡Ganador: ${ganador.nombre}!`;
        btnGirar.disabled = false;
        
    }, 4000); 
});