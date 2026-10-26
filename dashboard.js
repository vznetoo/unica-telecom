const API_BASE_URL = "https://sistema.unicatelecom.com.br";


// ======================================
// WHATSAPP
// ======================================

function abrirWhatsapp() {

    window.open(
        "https://wa.link/f5i0wy",
        "_blank"
    );
}


// ======================================
// FORMATA O NÚMERO
// ======================================

function formatarNumeroLinha(numero) {

    let limpo =
        String(numero).replace(/\D/g, "");

    // Remove 55 caso venha com código do Brasil
    if (limpo.startsWith("55")) {

        limpo =
            limpo.substring(2);
    }

    // Celular com 11 dígitos
    if (limpo.length === 11) {

        const ddd =
            limpo.substring(0, 2);

        const celular =
            limpo.substring(2);

        return `(${ddd}) ${celular.substring(0, 5)}-${celular.substring(5)}`;
    }

    // Telefone com 10 dígitos
    if (limpo.length === 10) {

        const ddd =
            limpo.substring(0, 2);

        const telefone =
            limpo.substring(2);

        return `(${ddd}) ${telefone.substring(0, 4)}-${telefone.substring(4)}`;
    }

    return numero;
}


// ======================================
// PEGA O CPF DO CLIENTE
// ======================================

function pegarCPF() {

    // ======================================
    // 1. CONTRATO MÓVEL
    // ======================================

    const contratoMovel =
        localStorage.getItem("contratoMovel");

    if (contratoMovel) {

        try {

            const cliente =
                JSON.parse(contratoMovel);

            const cpf =
                cliente.cpfCnpj ||
                cliente.cpfcnpj ||
                cliente.cpf ||
                cliente.CPF;

            if (cpf) {

                return String(cpf)
                    .replace(/\D/g, "");
            }

        } catch (erro) {

            console.error(
                "Erro ao ler contratoMovel:",
                erro
            );
        }
    }


    // ======================================
    // 2. DADOS CLIENTE
    // ======================================

    const dadosCliente =
        localStorage.getItem("dadosCliente");

    if (dadosCliente) {

        try {

            const dados =
                JSON.parse(dadosCliente);


            const cpfDireto =
                dados.cpfCnpj ||
                dados.cpfcnpj ||
                dados.cpf ||
                dados.CPF;

            if (cpfDireto) {

                return String(cpfDireto)
                    .replace(/\D/g, "");
            }


            if (
                dados.contratos &&
                Array.isArray(dados.contratos)
            ) {

                for (
                    const contrato of dados.contratos
                ) {

                    const cpf =
                        contrato.cpfCnpj ||
                        contrato.cpfcnpj ||
                        contrato.cpf ||
                        contrato.CPF;

                    if (cpf) {

                        return String(cpf)
                            .replace(/\D/g, "");
                    }
                }
            }

        } catch (erro) {

            console.error(
                "Erro ao ler dadosCliente:",
                erro
            );
        }
    }


    // ======================================
    // 3. FALLBACK
    // ======================================

    const cpfSalvo =
        localStorage.getItem("cpf") ||
        localStorage.getItem("clienteCpf");

    if (cpfSalvo) {

        return String(cpfSalvo)
            .replace(/\D/g, "");
    }


    console.warn(
        "CPF do cliente não encontrado."
    );

    return null;
}


// ======================================
// CARREGA A LINHA ESCOLHIDA
// ======================================

