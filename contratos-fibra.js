document.addEventListener(
    "DOMContentLoaded",
    () => {

        const dadosCliente =
            JSON.parse(
                localStorage.getItem(
                    "dadosCliente"
                )
            );

        const lista =
            document.getElementById(
                "listaContratos"
            );

        if (
            !dadosCliente ||
            !dadosCliente.contratos
        ) {

            lista.innerHTML = `
                <div class="sem-contrato">
                    Nenhum contrato encontrado.
                </div>
            `;

            return;

        }

// PEGA APENAS CONTRATOS DE INTERNET
// E REMOVE OS CANCELADOS

const contratosFibra =
    dadosCliente.contratos.filter(c => {

        if (!c.planointernet)
            return false;

        const status =
            (
                c.contratoStatusDisplay || ""
            ).toUpperCase();

        return (
            status.includes("ATIVO") ||
            status.includes("SUSP") ||
            status.includes("REDUZ")
        );

    });

const total =
    contratosFibra.length;

document.getElementById(
    "textoContratos"
).innerHTML =
    total === 1
        ? `Você possui <strong>1</strong> contrato fibra vinculado ao seu cadastro`
        : `Você possui <strong>${total}</strong> contratos fibra vinculados ao seu cadastro`;

if (total === 0) {

    lista.innerHTML = `
        <div class="sem-contrato">
            Nenhum contrato fibra encontrado.
        </div>
    `;

    return;

}

lista.innerHTML = "";

contratosFibra.forEach(
    contrato => {

        let classeStatus =
            "status-ativo";

        let classeHeader =
            "header-ativo";

        const status =
            (
                contrato.contratoStatusDisplay || ""
            ).toUpperCase();

        if (
            status.includes("SUSP")
        ) {

            classeStatus =
                "status-suspenso";

            classeHeader =
                "header-suspenso";

        }

        else if (
            status.includes("REDUZ")
        ) {

            classeStatus =
                "status-reduzido";

            classeHeader =
                "header-reduzido";

        }

        const card =
            document.createElement(
                "div"
            );

        card.className =
            `card-contrato ${classeStatus}`;

const nomePlano = contrato.planointernet || "";

const planoExibicao = nomePlano.split("_")[0].trim();

card.innerHTML = `

<div class="card-header ${classeHeader}">

    <div class="status ${classeStatus}">
        ${contrato.contratoStatusDisplay || "Ativo"}
    </div>

    <h2>
        <i class="fa-solid fa-earth-americas"></i>
        ${planoExibicao.toUpperCase()}
    </h2>

</div>


<div class="card-body">

    <div class="endereco">

        <i class="fa-solid fa-location-dot"></i>

        <div>

            ${contrato.endereco_logradouro || ""}
            ${contrato.endereco_numero || ""}

            <br>

            ${contrato.endereco_bairro || ""}

            <br>

            ${contrato.endereco_cidade || ""}
            -
            ${contrato.endereco_uf || ""}

        </div>

    </div>

    <div class="card-footer">

        <button class="btn-acessar">
            <i class="fa-solid fa-arrow-right"></i>
        </button>

    </div>

</div>

`;
card.addEventListener(
    "click",
    () => {
        // Garante que o status atualizado do display vai explícito para o objeto do contrato
        contrato.status = contrato.contratoStatusDisplay;

        localStorage.setItem(
            "contratoFibra",
            JSON.stringify(contrato)
        );

        window.location.href = "internet.html";
    }
);

                lista.appendChild(
                    card
                );

            }
        );

    }
);