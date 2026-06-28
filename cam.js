// ===============================
// ÚNICA CAM
// ===============================

// Elementos

const mosaico = document.getElementById("mosaico");

const camera1 = document.getElementById("camera1");

const camera2 = document.getElementById("camera2");

const botoes = document.querySelectorAll(".filtros button");


// ===============================
// Inicialização
// ===============================

window.onload = function () {

    mostrarTodas();

};


// ===============================
// Remove botão ativo
// ===============================

function limparBotoes() {

    botoes.forEach(botao => {

        botao.classList.remove("ativo");

    });

}


// ===============================
// Mostrar mosaico
// ===============================

function mostrarTodas() {

    mosaico.style.display = "grid";

    camera1.style.display = "none";

    camera2.style.display = "none";

    limparBotoes();

    botoes[0].classList.add("ativo");

}


// ===============================
// Mostrar câmera individual
// ===============================

function mostrarCamera(nome) {

    mosaico.style.display = "none";

    camera1.style.display = "none";

    camera2.style.display = "none";

    document.getElementById(nome).style.display = "block";

    limparBotoes();

    if (nome === "camera1") {

        botoes[1].classList.add("ativo");

    }

    if (nome === "camera2") {

        botoes[2].classList.add("ativo");

    }

}


// ===============================
// Animação das câmeras
// ===============================

const cards = document.querySelectorAll(".camera-card");

cards.forEach(card => {

    card.addEventListener("mouseenter", () => {

        card.style.transform = "translateY(-8px) scale(1.02)";

    });

    card.addEventListener("mouseleave", () => {

        card.style.transform = "translateY(0px) scale(1)";

    });

});


// ===============================
// Piscar indicador AO VIVO
// ===============================

setInterval(() => {

    document.querySelectorAll(".ao-vivo span").forEach(ponto => {

        ponto.classList.toggle("apagado");

    });

}, 700);


// ===============================
// Atualizar horário (preparação)
// ===============================

function atualizarHorario() {

    const agora = new Date();

    console.log(
        "Última atualização:",
        agora.toLocaleTimeString("pt-BR")
    );

}

setInterval(atualizarHorario, 10000);
const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");

if(menuBtn){

    menuBtn.addEventListener("click",()=>{

        mobileMenu.classList.toggle("active");

    });

}