async function carregarLinhaMovel() {

    try {

        const linhaSalva =
            localStorage.getItem(
                "linhaMovelSelecionada"
            );


        console.log(
            "Linha salva:",
            linhaSalva
        );


        if (!linhaSalva) {

            console.error(
                "Nenhuma linha móvel foi selecionada."
            );

            return;
        }


        const linha =
            JSON.parse(linhaSalva);


        console.log(
            "Linha escolhida:",
            linha
        );


        // ======================================
        // TIPO DE SIM
        // ======================================

        const tipoSimEl =
            document.getElementById(
                "tipoSimMovel"
            );


        if (tipoSimEl) {

            const tipoSim =
                String(
                    linha.type || ""
                ).toUpperCase();


            if (tipoSim === "ESIM") {

                tipoSimEl.innerText =
                    "E-SIM";

            } else if (tipoSim === "SIM") {

                tipoSimEl.innerText =
                    "SIM";

            } else {

                tipoSimEl.innerText =
                    "Não informado";
            }
        }


        // ======================================
        // NÚMERO
        // ======================================

        const numeroEl =
            document.getElementById(
                "numeroLinhaMovel"
            );


        if (numeroEl) {

            numeroEl.innerText =
                formatarNumeroLinha(
                    linha.msisdn
                );
        }


        // ======================================
        // STATUS
        // ======================================

        let status =
            String(
                linha.status || ""
            ).toUpperCase();


        if (status === "ACTIVE") {

            status = "Ativo";

        } else if (status === "BLOCKED") {

            status = "Bloqueado";

        } else if (status === "PRE_ACTIVE") {

            status = "Pré-ativo";

        } else if (status === "INACTIVE") {

            status = "Inativo";

        } else if (!status) {

            status = "Ativo";
        }


        const statusLinhaEl =
            document.getElementById(
                "statusLinhaMovel"
            );


        if (statusLinhaEl) {

            statusLinhaEl.innerText =
                status;
        }


        // ======================================
        // BUSCAR PLANOS
        // ======================================

        console.log(
            "Buscando planos da linha..."
        );


        const resposta =
            await fetch(
                `${API_BASE_URL}/api/movel/linha/${linha.id}/planos`
            );


        if (!resposta.ok) {

            throw new Error(
                `Erro ao buscar planos: ${resposta.status}`
            );
        }


        const dadosPlanos =
            await resposta.json();


        console.log(
            "Planos recebidos:",
            dadosPlanos
        );


        // ======================================
        // PLANO ATIVO
        // ======================================

        const planoAtivo =
            dadosPlanos.items?.find(
                plano =>
                    String(
                        plano.status || ""
                    ).toUpperCase() === "ACTIVE"
            ) ||
            (
                Array.isArray(
                    dadosPlanos.items
                ) &&
                dadosPlanos.items.length === 1
                    ? dadosPlanos.items[0]
                    : null
            );


        if (!planoAtivo) {

            console.warn(
                "Nenhum plano ativo encontrado."
            );


            const planoEl =
                document.getElementById(
                    "planoMovel"
                );


            if (planoEl) {

                planoEl.innerText =
                    "Plano não identificado";
            }


            return;
        }


        // ======================================
        // NOME DO PLANO
        // ======================================

        let nomePlano =
            planoAtivo.product?.title ||
            "Plano Móvel";


        nomePlano =
            nomePlano.replace(
                /^Braz Móvel/i,
                "Plano Móvel"
            );


        const planoEl =
            document.getElementById(
                "planoMovel"
            );


        if (planoEl) {

            planoEl.innerText =
                nomePlano;
        }


        // ======================================
        // STATUS DO PLANO
        // ======================================

        const statusPlanoEl =
            document.getElementById(
                "statusPlanoMovel"
            );


        if (statusPlanoEl) {

            statusPlanoEl.innerText =
                "Ativo";
        }


        // ======================================
        // VALIDADE
        // ======================================

        const validadeEl =
            document.getElementById(
                "validadePlanoMovel"
            );


        if (planoAtivo.endDate) {

            const dataFim =
                new Date(
                    planoAtivo.endDate
                );


            const dataFormatada =
                dataFim.toLocaleDateString(
                    "pt-BR",
                    {
                        timeZone:
                            "America/Recife"
                    }
                );


            const horaFormatada =
                dataFim.toLocaleTimeString(
                    "pt-BR",
                    {
                        timeZone:
                            "America/Recife",
                        hour:
                            "2-digit",
                        minute:
                            "2-digit"
                    }
                );


            const agora =
                new Date();


            const diferenca =
                dataFim.getTime() -
                agora.getTime();


            const diasRestantes =
                Math.max(
                    0,
                    Math.ceil(
                        diferenca /
                        (1000 * 60 * 60 * 24)
                    )
                );


            let textoDias;


            if (diasRestantes === 0) {

                textoDias =
                    "0 dias restantes";

            } else if (diasRestantes === 1) {

                textoDias =
                    "1 dia restante";

            } else {

                textoDias =
                    `${diasRestantes} dias restantes`;
            }


            if (validadeEl) {

                validadeEl.innerHTML = `
                    <span>
                        O plano irá expirar em ${dataFormatada} às ${horaFormatada}
                    </span>

                    <span
                        style="
                            color: #00b140 !important;
                            font-weight: 700;
                        "
                    >
                        (${textoDias})
                    </span>
                `;
            }
        }


        // ======================================
        // CONSUMO
        // ======================================

        console.log(
            "Buscando consumo da linha..."
        );


        const respostaUso =
            await fetch(
                `${API_BASE_URL}/api/movel/linha/${linha.id}/usage`
            );


        if (!respostaUso.ok) {

            throw new Error(
                `Erro ao buscar consumo: ${respostaUso.status}`
            );
        }


        const dadosUso =
            await respostaUso.json();


        console.log(
            "CONSUMO RECEBIDO:",
            dadosUso
        );


        // ======================================
        // BYTES → GB
        // ======================================

        function bytesParaGB(bytes) {

            return bytes /
                (1024 * 1024 * 1024);
        }


        const totalGB =
            bytesParaGB(
                dadosUso.total
            );


        const restanteGB =
            bytesParaGB(
                dadosUso.remaining
            );


        const usadoGB =
            totalGB -
            restanteGB;


        // ======================================
        // PORCENTAGEM
        // ======================================

        const porcentagemUsada =
            totalGB > 0
                ? (usadoGB / totalGB) * 100
                : 0;


        const porcentagem =
            Math.round(
                porcentagemUsada
            );


        // ======================================
        // FORMATAÇÃO
        // ======================================

        const restanteFormatado =
            restanteGB
                .toFixed(2)
                .replace(".", ",");


        const totalFormatado =
            totalGB
                .toFixed(2)
                .replace(".", ",");


        const usadoFormatado =
            usadoGB
                .toFixed(2)
                .replace(".", ",");


        // ======================================
        // PERCENTUAL
        // ======================================

        const consumoPercentualEl =
            document.querySelector(
                ".card-consumo .consumo-percentual strong"
            );


        if (consumoPercentualEl) {

            consumoPercentualEl.innerText =
                `${porcentagem}%`;
        }


        // ======================================
        // BARRA
        // ======================================

        const barraProgressoEl =
            document.querySelector(
                ".card-consumo .consumo-barra-progresso"
            );


        if (barraProgressoEl) {

            barraProgressoEl.style.width =
                `${porcentagem}%`;
        }


        // ======================================
        // LEGENDA
        // ======================================

        const consumoLegenda =
            document.querySelector(
                ".card-consumo .consumo-legenda"
            );


        if (consumoLegenda) {

            const utilizadoEl =
                consumoLegenda.querySelector(
                    "span"
                );


            const restanteEl =
                consumoLegenda.querySelector(
                    "strong"
                );


            if (utilizadoEl) {

                utilizadoEl.innerText =
                    `${usadoFormatado} GB utilizados`;
            }


            if (restanteEl) {

                restanteEl.innerText =
                    `${restanteFormatado} GB restantes`;
            }
        }


        // ======================================
        // DETALHAMENTO
        // ======================================

        const consumoDetalhes =
            document.querySelector(
                ".card-consumo .consumo-detalhes"
            );


        if (consumoDetalhes) {

            let html = "";


            if (
                Array.isArray(
                    dadosUso.types
                )
            ) {

                dadosUso.types.forEach(
                    tipo => {

                        const restanteTipo =
                            bytesParaGB(
                                tipo.remaining
                            );


                        const restanteTipoFormatado =
                            restanteTipo
                                .toFixed(2)
                                .replace(
                                    ".",
                                    ","
                                );


                        const descricao =
                            tipo.description ||
                            "Dados";


                        const descricaoNormalizada =
                            descricao.toLowerCase();


                        const classeBolinha =
                            descricaoNormalizada.includes(
                                "youtube"
                            )
                                ? "bolinha-vermelha"
                                : "bolinha-verde";


                        html += `
                            <div class="consumo-item">

                                <span class="consumo-item-titulo">

                                    <span class="bolinha ${classeBolinha}"></span>

                                    ${descricao}

                                </span>

                                <strong>
                                    ${restanteTipoFormatado} GB
                                </strong>

                            </div>
                        `;
                    }
                );
            }


            html += `
                <div class="consumo-total">

                    <span>
                        Franquia total
                    </span>

                    <strong>
                        ${totalFormatado} GB
                    </strong>

                </div>
            `;


            consumoDetalhes.innerHTML =
                html;
        }


        // ======================================
        // DEBUG
        // ======================================

        console.log(
            "TOTAL:",
            totalFormatado,
            "GB"
        );

        console.log(
            "USADO:",
            usadoFormatado,
            "GB"
        );

        console.log(
            "RESTANTE:",
            restanteFormatado,
            "GB"
        );

        console.log(
            "PORCENTAGEM:",
            porcentagem + "%"
        );

    }
    catch (erro) {

        console.error(
            "Erro ao carregar linha móvel:",
            erro
        );
    }
}


