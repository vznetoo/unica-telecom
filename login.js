function entrar(){

    const cpf =
    document.getElementById("cpf").value;

    const senha =
    document.getElementById("senha").value;

    const cpfLimpo =
    cpf.replace(/\D/g, "");

    if(cpfLimpo.length !== 11){

        alert("CPF deve conter 11 números");

        return;

    }

    if(senha === ""){

        alert("Digite a senha");

        return;

    }

    window.location.href =
    "dashboard.html";

}


window.onload = function () {

    const cpfInput =
    document.getElementById("cpf");

    cpfInput.addEventListener("input", function (e) {

        let valor =
        e.target.value.replace(/\D/g, "");

        valor = valor.substring(0, 11);

        if (valor.length > 9) {

            valor = valor.replace(
                /^(\d{3})(\d{3})(\d{3})(\d{1,2}).*/,
                "$1.$2.$3-$4"
            );

        } else if (valor.length > 6) {

            valor = valor.replace(
                /^(\d{3})(\d{3})(\d+).*/,
                "$1.$2.$3"
            );

        } else if (valor.length > 3) {

            valor = valor.replace(
                /^(\d{3})(\d+).*/,
                "$1.$2"
            );

        }

        e.target.value = valor;

    });

};
function entrar() {
    window.location.href = "servicos.html";
}
function entrar() {
    window.location.href = "servicos.html";
}