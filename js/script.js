// ===========================
// TELA DE ABERTURA (SPLASH)
// ===========================

function iniciarJogo() {
    const splashScreen = document.querySelector('.splash-screen');
    if (splashScreen) {
        splashScreen.classList.add('hidden');
    }
}

const botaoStart = document.getElementById('startBtn');
if (botaoStart) {
    botaoStart.addEventListener('click', iniciarJogo);
}

// ===========================
// FUNÇÕES DO JOGO
// ===========================

function mostrarClienteNoBalcao() {
    // 1. Mostra a cliente atrás do balcão
    const clienteBalcao = document.querySelector('.customer-pickup');
    if (clienteBalcao) {
        clienteBalcao.classList.add('active');
    }

    // 2. Esconde a cliente que estava na cadeira da Mesa 1
    const clienteMesa1 = document.querySelector('.table:nth-child(1) .customer');
    if (clienteMesa1) {
        clienteMesa1.style.display = 'none';
    }
}

function animarClienteParaMesa({ spriteEntrada, spriteSentado, targetTableSelector }) {
    return new Promise((resolve) => {
        const chegadaCliente = document.querySelector('.arrival-guest');
        const imagemChegada = chegadaCliente ? chegadaCliente.querySelector('img') : null;
        const mesa = document.querySelector(targetTableSelector);

        if (!chegadaCliente || !imagemChegada || !mesa) {
            resolve();
            return;
        }

        const chair = mesa.querySelector('.chair');
        if (chair) {
            const clienteAtualDaMesa = chair.querySelector('.customer');
            if (clienteAtualDaMesa) {
                clienteAtualDaMesa.style.display = 'none';
            }
        }

        chegadaCliente.classList.remove('is-seated');
        chegadaCliente.classList.remove('is-active');
        chegadaCliente.style.opacity = '0';
        chegadaCliente.style.transform = 'translateX(0)';
        chegadaCliente.style.width = '56px';
        chegadaCliente.style.display = 'block';
        imagemChegada.src = spriteEntrada;
        chegadaCliente.style.bottom = '24px';
        chegadaCliente.style.left = '-70px';
        chegadaCliente.style.top = 'auto';

        void chegadaCliente.offsetWidth;
        chegadaCliente.classList.add('is-active');

        chegadaCliente.addEventListener('animationend', () => {
            if (!chegadaCliente.classList.contains('is-active')) {
                resolve();
                return;
            }

            if (chair) {
                const antigo = chair.querySelector('.customer');
                if (antigo) antigo.remove();

                const seatedImg = document.createElement('img');
                seatedImg.src = spriteSentado;
                seatedImg.alt = 'Cliente';
                seatedImg.className = 'customer';
                seatedImg.style.width = '35px';
                seatedImg.style.imageRendering = 'pixelated';
                chair.appendChild(seatedImg);
            }

            chegadaCliente.style.display = 'none';
            resolve();
        }, { once: true });

        requestAnimationFrame(() => {
            chegadaCliente.classList.add('is-active');
        });
    });
}

async function iniciarChegadaDoCliente() {
    await animarClienteParaMesa({
        spriteEntrada: 'img/characters/homemempe.png',
        spriteSentado: 'img/characters/homem.png',
        targetTableSelector: '.table:nth-child(2)'
    });

    await animarClienteParaMesa({
        spriteEntrada: 'img/characters/idosoempe.png',
        spriteSentado: 'img/characters/idoso.png',
        targetTableSelector: '.table:nth-child(4)'
    });
}

// Vincula ao clique do botão Servir
const botaoServe = document.querySelector('.serve');
if (botaoServe) {
    botaoServe.addEventListener('click', () => {
        mostrarClienteNoBalcao();
    });
}

window.addEventListener('load', iniciarChegadaDoCliente);