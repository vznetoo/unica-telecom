function sair(){

    const confirmar = confirm(
        "Deseja realmente sair da sua conta?"
    );

    if(confirmar){

        window.location.href =
        "login.html";

    }

}

function abrirWhatsapp() {

    window.open(
        "https://wa.me/558120110047?text=Olá! Preciso de suporte para a minha linha Móvel.",
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