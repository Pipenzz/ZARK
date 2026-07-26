const botonLanzar = document.getElementById('btn-tirar');
const moneda = document.getElementById('moneda');
const envoltorio = document.getElementById('moneda-envoltorio');
const mensaje = document.getElementById('mensaje');

// Llevamos la cuenta de cuánto giró la moneda en total
let girosAcumulados = 0;

botonLanzar.addEventListener('click', () => {
    // 1. Bloqueamos el botón y avisamos
    botonLanzar.disabled = true;
    mensaje.innerText = "";

    // 2. Reiniciamos la animación de salto
    envoltorio.classList.remove('saltando');
    void envoltorio.offsetWidth; // Pequeño truco para forzar a la página a reiniciar la animación
    envoltorio.classList.add('saltando');

    // 3. Calculamos si es Cara (true) o Cruz (false)
    const esCara = Math.random() >= 0.5;

    // 4. Sumamos 5 vueltas completas (1800 grados) para el giro
    girosAcumulados += 1800;
    
    // Si sale cruz, le sumamos media vuelta más (180 grados) para que caiga de espaldas
    let gradosFinales = girosAcumulados;
    if (!esCara) {
        gradosFinales += 180;
    }

    // Le decimos a la moneda que gire hasta esos grados
    moneda.style.transform = `rotateX(${gradosFinales}deg)`;

    // 5. Esperamos 2 segundos (lo que dura el salto) para mostrar el resultado
    setTimeout(() => {
        if (esCara) {
            mensaje.innerText = "";
        } else {
            mensaje.innerText = "";
        }
        
        // Volvemos a habilitar el botón
        botonLanzar.disabled = false;
    }, 2000);
});