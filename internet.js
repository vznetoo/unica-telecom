// ===============================
// SPEEDTEST
// ===============================

function abrirSpeedtest(){

    window.open(
        "https://www.speedtest.net/",
        "_blank"
    );

}


// ===============================
// CONTRATO
// ===============================

function baixarContrato(){

    window.open(
        "assets/contrato.pdf",
        "_blank"
    );

}


// ===============================
// WHATSAPP
// ===============================

function abrirWhatsapp(){

    window.open(
        "https://wa.me/5581920110047",
        "_blank"
    );

}
const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");

if(menuBtn){

    menuBtn.addEventListener("click",()=>{

        mobileMenu.classList.toggle("active");

    });

}