document.addEventListener("DOMContentLoaded", () => {

    const dadosClienteStr =
        localStorage.getItem("dadosCliente");

    const linhasMovelStr =
        localStorage.getItem("linhasMovel");

    let linhasBraz = [];

    if (linhasMovelStr) {
        try {
            linhasBraz = JSON.parse(linhasMovelStr);
        } catch (e) {
            linhasBraz = [];
        }
    }

    let dadosCliente = null;

    if (dadosClienteStr) {
        try {

            dadosCliente = JSON.parse(dadosClienteStr);

            if (
                dadosCliente.linhasMovel &&
                linhasBraz.length === 0
            ) {
                linhasBraz = dadosCliente.linhasMovel;
            }

        } catch (e) {

            dadosCliente = null;

        }
    }

    const containerLista =
        document.getElementById(
            "listaLinhasMoveis"
        );

    const textoContagem =
        document.getElementById(
            "textoContagemLinhas"
        );


    const totalLinhas =
        linhasBraz.length;


    textoContagem.innerText =
        `Você possui ${totalLinhas} linha(s) vinculada(s) ao seu cadastro`;


    containerLista.innerHTML = "";


    if (totalLinhas === 0) {

        containerLista.innerHTML = `
            <div style="
                text-align: center;
                background: #ffffff;
                padding: 30px;
                border-radius: 20px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.05);
            ">
                <p style="
                    color: #64748b;
                    font-size: 16px;
                ">
                    Nenhuma linha móvel encontrada neste cadastro.
                </p>
            </div>
        `;

        return;
    }


    linhasBraz.forEach((linha, index) => {

        /* ================================
           TIPO DO PLANO
        ================================= */

        const nomePlano =
            linha.tipo
                ? `SIM Card (${linha.tipo})`
                : "Plano Móvel Única";


        /* ================================
           STATUS
        ================================= */

        const statusOriginal =
            String(
                linha.status || ""
            )
            .trim()
            .toUpperCase();


        let statusTexto = "Ativo";


        if (statusOriginal === "ACTIVE") {

            statusTexto = "Ativo";

        } else if (statusOriginal === "INACTIVE") {

            statusTexto = "Inativo";

        } else if (statusOriginal === "SUSPENDED") {

            statusTexto = "Suspenso";

        } else if (statusOriginal) {

            statusTexto =
                linha.status;

        }


        /* ================================
           NÚMERO
        ================================= */

        const numeroBruto =
            linha.msisdn ||
            linha.numero ||
            "Número não disponível";


        const numeroFormatado =
            formatarNumeroLinha(
                numeroBruto
            );


        /* ================================
           CARD
        ================================= */

        const cardHTML = `

            <div
                class="card-contrato"
                onclick="selecionarLinhaMovel(${index})"
            >

                <div class="card-contrato-topo">

                    <div class="info-plano-movel">

                        <i class="fa-solid fa-mobile-screen-button"></i>

                        <span>
                            ${nomePlano}
                        </span>

                    </div>


                    <span class="tag-status">
                        ${statusTexto}
                    </span>

                </div>


                <div class="card-contrato-corpo">

                    <div class="detalhes-linha">

                        <span>
                            Número da Linha:
                        </span>

                        <strong>
                            ${numeroFormatado}
                        </strong>

                    </div>


                    <button
                        class="btn-avancar"
                        type="button"
                    >

                        <i class="fa-solid fa-arrow-right"></i>

                    </button>

                </div>

            </div>

        `;


        containerLista.innerHTML +=
            cardHTML;

    });

});


/* =====================================================
   FORMATA NÚMERO DA LINHA
===================================================== */

function formatarNumeroLinha(numero) {

    let limpo =
        String(numero)
            .replace(/\D/g, "");


    /*
     * Remove o código do Brasil
     * 55 + DDD + número
     */

    if (
        limpo.length === 13 &&
        limpo.startsWith("55")
    ) {

        limpo =
            limpo.substring(2);

    }


    /*
     * Celular:
     * (81) 92000-8594
     */

    if (limpo.length === 11) {

        const ddd =
            limpo.substring(0, 2);

        const celular =
            limpo.substring(2);


        return `(${ddd}) ${celular.substring(0, 5)}-${celular.substring(5)}`;

    }


    /*
     * Telefone com 10 dígitos
     */

    if (limpo.length === 10) {

        const ddd =
            limpo.substring(0, 2);

        const telefone =
            limpo.substring(2);


        return `(${ddd}) ${telefone.substring(0, 4)}-${telefone.substring(4)}`;

    }


    return numero;

}


/* =====================================================
   SELECIONAR LINHA
===================================================== */

function selecionarLinhaMovel(index) {

    localStorage.setItem(
        "linhaMovelSelecionada",
        index
    );

    window.location.href =
        window.location.href = "dashboard.html";

}






