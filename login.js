// ==========================================================
// URL PÚBLICA DA API
/// ==========================================================

const API_BASE_URL = "https://sistema.unicatelecom.com.br";


// ==========================================================
// REALIZAR LOGIN
// ==========================================================

async function entrar() {

    const erroBox =
        document.getElementById("mensagemErro");

    if (erroBox) {
        erroBox.style.display = "none";
    }

    const login =
        document.getElementById("login").value.trim();

    const senha =
        document.getElementById("senha").value.trim();


    // ======================================================
    // VALIDAR CAMPOS
    // ======================================================

    if (!login) {
        alert("Digite o login");
        return;
    }

    if (!senha) {
        alert("Digite a senha");
        return;
    }


    try {

        // ==================================================
        // FAZER LOGIN
        // ==================================================

const url = `${API_BASE_URL}/login`;

console.log("CHAMANDO LOGIN:", url);

const resposta = await fetch(url, {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        login,
        senha
    })
});


        console.log(
            "STATUS LOGIN:",
            resposta.status
        );


        // ==================================================
        // LOGIN INCORRETO
        // ==================================================

        if (resposta.status === 401) {
            alert("Login ou senha incorretos.");
            return;
        }


        // ==================================================
        // OUTROS ERROS NO LOGIN
        // ==================================================

       if (!resposta.ok) {
    const detalhe = await resposta.text();

    console.error("URL chamada:", url);
    console.error("Status HTTP:", resposta.status);
    console.error("Resposta do servidor:", detalhe);

    alert(
        `Erro HTTP ${resposta.status}. Abra o console (F12) para ver os detalhes.`
    );

    return;
}


        const dados = await resposta.json();

        console.log("RESPOSTA DO LOGIN:", dados);


        // ==================================================
        // VERIFICAR CONTRATOS
        // ==================================================

        if (
            !dados ||
            !dados.contratos ||
            dados.contratos.length === 0
        ) {
            if (erroBox) {
                erroBox.innerText =
                    "Login ou senha incorretos.";

                erroBox.style.display = "block";
            } else {
                alert("Login ou senha incorretos.");
            }

            return;
        }


        // ==================================================
        // PEGAR CPF
        // ==================================================

        const cpfBruto =
            dados.contratos[0].cpfCnpj ||
            dados.contratos[0].cpfcnpj;


        if (!cpfBruto) {
            console.error(
                "CPF não encontrado na resposta do login:",
                dados
            );

            alert(
                "Não foi possível identificar o CPF do cliente."
            );

            return;
        }


        // ==================================================
        // NORMALIZAR CPF
        // ==================================================

        const cpf =
            String(cpfBruto).replace(/\D/g, "");

        console.log("CPF DO CLIENTE:", cpf);


        // ==================================================
        // VALIDAR CPF
        // ==================================================

        if (cpf.length !== 11) {
            console.error("CPF inválido:", cpf);

            alert(
                "Não foi possível identificar corretamente o CPF do cliente."
            );

            return;
        }


        // ==================================================
        // BUSCAR DADOS COMPLETOS DO CLIENTE NO SGP
        // ==================================================

        const urlCliente =
            `${API_BASE_URL}/cliente/${cpf}`;

        console.log("BUSCANDO CLIENTE:", urlCliente);


        const respostaCliente =
            await fetch(urlCliente);


        console.log(
            "STATUS CLIENTE:",
            respostaCliente.status
        );


        if (!respostaCliente.ok) {
            throw new Error(
                `Erro ao buscar cliente. Status: ${respostaCliente.status}`
            );
        }


        const dadosCliente =
            await respostaCliente.json();

        console.log(
            "DADOS COMPLETOS DO CLIENTE:",
            dadosCliente
        );


        // ==================================================
        // VERIFICAR DADOS DO CLIENTE
        // ==================================================

        if (
            !dadosCliente ||
            !dadosCliente.contratos ||
            dadosCliente.contratos.length === 0
        ) {
            alert(
                "Não foi possível encontrar os dados do cliente."
            );

            return;
        }


        const contratos =
            dadosCliente.contratos || [];


        // ==================================================
        // IDENTIFICAR CONTRATOS
        // ==================================================

        const contratoFibra =
            contratos.find(
                c => c.planointernet
            );

        const contratoMovel =
            contratos.find(
                c => c.planotelefonia
            );


        console.log("=================================");
        console.log("CONTRATO MÓVEL COMPLETO:");
        console.log(contratoMovel);
        console.log("=================================");


        // ==================================================
        // LIMPAR DADOS ANTIGOS
        // ==================================================

        localStorage.removeItem("dadosCliente");
        localStorage.removeItem("contratoFibra");
        localStorage.removeItem("contratoMovel");
        localStorage.removeItem("clienteNome");
        localStorage.removeItem("clienteCpf");

        localStorage.removeItem(
            "linhaMovelSelecionadaId"
        );

        localStorage.removeItem(
            "linhaMovelSelecionada"
        );

        localStorage.removeItem(
            "linhaMovelSelecionadaNumero"
        );

        localStorage.removeItem(
            "contratoMovelSelecionadoId"
        );


        // ==================================================
        // SALVAR DADOS COMPLETOS DO CLIENTE
        // ==================================================

        localStorage.setItem(
            "dadosCliente",
            JSON.stringify(dadosCliente)
        );


        // ==================================================
        // SALVAR CPF
        // ==================================================

        localStorage.setItem(
            "clienteCpf",
            cpf
        );

        console.log(
            "CPF SALVO NO LOCALSTORAGE:",
            localStorage.getItem("clienteCpf")
        );


        // ==================================================
        // SALVAR CONTRATO DE FIBRA
        // ==================================================

        if (contratoFibra) {
            localStorage.setItem(
                "contratoFibra",
                JSON.stringify(contratoFibra)
            );
        }


        // ==================================================
        // SALVAR CONTRATO MÓVEL
        // ==================================================

        if (contratoMovel) {
            localStorage.setItem(
                "contratoMovel",
                JSON.stringify(contratoMovel)
            );
        }


        // ==================================================
        // SALVAR NOME DO CLIENTE
        // ==================================================

        const nomeCliente =
            contratos[0].razaoSocial ||
            contratos[0].razaosocial ||
            "";

        localStorage.setItem(
            "clienteNome",
            nomeCliente
        );

        console.log(
            "CLIENTE LOGADO:",
            nomeCliente
        );


        // ==================================================
        // DEBUG
        // ==================================================

        console.log("DADOS SALVOS:");

        console.log(
            "CPF:",
            localStorage.getItem("clienteCpf")
        );

        console.log(
            "NOME:",
            localStorage.getItem("clienteNome")
        );

        console.log(
            "DADOS CLIENTE:",
            JSON.parse(
                localStorage.getItem("dadosCliente")
            )
        );


        // ==================================================
        // IR PARA SERVIÇOS
        // ==================================================

        window.location.href = "servicos.html";


    } catch (erro) {

        console.error("ERRO COMPLETO:", erro);

        alert(
            "Erro ao realizar login. Verifique sua conexão ou tente novamente."
        );

    }

}


// ==========================================================
// MOSTRAR / OCULTAR SENHA
// ==========================================================

function mostrarSenha() {

    const senha =
        document.getElementById("senha");

    const icone =
        document.getElementById("toggleSenha");


    if (!senha || !icone) {
        return;
    }


    if (senha.type === "password") {

        senha.type = "text";

        icone.classList.remove("fa-eye");
        icone.classList.add("fa-eye-slash");

    } else {

        senha.type = "password";

        icone.classList.remove("fa-eye-slash");
        icone.classList.add("fa-eye");

    }

}


// ==========================================================
// ESQUECI MINHA SENHA
// ==========================================================

function abrirChatSenha() {

    window.open(
        "https://unicatelecom.web.vmix.chat/",
        "_blank",
        "noopener,noreferrer"
    );

}
