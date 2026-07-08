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

function iniciarChegadaDoCliente() {
    const chegadaCliente = document.querySelector('.arrival-guest');
    const clienteMesa2 = document.querySelector('.table:nth-child(2) .customer');
    const imagemChegada = chegadaCliente ? chegadaCliente.querySelector('img') : null;

    if (chegadaCliente && imagemChegada) {
        if (clienteMesa2) {
            clienteMesa2.style.display = 'none';
        }

        chegadaCliente.classList.remove('is-seated');
        chegadaCliente.classList.add('is-active');
        imagemChegada.src = 'img/characters/homemempe.png';
        chegadaCliente.style.bottom = '24px';
        chegadaCliente.style.left = '-70px';
        chegadaCliente.style.top = 'auto';
        chegadaCliente.style.opacity = '0';
        chegadaCliente.style.transform = 'translateX(0)';
        chegadaCliente.style.width = '56px';

        chegadaCliente.addEventListener('animationend', () => {
            if (!chegadaCliente.classList.contains('is-active')) {
                return;
            }

            const mesa2 = document.querySelector('.table:nth-child(2)');

            // Coloca o personagem dentro da cadeira da mesa 2 (substitui o placeholder)
            if (mesa2) {
                const chair = mesa2.querySelector('.chair');
                if (chair) {
                    // Remove cliente antigo se existir
                    const antigo = chair.querySelector('.customer');
                    if (antigo) antigo.remove();

                    // Cria a imagem sentada e insere na cadeira
                    const seatedImg = document.createElement('img');
                    seatedImg.src = 'img/characters/homem.png';
                    seatedImg.alt = 'Cliente';
                    seatedImg.className = 'customer';
                    seatedImg.style.width = '35px';
                    seatedImg.style.imageRendering = 'pixelated';
                    chair.appendChild(seatedImg);

                    // Esconde o elemento de chegada (não precisamos mais dele)
                    chegadaCliente.style.display = 'none';
                }
            }
        }, { once: true });

        requestAnimationFrame(() => {
            chegadaCliente.classList.add('is-active');
        });
    }
}

// Vincula ao clique do botão Servir
const botaoServe = document.querySelector('.serve');
if (botaoServe) {
    botaoServe.addEventListener('click', () => {
        mostrarClienteNoBalcao();
    });
}

window.addEventListener('load', iniciarChegadaDoCliente);