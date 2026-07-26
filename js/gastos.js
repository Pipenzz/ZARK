const inputNombre = document.getElementById('input-nombre');
const listaGastos = document.getElementById('lista-gastos');
const btnCalcular = document.getElementById('btn-calcular');
const btnVolver = document.getElementById('btn-volver-editar');
const sliderContenedor = document.getElementById('slider-contenedor');

const totalGastadoEl = document.getElementById('total-gastado');
const pagoPorCabezaEl = document.getElementById('pago-por-cabeza');
const listaResultados = document.getElementById('lista-resultados');

let personas = [];

// ================= 1. AGREGAR PERSONAS (ENTER) =================
inputNombre.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') {
        evento.preventDefault();
        const nombreLimpio = inputNombre.value.trim();

        if (nombreLimpio !== "") {
            personas.push({ nombre: nombreLimpio, gasto: 0 });
            inputNombre.value = "";
            renderizarListaGastos();
        }
    }
});

function renderizarListaGastos() {
    listaGastos.innerHTML = "";

    personas.forEach((persona, index) => {
        const li = document.createElement('li');
        li.className = 'gasto-item';

        // Si gastó 0, lo dejamos vacío ("") para que se vea el placeholder y no haya que borrar el 0
        const valorMostrar = persona.gasto === 0 ? "" : persona.gasto.toLocaleString('es-AR');

        li.innerHTML = `
            <span class="gasto-nombre">${persona.nombre}</span>
            <div style="display: flex; align-items: center;">
                <div class="gasto-input-container">
                    <span class="gasto-simbolo">$</span>
                    <!-- inputmode="numeric" abre el teclado de números en el celular -->
                    <input type="text" inputmode="numeric" class="input-plata" value="${valorMostrar}" placeholder="0">
                </div>
                <button class="btn-eliminar" title="Borrar">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
        `;

        const inputPlata = li.querySelector('.input-plata');
        
        // Magia para los puntos de mil en tiempo real
        inputPlata.addEventListener('input', (e) => {
            // Sacamos todo lo que no sea un número (incluyendo los puntos que ya tenía)
            let valorLimpio = e.target.value.replace(/\D/g, '');
            
            if (valorLimpio === "") {
                personas[index].gasto = 0;
                e.target.value = "";
            } else {
                let numeroReal = parseInt(valorLimpio, 10);
                personas[index].gasto = numeroReal;
                // Le volvemos a poner los puntos de mil formato Argentina
                e.target.value = numeroReal.toLocaleString('es-AR');
            }
        });

        const btnEliminar = li.querySelector('.btn-eliminar');
        btnEliminar.addEventListener('click', () => {
            personas.splice(index, 1);
            renderizarListaGastos();
        });

        listaGastos.appendChild(li);
    });
}

// ================= 2. CALCULAR DEUDAS =================
btnCalcular.addEventListener('click', () => {
    if (personas.length < 2) {
        alert("¡Agregá al menos a 2 personas para dividir la cuenta!");
        return;
    }

    let total = personas.reduce((suma, p) => suma + p.gasto, 0);
    let promedio = total / personas.length;

    totalGastadoEl.innerText = `$${total.toLocaleString('es-AR')}`;
    pagoPorCabezaEl.innerText = `$${promedio.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

    let saldos = personas.map(p => {
        return { nombre: p.nombre, saldo: p.gasto - promedio };
    });

    let deudores = saldos.filter(p => p.saldo < -0.01).sort((a, b) => a.saldo - b.saldo); 
    let acreedores = saldos.filter(p => p.saldo > 0.01).sort((a, b) => b.saldo - a.saldo); 

    let transferencias = [];
    let i = 0; 
    let j = 0; 

    while (i < deudores.length && j < acreedores.length) {
        let deudor = deudores[i];
        let acreedor = acreedores[j];

        let monto = Math.min(Math.abs(deudor.saldo), acreedor.saldo);

        transferencias.push({
            de: deudor.nombre,
            para: acreedor.nombre,
            monto: monto
        });

        deudor.saldo += monto;
        acreedor.saldo -= monto;

        if (Math.abs(deudor.saldo) < 0.01) i++;
        if (acreedor.saldo < 0.01) j++;
    }

    listaResultados.innerHTML = "";
    
    if (transferencias.length === 0) {
        listaResultados.innerHTML = `<li class="resultado-item">¡Todo el mundo está a mano! 🍻</li>`;
    } else {
        transferencias.forEach(t => {
            const li = document.createElement('li');
            li.className = 'resultado-item';
            li.innerHTML = `
                <span class="material-symbols-outlined">payments</span>
                <span><strong>${t.de}</strong> le debe a <strong>${t.para}</strong> $${t.monto.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            `;
            listaResultados.appendChild(li);
        });
    }

    sliderContenedor.classList.add('mostrar-resultados');
});

// ================= 3. VOLVER A EDITAR =================
btnVolver.addEventListener('click', () => {
    sliderContenedor.classList.remove('mostrar-resultados');
});