// ======================================
// DOM CONTENT LOADED
// ======================================

document.addEventListener(
    "DOMContentLoaded",
    () => {


        // ======================================
        // DADOS DO CLIENTE
        // ======================================

        const dadosClienteSalvos =
            localStorage.getItem(
                "dadosCliente"
            );


        if (dadosClienteSalvos) {

            try {

                const dados =
                    JSON.parse(
                        dadosClienteSalvos
                    );


                const cliente =
                    dados.contratos?.[0];


                if (!cliente) {

                    console.warn(
                        "Nenhum contrato encontrado em dadosCliente."
                    );

                } else {


                    // ======================================
                    // NOME
                    // ======================================

                    const nomeEl =
                        document.getElementById(
                            "nomeCliente"
                        );


                    if (nomeEl) {

                        nomeEl.innerText =
                            cliente.razaoSocial ||
                            cliente.razaosocial ||
                            cliente.nome ||
                            "Cliente";
                    }


                    // ======================================
                    // CPF
                    // ======================================

                    const cpfEl =
                        document.getElementById(
                            "cpfCliente"
                        );


                    if (cpfEl) {

                        let cpf =
                            cliente.cpfCnpj ||
                            cliente.cpfcnpj ||
                            cliente.cpf ||
                            cliente.CPF ||
                            "";


                        cpf =
                            String(cpf).replace(
                                /\D/g,
                                ""
                            );


                        if (cpf.length === 11) {

                            cpf =
                                cpf.replace(
                                    /(\d{3})(\d{3})(\d{3})(\d{2})/,
                                    "$1.$2.$3-$4"
                                );
                        }


                        cpfEl.innerText =
                            cpf ||
                            "CPF não informado";
                    }


                    // ======================================
                    // E-MAIL
                    // ======================================

                    const emailEl =
                        document.getElementById(
                            "emailCliente"
                        );


                    if (emailEl) {

                        emailEl.innerText =
                            cliente.emails?.[0]?.contato ||
                            "E-mail não informado";
                    }


                    console.log(
                        "CLIENTE CARREGADO:",
                        cliente
                    );
                }

            } catch (erro) {

                console.error(
                    "Erro ao carregar dadosCliente:",
                    erro
                );
            }

        } else {

            console.warn(
                "Nenhum dadosCliente encontrado no localStorage."
            );
        }


        // ======================================
        // CARREGA LINHA
        // ======================================

        carregarLinhaMovel();

    }
);


