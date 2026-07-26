const arena = document.getElementById('arena');
const movedor = document.getElementById('movedor-dado');
const cubo = document.getElementById('dado-3d');
const btnTirar = document.getElementById('btn-tirar');
const textoResultado = document.getElementById('resultado-dado');

let estaGirando = false;

btnTirar.addEventListener('click', () => {
    if (estaGirando) return;
    estaGirando = true;
    btnTirar.disabled = true;
    textoResultado.innerText = "";

    // 1. Decidimos la cara ganadora antes de tirar
    const resultado = Math.floor(Math.random() * 6) + 1;

    // 2. Calculamos los giros espaciales
    // Le damos varias vueltas caóticas completas (múltiplos de 360)
    const vueltasBaseX = (Math.floor(Math.random() * 5) + 8) * 360; 
    const vueltasBaseY = (Math.floor(Math.random() * 5) + 8) * 360;

    let gradosX = vueltasBaseX;
    let gradosY = vueltasBaseY;

    // Ajuste matemático exacto para que la cara elegida quede mirando a la cámara
    switch (resultado) {
        case 1: gradosX += 0;   gradosY += 0;   break;
        case 2: gradosX += 0;   gradosY -= 90;  break;
        case 3: gradosX += 0;   gradosY -= 180; break;
        case 4: gradosX += 0;   gradosY += 90;  break;
        case 5: gradosX -= 90;  gradosY += 0;   break;
        case 6: gradosX += 90;  gradosY += 0;   break;
    }
    

    // Le aplicamos la rotación al CSS
    cubo.style.transform = `rotateX(${gradosX}deg) rotateY(${gradosY}deg)`;

    // 3. Físicas de rebote en la arena (2D)
    let posX = parseFloat(movedor.style.left) || 110;
    let posY = parseFloat(movedor.style.top) || 110;
    
    // Impulso inicial caótico
    let velX = (Math.random() - 0.5) * 25;
    let velY = (Math.random() - 0.5) * 25;
    let friccion = 0.985; // Cómo se frena en la lona
    
    let animacionId;
    let frames = 0;
    const duracionFrames = 180; // Aprox 1.5 segundos, igual que la transición CSS

    function animarRebote() {
        frames++;
        
        posX += velX;
        posY += velY;
        velX *= friccion;
        velY *= friccion;

        // Limites de la arena (300px - 80px del dado = 220px maximo)
        if (posX <= 0) { posX = 0; velX *= -0.8; }
        if (posX >= 220) { posX = 220; velX *= -0.8; }
        if (posY <= 0) { posY = 0; velY *= -0.8; }
        if (posY >= 220) { posY = 220; velY *= -0.8; }

        movedor.style.left = `${posX}px`;
        movedor.style.top = `${posY}px`;

        if (frames < duracionFrames) {
            animacionId = requestAnimationFrame(animarRebote);
        } else {
            // Terminó de rebotar y de girar
            cancelAnimationFrame(animacionId);
            textoResultado.innerText = `Resultado: ${resultado}`;
            estaGirando = false;
            btnTirar.disabled = false;
        }
    }

    animarRebote();
});