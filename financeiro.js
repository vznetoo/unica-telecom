function historicoFinanceiro() {

    console.log("BOTÃO CLICADO");

    const lista = document.getElementById("listaHistorico");

    if (!lista) {
        console.error("Elemento listaHistorico não encontrado.");
        return;
    }

    lista.innerHTML = "";

    const faturasOrdenadas =
        [...faturasCliente].sort(
            (a, b) =>
                new Date(b.vencimento) -
                new Date(a.vencimento)
        );

    faturasOrdenadas.forEach(fatura => {

        const div = document.createElement("div");

        div.className = "item-fatura";

        // STATUS
        let statusTexto = fatura.status;
        let classeStatus = "status-gerado";

        const hoje = new Date();

        hoje.setHours(0, 0, 0, 0);

        const vencimento = new Date(fatura.vencimento);

        vencimento.setHours(0, 0, 0, 0);

        if (
            fatura.status === "Gerado" &&
            vencimento < hoje
        ) {

            statusTexto = "Atrasado";

            classeStatus = "status-atrasado";

        }
        else if (fatura.status === "Pago") {

            classeStatus = "status-pago";

        }
        else if (fatura.status === "Cancelado") {

            classeStatus = "status-cancelado";

        }

        // DATA VENCIMENTO
        const data =
            (fatura.vencimento || "")
                .split("-")
                .reverse()
                .join("/");

        // DATA PAGAMENTO
        const dataPagamento =
            fatura.data_pagamento
                ? fatura.data_pagamento
                    .split("-")
                    .reverse()
                    .join("/")
                : "-";

        // COMPROVANTE
        const comprovante =
            fatura.recibo
                ? `<a href="${fatura.recibo}"
                      target="_blank"
                      class="btn-recibo">
                      📄 Baixar
                   </a>`
                : "-";

        div.innerHTML = `

            <div class="col-vencimento">
                <strong>${data}</strong>
            </div>

            <div class="col-valor">
                R$ ${Number(fatura.valor)
                    .toFixed(2)
                    .replace(".", ",")}
            </div>

            <div class="col-pagamento">
                ${dataPagamento}
            </div>

            <div class="col-comprovante">
                ${comprovante}
            </div>

            <div class="${classeStatus}">
                ${statusTexto}
            </div>

        `;

        lista.appendChild(div);

    });

    document.getElementById(
        "modalHistorico"
    ).style.display = "flex";
}