// ======================================
// MENU DO USUÁRIO
// ======================================

function toggleMenuUsuarioSidebar() {

    const menu =
        document.getElementById(
            "menuUsuarioSidebar"
        );


    if (!menu) {

        return;
    }


    if (
        menu.style.display === "block"
    ) {

        menu.style.display =
            "none";

    } else {

        menu.style.display =
            "block";
    }
}
// ======================================
// FECHAR MENU AO CLICAR FORA
// ======================================

document.addEventListener("click", function (event) {

    const menu =
        document.getElementById("menuUsuarioSidebar");

    const perfil =
        document.querySelector(
            ".perfil-sidebar-container"
        );

    if (!menu || !perfil) {
        return;
    }

    // Se clicou fora do perfil/menu
    if (!perfil.contains(event.target)) {

        menu.style.display = "none";
    }

});

// ======================================
// ABRIR MODAL DE SAÍDA
// ======================================

function abrirModalSair() {

    // Fecha o menu do bonequinho
    const menu =
        document.getElementById(
            "menuUsuarioSidebar"
        );


    if (menu) {

        menu.style.display =
            "none";
    }


    // Abre confirmação
    const modal =
        document.getElementById(
            "modalSair"
        );


    if (modal) {

        modal.style.display =
            "flex";
    }
}


// ======================================
// FECHAR MODAL DE SAÍDA
// ======================================

function fecharModalSair() {

    const modal =
        document.getElementById(
            "modalSair"
        );


    if (modal) {

        modal.style.display =
            "none";
    }
}


// ======================================
// CONFIRMAR SAÍDA
// ======================================

function confirmarSaida() {

    window.location.href =
        "login.html";
}


// ======================================
// ATUALIZAR DADOS
// ======================================

// ======================================
// ATUALIZAR DADOS
// ======================================

function abrirAtualizacaoDados() {

    const modal =
        document.getElementById(
            "modalAtualizarDados"
        );

    if (modal) {

        modal.style.display = "flex";
    }
}


// ======================================
// FECHAR MODAL ATUALIZAR DADOS
// ======================================

function fecharAtualizacaoDados() {

    const modal =
        document.getElementById(
            "modalAtualizarDados"
        );

    if (modal) {

        modal.style.display = "none";
    }
}


// ======================================
// CONFIRMAR ATUALIZAÇÃO
// ======================================

function confirmarAtualizacaoDados() {

    window.open(
        "https://unicatelecom.web.vmix.chat/",
        "_blank"
    );

    fecharAtualizacaoDados();
}


// ======================================
// VOLTAR PARA SERVIÇOS
// ======================================

function abrirConfirmacaoVolta() {

    // PC: volta direto
    if (window.innerWidth > 768) {

        window.location.href =
            "servicos.html";

        return;
    }


    // MOBILE: abre confirmação
    const modal =
        document.getElementById(
            "modalVoltar"
        );


    if (modal) {

        modal.style.display =
            "flex";
    }
}


// ======================================
// CONFIRMAR VOLTA
// ======================================

function confirmarVolta() {

    window.location.href =
        "servicos.html";
}


// ======================================
// FECHAR CONFIRMAÇÃO
// ======================================

function fecharConfirmacaoVolta() {

    const modal =
        document.getElementById(
            "modalVoltar"
        );


    if (modal) {

        modal.style.display =
            "none";
    }
}