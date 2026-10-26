// ==========================================================
// URL PÚBLICA DA API
// ==========================================================

const API_BASE_URL = "https://sistema.unicatelecom.com.br";

// ======================================
// CARREGAMENTO E INICIALIZAÇÃO
// ======================================

const dadosCliente = JSON.parse(localStorage.getItem("dadosCliente"));
const clienteString = localStorage.getItem("contratoFibra");

const cliente = clienteString && clienteString !== "undefined"
    ? JSON.parse(clienteString)
    : null;

const contratoSelecionado = cliente;

let contratosFibra = [];

if (dadosCliente && dadosCliente.contratos) {
    contratosFibra = dadosCliente.contratos.filter(c => c.planointernet);
}

let faturasCliente = [];
let faturaAtualObjeto = null;


// Garante que o código corre apenas após o HTML estar totalmente carregado
document.addEventListener("DOMContentLoaded", () => {

    if (!cliente) {
        console.warn("Nenhum contrato encontrado no localStorage.");
        return;
    }

    const nomeCliente = document.getElementById("nomeCliente");

    if (nomeCliente) {
        nomeCliente.innerText =
            cliente.razaoSocial ||
            cliente.razaosocial ||
            "";
    }

    const emailCliente = document.getElementById("emailCliente");

    if (emailCliente) {
        emailCliente.innerText =
            cliente.emails?.[0]?.contato ||
            "E-mail não informado";
    }

    const telefoneCliente = document.getElementById("telefoneCliente");

    if (telefoneCliente) {
        telefoneCliente.innerText =
            cliente.telefones?.map(t => t.contato).join(" | ") ||
            "Telefone não informado";
    }


const elPlano = document.getElementById('nomePlanoMobile');

    if (elPlano) {
        const nomePlano =
            cliente.planointernet ||
            cliente.servico_plano ||
            "";

        // Procura estritamente por números seguidos de MB ou GB logo no início ou em qualquer parte
        const match = nomePlano.match(/(\d+)\s*(MB|GB)/i);

        if (match) {
            // Junta apenas o número e a unidade (ex:  + MB -> 100MB)
            elPlano.innerText = (match[1] + match[2]).toUpperCase();
        } else {
            elPlano.innerText =
                nomePlano.toUpperCase() ||
                "PLANO RESIDENCIAL";
        }
    }
    const elVencimentoPlano =
        document.getElementById("vencimentoPlanoMobile");

    if (elVencimentoPlano && cliente.cobVencimento) {

        elVencimentoPlano.innerText =
            `Dia ${cliente.cobVencimento}`;
    }

    // Busca o status real da conexão no SGP
    verificarStatusConexao();

    carregarFaturas();
    inicializarMenuUsuario();
    inicializarBotoesAcao();
});


// ======================================
// STATUS DA CONEXÃO
// ======================================

function atualizarStatusConexao(online) {

    const bolinha =
        document.getElementById("bolinhaStatus");

    const textoStatus =
        document.getElementById("statusConexao");

    if (!bolinha || !textoStatus) return;

    if (online) {

        bolinha.className = "bolinha online";
        bolinha.style.background = "#22c55e";
        textoStatus.innerText = "Online";

    } else {

        bolinha.className = "bolinha offline";
        bolinha.style.background = "#ef4444";
        textoStatus.innerText = "Offline";
    }
}


async function verificarStatusConexao() {
    try {
        const contratoAtual = JSON.parse(
            localStorage.getItem("contratoFibra") || "null"
        );

        const senha = contratoAtual?.contratoCentralSenha;

        console.log("CONTRATO USADO:", contratoAtual);

        const resposta = await fetch(
            `${API_BASE_URL}/verifica-acesso`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    cpfcnpj: contratoAtual?.cpfCnpj,
                    senha: senha,
                    contrato: contratoAtual?.contratoId
                })
            }
        );

        const dados = await resposta.json();

        console.log(
            "RESPOSTA COMPLETA DO SGP:",
            JSON.stringify(dados, null, 2)
        );

        if (!resposta.ok) {
            console.error("ERRO HTTP:", resposta.status, dados);
            atualizarStatusConexao(false);
            return;
        }

        console.log("STATUS SGP:", dados.status);
        console.log("MENSAGEM SGP:", dados.msg);

        atualizarStatusConexao(Number(dados.status) === 1);

      } catch (erro) {
        console.error("Erro ao verificar conexão:", erro);
    }
}
// ======================================
// FATURAS E AVALIAÇÃO DE CORES/STATUS
// ======================================

async function carregarFaturas() {

    if (!contratoSelecionado) return;

    try {

        const resposta = await fetch(
            `${API_BASE_URL}/faturas`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    cpfcnpj:
                        contratoSelecionado.cpfCnpj,

                    senha:
                        contratoSelecionado.contratoCentralSenha,

                    contrato:
                        contratoSelecionado.contratoId
                })
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                `Erro ao buscar faturas: ${resposta.status}`
            );
        }

        if (!dados.faturas || dados.faturas.length === 0) {

            document.getElementById(
                "valorFaturaMobile"
            ).innerText = "Nenhuma fatura";

            avaliarEstadoEaplicar(
                "--/--/----",
                "Vencimento:"
            );

            return;
        }

        faturasCliente = [...dados.faturas];

        const faturasAbertas =
            faturasCliente.filter(
                f =>
                    (f.status || "")
                        .trim()
                        .toUpperCase() === "GERADO"
            );

        faturasAbertas.sort(
            (a, b) =>
                new Date(a.vencimento) -
                new Date(b.vencimento)
        );

        faturaAtualObjeto =
            faturasAbertas[0] ||
            faturasCliente[0];

        if (!faturaAtualObjeto) {

            document.getElementById(
                "valorFaturaMobile"
            ).innerText = "Nenhuma fatura";

            avaliarEstadoEaplicar(
                "--/--/----",
                "Vencimento:"
            );

            return;
        }

        window.pixAtual =
            faturaAtualObjeto.codigopix || "";

        const valorPlano =
            Number(faturaAtualObjeto.valor);

        if (!isNaN(valorPlano)) {

            document.getElementById(
                "valorFaturaMobile"
            ).innerText =
                `R$ ${valorPlano
                    .toFixed(2)
                    .replace(".", ",")}`;

        } else {

            console.log(
                "Valor inválido:",
                faturaAtualObjeto.valor
            );
        }

        let dataFormatada =
            "--/--/----";

        if (faturaAtualObjeto.vencimento) {

            const dataPura =
                faturaAtualObjeto.vencimento
                    .split("T")[0];

            const partes =
                dataPura.split("-");

            if (partes.length === 3) {

                dataFormatada =
                    `${partes[2]}/${partes[1]}/${partes[0]}`;
            }
        }

        avaliarEstadoEaplicar(
            dataFormatada,
            "Vencimento:"
        );

        aplicarEstadoFinanceiro(
            faturaAtualObjeto,
            dataFormatada
        );

    } catch (erro) {

        console.error(
            "Erro ao carregar faturas:",
            erro
        );

        avaliarEstadoEaplicar(
            "--/--/----",
            "Vencimento:"
        );
    }
}

// ==========================================
// AVALIAÇÃO DE ESTADO
// ==========================================

function avaliarEstadoEaplicar(dataFormatada, textoRotuloPadrao) {

    const statusSgp =
        (cliente.status || "").toLowerCase();

    const statusDisplay =
        (cliente.contratoStatusDisplay || "").toLowerCase();

    const statusCombinado =
        `${statusSgp} ${statusDisplay}`;

    const estaSuspenso =
        statusCombinado.includes("suspenso") ||
        statusCombinado.includes("susp");

    const estaReduzido =
        statusCombinado.includes("reduzido") ||
        statusCombinado.includes("reduz") ||
        statusCombinado.includes("bloqueio");

    // IMPORTANTE:
    // Fatura vencida NÃO altera o status do plano.

    if (estaSuspenso) {

        aplicarCoresEstadoCliente(
            "suspenso",
            dataFormatada,
            "Vencida em"
        );

    } else if (estaReduzido) {

        aplicarCoresEstadoCliente(
            "reduzido",
            dataFormatada,
            "Vencida em"
        );

    } else {

        aplicarCoresEstadoCliente(
            "em-dia",
            dataFormatada,
            textoRotuloPadrao
        );
    }
}

// ==========================================
// APLICADOR DINÂMICO DE CORES DA TELA
// ==========================================

function aplicarCoresEstadoCliente(
    estado,
    dataFormatada,
    textoRotulo
) {

    const sidebar =
        document.querySelector(".sidebar");

    const caixaCliente =
        document.querySelector(".cliente");

    const iconePlanoCard =
        document.querySelector(
            ".card-plano-mobile .icone-card"
        );

    const iconeFaturaCard =
        document.querySelector(
            ".card-fatura-mobile .icone-card"
        );

    const blocoVencimento =
        document.getElementById(
            "blocoVencimentoMobile"
        );

    const containerTopoFatura =
        document.querySelector(
            ".card-fatura-mobile .fatura-info-topo"
        );

    const statusPlanoMobile =
        document.getElementById(
            "statusPlanoMobile"
        );

    const statusConexao =
        document.getElementById(
            "statusConexao"
        );

    const bolinhaStatus =
        document.getElementById(
            "bolinhaStatus"
        );

    const elDataVencimento =
        document.getElementById(
            "dataVencimentoMobile"
        );

    const detalheItemStatus =
        statusPlanoMobile
            ? statusPlanoMobile.closest(
                ".detalhe-item"
            )
            : null;

    const iconeStatusPlano =
        detalheItemStatus
            ? detalheItemStatus.querySelector("i")
            : null;

    const iconeCalendarioPlano =
        document.getElementById(
            "iconeCalendarioPlano"
        );


    if (elDataVencimento) {

        elDataVencimento.innerText =
            dataFormatada;
    }


    if (blocoVencimento) {

        blocoVencimento.innerHTML =
            `<i class="fa-regular fa-clock"></i>
             <span>${textoRotulo}:</span>
             <strong>${dataFormatada}</strong>`;
    }


    if (!sidebar || !caixaCliente) return;


    // Limpa classes anteriores
    sidebar.classList.remove(
        "alerta-reduzido",
        "alerta-suspenso"
    );

    caixaCliente.classList.remove(
        "caixa-cliente-reduzido"
    );

    if (containerTopoFatura) {

        containerTopoFatura.classList.remove(
            "fatura-alerta"
        );
    }


    // ======================================
    // SUSPENSO
    // ======================================

    if (estado === "suspenso") {

        sidebar.classList.add(
            "alerta-suspenso"
        );

        caixaCliente.classList.add(
            "caixa-cliente-reduzido"
        );

        if (containerTopoFatura) {

            containerTopoFatura.classList.add(
                "fatura-alerta"
            );
        }

        if (iconePlanoCard) {

            iconePlanoCard.classList.add(
                "icone-reduzido"
            );
        }

        if (iconeFaturaCard) {

            iconeFaturaCard.classList.add(
                "icone-reduzido"
            );
        }

        if (detalheItemStatus) {

            detalheItemStatus.classList.add(
                "status-alerta-laranja"
            );
        }


        // Ícone Meu Plano em vermelho
        if (iconePlanoCard) {

            iconePlanoCard.style.setProperty(
                "background-color",
                "#fff1f2",
                "important"
            );

            iconePlanoCard.style.setProperty(
                "color",
                "#dc2626",
                "important"
            );
        }


        // Ícone da fatura em vermelho
        if (iconeFaturaCard) {

            iconeFaturaCard.style.setProperty(
                "background-color",
                "#fff1f2",
                "important"
            );

            iconeFaturaCard.style.setProperty(
                "color",
                "#dc2626",
                "important"
            );

            const iconeInternoFatura =
                iconeFaturaCard.querySelector("i");

            if (iconeInternoFatura) {

                iconeInternoFatura.style.setProperty(
                    "color",
                    "#dc2626",
                    "important"
                );
            }
        }


        // Calendário vermelho
        if (iconeCalendarioPlano) {

            iconeCalendarioPlano.style.setProperty(
                "color",
                "#dc2626",
                "important"
            );
        }


        if (blocoVencimento) {

            blocoVencimento.className =
                "fatura-vencimento-mobile alerta-vencido";

            blocoVencimento.style.background =
                "#fff1f2";

            blocoVencimento.style.color =
                "#e11d48";

            blocoVencimento.style.border =
                "1px solid #fecdd3";
        }


        if (statusPlanoMobile) {

            statusPlanoMobile.innerText =
                "Suspenso";

            statusPlanoMobile.style.setProperty(
                "color",
                "#dc2626",
                "important"
            );
        }

        // Exibe o triângulo vermelho no status
        if (iconeStatusPlano) {
            iconeStatusPlano.className = "fa-solid fa-triangle-exclamation";
            iconeStatusPlano.style.setProperty("color", "#dc2626", "important");
        }


    // ======================================
    // VELOCIDADE REDUZIDA
    // ======================================

    } else if (estado === "reduzido") {

        sidebar.classList.add(
            "alerta-reduzido"
        );

        caixaCliente.classList.add(
            "caixa-cliente-reduzido"
        );

        if (containerTopoFatura) {

            containerTopoFatura.classList.add(
                "fatura-alerta"
            );
        }

        if (iconePlanoCard) {

            iconePlanoCard.classList.add(
                "icone-reduzido"
            );
        }

        if (iconeFaturaCard) {

            iconeFaturaCard.classList.add(
                "icone-reduzido"
            );
        }

        if (detalheItemStatus) {

            detalheItemStatus.classList.add(
                "status-alerta-laranja"
            );
        }


        // Calendário laranja
        if (iconeCalendarioPlano) {

            iconeCalendarioPlano.style.setProperty(
                "color",
                "#ea580c",
                "important"
            );
        }


        if (blocoVencimento) {

            blocoVencimento.className =
                "fatura-vencimento-mobile alerta-vencido";

            blocoVencimento.style.background =
                "#fff1f2";

            blocoVencimento.style.color =
                "#e11d48";

            blocoVencimento.style.border =
                "1px solid #fecdd3";
        }


        if (statusPlanoMobile) {

            statusPlanoMobile.innerText =
                "Velocidade reduzida";

            statusPlanoMobile.style.setProperty(
                "color",
                "#f97316",
                "important"
            );
        }

        // Exibe o triângulo laranja no status
        if (iconeStatusPlano) {
            iconeStatusPlano.className = "fa-solid fa-triangle-exclamation";
            iconeStatusPlano.style.setProperty("color", "#ea580c", "important");
        }


    // ======================================
    // ATIVO
    // ======================================

    } else {

        if (iconePlanoCard) {

            iconePlanoCard.classList.remove(
                "icone-reduzido"
            );

            iconePlanoCard.style.setProperty(
                "background-color",
                "#eef8f1",
                "important"
            );

            iconePlanoCard.style.setProperty(
                "color",
                "#00b140",
                "important"
            );
        }


        if (iconeFaturaCard) {

            iconeFaturaCard.classList.remove(
                "icone-reduzido"
            );

            iconeFaturaCard.style.setProperty(
                "background-color",
                "#eef8f1",
                "important"
            );

            iconeFaturaCard.style.setProperty(
                "color",
                "#00b140",
                "important"
            );

            const iconeInternoFatura =
                iconeFaturaCard.querySelector("i");

            if (iconeInternoFatura) {

                iconeInternoFatura.style.setProperty(
                    "color",
                    "#00b140",
                    "important"
                );
            }
        }


        // Calendário volta ao padrão
        if (iconeCalendarioPlano) {

            iconeCalendarioPlano.style.removeProperty(
                "color"
            );
        }


        if (detalheItemStatus) {

            detalheItemStatus.classList.remove(
                "status-alerta-laranja"
            );

            detalheItemStatus.style.setProperty(
                "color",
                "#00b140",
                "important"
            );
        }


        if (iconeStatusPlano) {

            // Troca o ícone para um sinal de verificação (Check) verde
            iconeStatusPlano.className = "fa-solid fa-circle-check";

            iconeStatusPlano.style.setProperty(
                "color",
                "#00b140",
                "important"
            );
        }


        if (blocoVencimento) {

            blocoVencimento.className =
                "fatura-vencimento-mobile";

            blocoVencimento.style.background =
                "#f8fafc";

            blocoVencimento.style.color =
                "#334155";

            blocoVencimento.style.border =
                "1px solid #e2e8f0";
        }


        if (statusPlanoMobile) {

            statusPlanoMobile.innerText =
                "Ativo";

            statusPlanoMobile.style.setProperty(
                "color",
                "#00b140",
                "important"
            );
        }
    }
}


// ======================================
// GESTÃO DO MENU DO UTILIZADOR
// ======================================

function inicializarMenuUsuario() {

    const btnUser =
        document.querySelector(
            ".btn-user-sidebar"
        );

    const menuUser =
        document.querySelector(
            ".menu-usuario-sidebar"
        );

    if (btnUser && menuUser) {

        btnUser.addEventListener(
            "click",
            e => {

                e.stopPropagation();

                menuUser.classList.toggle(
                    "ativo"
                );
            }
        );


        document.addEventListener(
            "click",
            e => {

                if (
                    !menuUser.contains(e.target) &&
                    !btnUser.contains(e.target)
                ) {

                    menuUser.classList.remove(
                        "ativo"
                    );
                }
            }
        );
    }
}


// ======================================
// ASSOCIAÇÃO DOS BOTÕES
// ======================================

function inicializarBotoesAcao() {

    const botoesCopiar =
        document.querySelectorAll("button");

    botoesCopiar.forEach(btn => {

        if (
            btn.innerText.includes(
                "Copiar PIX"
            )
        ) {

            btn.addEventListener(
                "click",
                () => {

                    if (window.pixAtual) {

                        navigator.clipboard
                            .writeText(
                                window.pixAtual
                            )
                            .then(() => {

                                alertPersonalizado(
                                    "Código PIX copiado com sucesso!"
                                );

                            })
                            .catch(err => {

                                console.error(
                                    "Erro ao copiar PIX:",
                                    err
                                );
                            });

                    } else {

                        alertPersonalizado(
                            "Código PIX indisponível no momento."
                        );
                    }
                }
            );
        }


        if (
            btn.innerText.includes(
                "Histórico"
            )
        ) {

            btn.addEventListener(
                "click",
                () => {

                    abrirHistoricoFaturas();
                }
            );
        }
    });
}


// ======================================
// MODAIS BONITOS E CENTRALIZADOS
// ======================================

function alertPersonalizado(
    mensagem,
    onOk
) {

    const overlayAntigo =
        document.getElementById(
            "modalOverlayPersonalizado"
        );

    if (overlayAntigo) {
        overlayAntigo.remove();
    }


    const overlay =
        document.createElement("div");

    overlay.id =
        "modalOverlayPersonalizado";

    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        backdrop-filter: blur(2px);
    `;


    const caixa =
        document.createElement("div");

    caixa.style.cssText = `
        background: #ffffff;
        padding: 24px;
        border-radius: 16px;
        width: 90%;
        max-width: 340px;
        text-align: center;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        font-family: inherit;
        animation: escalaModal 0.2s ease-in-out;
        position: relative;
    `;


    caixa.innerHTML = `
        <button
            id="fecharModalX"
            style="
                position: absolute;
                top: 12px;
                right: 12px;
                background: #ffffff;
                border: 1px solid rgba(16, 185, 129, 0.3);
                color: #047857;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 13px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            "
            onmouseover="this.style.background='#fee2e2';this.style.color='#ef4444';this.style.borderColor='#fca5a5';"
            onmouseout="this.style.background='#ffffff';this.style.color='#047857';this.style.borderColor='rgba(16, 185, 129, 0.3)';"
        >
            <i class="fa-solid fa-xmark"></i>
        </button>

        <div
            style="
                font-size: 36px;
                color: #00b140;
                margin-bottom: 12px;
                margin-top: 8px;
            "
        >
            <i class="fa-solid fa-circle-info"></i>
        </div>

        <p
            style="
                color: #1e293b;
                font-size: 16px;
                font-weight: 500;
                margin-bottom: 20px;
                line-height: 1.4;
            "
        >
            ${mensagem}
        </p>

        <button
            id="btnOkModal"
            style="
                background: #00b140;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                width: 100%;
            "
        >
            OK
        </button>
    `;


    overlay.appendChild(caixa);

    document.body.appendChild(
        overlay
    );


    document
        .getElementById("btnOkModal")
        .addEventListener(
            "click",
            () => {

                overlay.remove();

                if (onOk) {
                    onOk();
                }
            }
        );


    document
        .getElementById("fecharModalX")
        .addEventListener(
            "click",
            () => {

                overlay.remove();
            }
        );


    overlay.addEventListener(
        "click",
        e => {

            if (e.target === overlay) {
                overlay.remove();
            }
        }
    );
}


function confirmarPersonalizado(
    mensagem,
    onSim
) {

    const overlayAntigo =
        document.getElementById(
            "modalOverlayPersonalizado"
        );

    if (overlayAntigo) {
        overlayAntigo.remove();
    }


    const overlay =
        document.createElement("div");

    overlay.id =
        "modalOverlayPersonalizado";

    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        backdrop-filter: blur(2px);
    `;


    const caixa =
        document.createElement("div");

    caixa.style.cssText = `
        background: #ffffff;
        padding: 24px;
        border-radius: 16px;
        width: 90%;
        max-width: 340px;
        text-align: center;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        font-family: inherit;
        animation: escalaModal 0.2s ease-in-out;
    `;


    caixa.innerHTML = `
        <div
            style="
                font-size: 36px;
                color: #00b140;
                margin-bottom: 12px;
            "
        >
            <i class="fa-solid fa-right-from-bracket"></i>
        </div>

        <p
            style="
                color: #1e293b;
                font-size: 16px;
                font-weight: 500;
                margin-bottom: 20px;
                line-height: 1.4;
            "
        >
            ${mensagem}
        </p>

        <div
            style="
                display: flex;
                gap: 10px;
            "
        >

            <button
                id="btnNaoModal"
                style="
                    background: #f1f5f9;
                    color: #475569;
                    border: none;
                    padding: 12px;
                    border-radius: 8px;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    flex: 1;
                "
            >
                Não
            </button>

            <button
                id="btnSimModal"
                style="
                    background: #00b140;
                    color: white;
                    border: none;
                    padding: 12px;
                    border-radius: 8px;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    flex: 1;
                "
            >
                Sim
            </button>

        </div>
    `;


    overlay.appendChild(caixa);

    document.body.appendChild(
        overlay
    );


    document
        .getElementById("btnSimModal")
        .addEventListener(
            "click",
            () => {

                overlay.remove();

                if (onSim) {
                    onSim();
                }
            }
        );


    document
        .getElementById("btnNaoModal")
        .addEventListener(
            "click",
            () => {

                overlay.remove();
            }
        );
}


// ======================================
// AÇÕES DOS BOTÕES DO MENU DO UTILIZADOR
// ======================================

function abrirAtualizacaoDados() {

    console.log(
        "Atualizar dados acionado."
    );

    alertPersonalizado(
        "Você será direcionado para um de nossos atendentes.",
        () => {

            window.open(
                "https://unicatelecom.web.vmix.chat/",
                "_blank"
            );
        }
    );
}


// ======================================
// ABRIR CONFIRMAÇÃO DE SAÍDA
// ======================================

function abrirModalSair() {

    const modal =
        document.getElementById("modalSair");

    if (modal) {

        modal.style.display = "flex";
    }
}


// ======================================
// FECHAR CONFIRMAÇÃO DE SAÍDA
// ======================================

function fecharModalSair() {

    const modal =
        document.getElementById("modalSair");

    if (modal) {

        modal.style.display = "none";
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
// HISTÓRICO DE FATURAS
// ======================================

window.fecharHistorico =
    function () {

        let modal =
            document.getElementById(
                "modalHistorico"
            ) ||
            document.querySelector(
                ".modal"
            );

        if (modal) {
            modal.style.display =
                "none";
        }
    };


function abrirHistoricoFaturas() {

    console.log(
        "Abrir histórico acionado."
    );

    let modal =
        document.getElementById(
            "modalHistorico"
        ) ||
        document.querySelector(
            ".modal"
        );


    if (modal) {

        modal.style.display =
            "flex";

        modal.style.alignItems =
            "center";

        modal.style.justifyContent =
            "center";

        modal.style.backgroundColor =
            "rgba(15, 23, 42, 0.65)";

        modal.style.backdropFilter =
            "blur(6px)";


        const conteudoModal =
            modal.querySelector(
                ".modal-conteudo"
            ) ||
            modal.querySelector(
                "div"
            );


        if (conteudoModal) {

            conteudoModal.style.cssText = `
                background: linear-gradient(
                    135deg,
                    #f0fdf4 0%,
                    #ffffff 60%
                );

                width: 95%;
                max-width: 840px;
                max-height: 85vh;
                border-radius: 20px;
                padding: 24px;

                box-shadow:
                    0 25px 50px -12px rgba(0, 0, 0, 0.25),
                    0 0 0 1px rgba(0, 177, 64, 0.12);

                display: flex;
                flex-direction: column;
                font-family: inherit;
                position: relative;
                box-sizing: border-box;
                border-top: 5px solid #10b981;
            `;


            conteudoModal
                .querySelectorAll(
                    "h2, .titulo-historico"
                )
                .forEach(el => {

                    if (
                        !el.closest(
                            ".modal-header-custom"
                        )
                    ) {

                        el.style.display =
                            "none";
                    }
                });


            if (
                !conteudoModal.querySelector(
                    ".modal-header-custom"
                )
            ) {

                const headerCustom =
                    document.createElement(
                        "div"
                    );

                headerCustom.className =
                    "modal-header-custom";

                headerCustom.style.cssText = `
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                    border-bottom: 1px solid rgba(16, 185, 129, 0.15);
                    padding-bottom: 12px;
                `;


                headerCustom.innerHTML = `
                    <div>

                        <h2
                            style="
                                margin: 0;
                                font-size: 20px;
                                font-weight: 700;
                                color: #064e3b;
                                letter-spacing: -0.5px;
                            "
                        >
                            Histórico de Faturas
                        </h2>

                        <p
                            style="
                                margin: 2px 0 0 0;
                                font-size: 12px;
                                color: #047857;
                            "
                        >
                            Consulte o seu registo de pagamentos.
                        </p>

                    </div>

                    <button
                        onclick="fecharHistorico()"
                        style="
                            background: #ffffff;
                            border: 1px solid rgba(16, 185, 129, 0.3);
                            color: #047857;
                            width: 34px;
                            height: 34px;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            font-size: 14px;
                            flex-shrink: 0;
                            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
                        "
                        onmouseover="this.style.background='#fee2e2';this.style.color='#ef4444';this.style.borderColor='#fca5a5';"
                        onmouseout="this.style.background='#ffffff';this.style.color='#047857';this.style.borderColor='rgba(16, 185, 129, 0.3)';"
                    >
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                `;

                conteudoModal.prepend(
                    headerCustom
                );
            }
        }


        modal
            .querySelectorAll("button")
            .forEach(btn => {

                if (
                    btn.textContent
                        .toLowerCase()
                        .includes("fechar") &&
                    !btn.closest(
                        ".modal-header-custom"
                    )
                ) {

                    btn.style.display =
                        "none";
                }
            });


        const corpoTabela =
            document.getElementById(
                "corpoTabelaHistorico"
            ) ||
            document.getElementById(
                "tabelaHistorico"
            ) ||
            modal.querySelector(
                "tbody"
            );


        if (corpoTabela) {

            corpoTabela.innerHTML =
                "";


            if (
                !faturasCliente ||
                faturasCliente.length === 0
            ) {

                corpoTabela.innerHTML = `
                    <tr>
                        <td
                            colspan="4"
                            style="
                                text-align: center;
                                padding: 20px;
                                color: #065f46;
                            "
                        >
                            Nenhuma fatura encontrada.
                        </td>
                    </tr>
                `;

                return;
            }


            faturasCliente.forEach(
                fatura => {

                    let dataVenc =
                        fatura.vencimento ||
                        "";

                    let vencimentoFmt =
                        "--/--/----";


                    if (dataVenc) {

                        let dataPura =
                            dataVenc.split("T")[0];

                        let partesData =
                            dataPura.split("-");

                        if (
                            partesData.length === 3
                        ) {

                            vencimentoFmt =
                                `${partesData[2]}/${partesData[1]}/${partesData[0]}`;
                        }
                    }


                    let valorBruto =
                        fatura.valor ??
                        fatura.valorcorrigido ??
                        0;


                    if (
                        typeof valorBruto ===
                        "string"
                    ) {

                        valorBruto =
                            valorBruto
                                .replace(
                                    "R$",
                                    ""
                                )
                                .trim();

                        if (
                            valorBruto.includes(",") &&
                            !valorBruto.includes(".")
                        ) {

                            valorBruto =
                                valorBruto.replace(
                                    ",",
                                    "."
                                );
                        }
                    }


                    let valorFmt =
                        Number(valorBruto)
                            .toFixed(2)
                            .replace(".", ",");


                    let dataPag =
                        fatura.data_pagamento ||
                        fatura.datapagamento ||
                        "";


                    let statusFat =
                        (fatura.status || "")
                            .trim()
                            .toUpperCase();


                    const hoje =
                        new Date();

                    hoje.setHours(
                        0,
                        0,
                        0,
                        0
                    );


                    const dataVencimento =
                        new Date(
                            (fatura.vencimento || "")
                                .split("T")[0] +
                            "T00:00:00"
                        );


                    const faturaEmAtraso =
                        statusFat === "GERADO" &&
                        dataVencimento < hoje;


                    let valorEStatusHTML =
                        "";


                    if (
                        dataPag ||
                        statusFat === "PAGO" ||
                        statusFat === "LIQUIDADO" ||
                        statusFat === "RECEBIDO"
                    ) {

                        valorEStatusHTML = `
                            <div
                                style="
                                    display:flex;
                                    flex-direction:column;
                                    align-items:flex-start;
                                "
                            >

                                <span
                                    style="
                                        color:#047857;
                                        font-weight:700;
                                        font-size:13px;
                                        white-space:nowrap;
                                    "
                                >
                                    R$ ${valorFmt}
                                </span>

                                <span
                                    style="
                                        background:#d1fae5;
                                        color:#065f46;
                                        font-size:9px;
                                        font-weight:700;
                                        padding:1px 5px;
                                        border-radius:4px;
                                        text-transform:uppercase;
                                        margin-top:2px;
                                        letter-spacing:0.3px;
                                    "
                                >
                                    Pago
                                </span>

                            </div>
                        `;

                    } else if (faturaEmAtraso) {

                        valorEStatusHTML = `
                            <div
                                style="
                                    display:flex;
                                    flex-direction:column;
                                    align-items:flex-start;
                                "
                            >

                                <span
                                    style="
                                        color:#991b1b;
                                        font-weight:700;
                                        font-size:13px;
                                        white-space:nowrap;
                                    "
                                >
                                    R$ ${valorFmt}
                                </span>

                                <span
                                    style="
                                        background:#ef4444;
                                        color:#ffffff;
                                        font-size:9px;
                                        font-weight:700;
                                        padding:2px 6px;
                                        border-radius:4px;
                                        border:1px solid #fca5a5;
                                        text-transform:uppercase;
                                        margin-top:2px;
                                        letter-spacing:0.3px;
                                    "
                                >
                                    Gerado (fatura em atraso)
                                </span>

                            </div>
                        `;

                    } else {

                        valorEStatusHTML = `
                            <div
                                style="
                                    display:flex;
                                    flex-direction:column;
                                    align-items:flex-start;
                                "
                            >

                                <span
                                    style="
                                        color:#0f172a;
                                        font-weight:700;
                                        font-size:13px;
                                        white-space:nowrap;
                                    "
                                >
                                    R$ ${valorFmt}
                                </span>

                                <span
                                    style="
                                        background:#f1f5f9;
                                        color:#475569;
                                        font-size:9px;
                                        font-weight:600;
                                        padding:1px 5px;
                                        border-radius:4px;
                                        text-transform:uppercase;
                                        margin-top:2px;
                                        letter-spacing:0.3px;
                                    "
                                >
                                    ${fatura.status || "Em aberto"}
                                </span>

                            </div>
                        `;
                    }


                    let dataPagFmt =
                        "--/--/----";


                    if (dataPag) {

                        let dataPuraPag =
                            dataPag.split("T")[0];

                        let partesPag =
                            dataPuraPag.split("-");

                        if (
                            partesPag.length === 3
                        ) {

                            dataPagFmt =
                                `${partesPag[2]}/${partesPag[1]}/${partesPag[0]}`;

                        } else {

                            dataPagFmt =
                                dataPag;
                        }

                    } else {

                        dataPagFmt = `
                            <span
                                style="
                                    color: #94a3b8;
                                    font-weight: 500;
                                "
                            >
                                -
                            </span>
                        `;
                    }


                    let urlDocumento = "";
                    let textoBotao = "Baixar";


                    if (
                        dataPag ||
                        statusFat === "PAGO" ||
                        statusFat === "LIQUIDADO" ||
                        statusFat === "RECEBIDO"
                    ) {
                        // USAR DIRETAMENTE A PROPRIEDADE RECIBO DA FATURA
                        urlDocumento =
                            fatura.recibo ||
                            fatura.link_completo ||
                            fatura.link;

                        textoBotao =
                            "Recibo";

                    } else {

                        urlDocumento =
                            fatura.link_completo ||
                            fatura.link;

                        textoBotao =
                            "Boleto";
                    }


                    let botaoBaixar = "";


                    if (
                        urlDocumento &&
                        urlDocumento !== "#"
                    ) {

                        let urlFinal =
                            urlDocumento.startsWith(
                                "http"
                            )
                                ? urlDocumento
                                : `https://unicatelecom.sgplocal.com.br${urlDocumento}`;


                        botaoBaixar = `
                            <button
                                onclick="baixarComprovante('${urlFinal}')"
                                style="
                                    background: #059669;
                                    color: white;
                                    padding: 5px 12px;
                                    border: none;
                                    border-radius: 6px;
                                    text-decoration: none;
                                    font-size: 12px;
                                    font-weight: 600;
                                    display: inline-flex;
                                    align-items: center;
                                    gap: 5px;
                                    cursor: pointer;
                                    box-shadow: 0 2px 4px rgba(5,150,105,0.2);
                                    white-space: nowrap;
                                    transition: background 0.2s;
                                "
                                onmouseover="this.style.background='#047857'"
                                onmouseout="this.style.background='#059669'"
                            >
                                <i
                                    class="fa-solid fa-download"
                                    style="font-size: 11px;"
                                ></i>
                                ${textoBotao}
                            </button>
                        `;

                    } else {

                        botaoBaixar = `
                            <span
                                style="
                                    color: #64748b;
                                    font-size: 11px;
                                    background: rgba(255,255,255,0.7);
                                    padding: 4px 10px;
                                    border-radius: 6px;
                                    border: 1px solid rgba(16, 185, 129, 0.2);
                                    white-space: nowrap;
                                "
                            >
                                Indisponível
                            </span>
                        `;
                    }


                    const linha =
                        document.createElement(
                            "tr"
                        );


                    if (faturaEmAtraso) {

                        linha.style.backgroundColor =
                            "#fee2e2";

                        linha.style.border =
                            "1px solid #ef4444";

                        linha.style.borderRadius =
                            "8px";

                        linha.style.boxShadow =
                            "0 0 0 1px rgba(239,68,68,0.15)";


                        linha.onmouseover =
                            () => {

                                linha.style.backgroundColor =
                                    "#fecaca";
                            };


                        linha.onmouseout =
                            () => {

                                linha.style.backgroundColor =
                                    "#fee2e2";
                            };
                    }


                    linha.style.transition =
                        "background-color 0.2s";


                    linha.innerHTML = `
                        <td
                            style="
                                padding: 10px 12px;
                                text-align: left;
                                color: #064e3b;
                                font-size: 13px;
                                font-weight: 500;
                                width: 22%;
                            "
                        >
                            ${vencimentoFmt}
                        </td>

                        <td
                            style="
                                padding: 10px 12px;
                                text-align: left;
                                width: 26%;
                            "
                        >
                            ${valorEStatusHTML}
                        </td>

                        <td
                            style="
                                padding: 10px 12px;
                                text-align: center;
                                color: #064e3b;
                                font-size: 13px;
                                font-weight: 500;
                                width: 24%;
                            "
                        >
                            ${dataPagFmt}
                        </td>

                        <td
                            style="
                                padding: 10px 12px;
                                text-align: center;
                                width: 28%;
                            "
                        >
                            ${botaoBaixar}
                        </td>
                    `;


                    corpoTabela.appendChild(
                        linha
                    );
                }
            );


            const tabelaPai =
                corpoTabela.closest(
                    "table"
                );


            if (tabelaPai) {

                tabelaPai.style.width =
                    "100%";

                tabelaPai.style.borderCollapse =
                    "collapse";


                const cabecalho =
                    tabelaPai.querySelector(
                        "thead"
                    );


                if (cabecalho) {

                    cabecalho.style.display =
                        "table-header-group";


                    cabecalho.innerHTML = `
                        <tr>

                            <th
                                style="
                                    padding: 8px 12px;
                                    text-align: left;
                                    color: #047857;
                                    font-size: 11px;
                                    text-transform: uppercase;
                                    font-weight: 700;
                                    letter-spacing: 0.5px;
                                    border-bottom: 2px solid rgba(16, 185, 129, 0.2);
                                    width: 22%;
                                "
                            >
                                Vencimento
                            </th>

                            <th
                                style="
                                    padding: 8px 12px;
                                    text-align: left;
                                    color: #047857;
                                    font-size: 11px;
                                    text-transform: uppercase;
                                    font-weight: 700;
                                    letter-spacing: 0.5px;
                                    border-bottom: 2px solid rgba(16, 185, 129, 0.2);
                                    width: 26%;
                                "
                            >
                                Valor
                            </th>

                            <th
                                style="
                                    padding: 8px 12px;
                                    text-align: center;
                                    color: #047857;
                                    font-size: 11px;
                                    text-transform: uppercase;
                                    font-weight: 700;
                                    letter-spacing: 0.5px;
                                    border-bottom: 2px solid rgba(16, 185, 129, 0.2);
                                    width: 24%;
                                "
                            >
                                Data de pagamento
                            </th>

                            <th
                                style="
                                    padding: 8px 12px;
                                    text-align: center;
                                    color: #047857;
                                    font-size: 11px;
                                    text-transform: uppercase;
                                    font-weight: 700;
                                    letter-spacing: 0.5px;
                                    border-bottom: 2px solid rgba(16, 185, 129, 0.2);
                                    width: 28%;
                                "
                            >
                                Recibo
                            </th>

                        </tr>
                    `;
                }


                if (
                    !tabelaPai.parentElement.classList.contains(
                        "tabela-scroll-wrapper"
                    )
                ) {

                    const wrapper =
                        document.createElement(
                            "div"
                        );

                    wrapper.className =
                        "tabela-scroll-wrapper";

                    wrapper.style.cssText =
                        "overflow-y: auto; max-height: 52vh; padding-right: 2px;";

                    tabelaPai.parentNode.insertBefore(
                        wrapper,
                        tabelaPai
                    );

                    wrapper.appendChild(
                        tabelaPai
                    );
                }
            }
        }

    } else {

        alertPersonalizado(
            "Modal de histórico não encontrada no HTML."
        );
    }
}


// ======================================
// SPEEDTEST
// ======================================

function abrirSpeedtest() {

    window.location.href =
        "https://unicatelecom.speedtestcustom.com/";
}


// ======================================
// MENU USUÁRIO SIDEBAR
// ======================================

function toggleMenuUsuarioSidebar() {

    const sidebar =
        document.getElementById(
            "sidebar-usuario"
        );

    if (sidebar) {

        sidebar.classList.toggle(
            "ativo"
        );
    }
}
function aplicarEstadoFinanceiro(fatura, dataFormatada) {
    const cardFatura =
        document.getElementById("cardFaturaMobile") ||
        document.querySelector(".card-fatura-mobile");

    const tituloFatura =
        document.getElementById("tituloFatura");

    const valorFatura =
        document.getElementById("valorFaturaMobile");

    const iconeCarteira =
        cardFatura?.querySelector(".icone-card");

    const iconeCarteiraInterno =
        iconeCarteira?.querySelector("i");

    const blocoVencimento =
        document.getElementById("blocoVencimentoMobile");

    if (!cardFatura || !blocoVencimento) return;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    let vencimento = null;

    if (fatura?.vencimento) {
        const partes =
            fatura.vencimento
                .split("T")[0]
                .split("-")
                .map(Number);

        if (partes.length === 3) {
            vencimento = new Date(
                partes[0],
                partes[1] - 1,
                partes[2]
            );

            vencimento.setHours(0, 0, 0, 0);
        }
    }

    const statusFatura =
        (fatura?.status || "")
            .trim()
            .toUpperCase();

    const vencida =
        statusFatura === "GERADO" &&
        vencimento &&
        hoje > vencimento;

    // ==========================================
    // CALCULA DIAS DE ATRASO
    // ==========================================

    let diasAtraso = 0;

    if (vencida) {
        const diferenca =
            hoje.getTime() - vencimento.getTime();

        diasAtraso =
            Math.floor(
                diferenca / (1000 * 60 * 60 * 24)
            );
    }

    // ==========================================
    // FATURA VENCIDA
    // ==========================================

    if (vencida) {

        // Título vermelho com quantidade de dias
        if (tituloFatura) {

            const textoAtraso =
                diasAtraso === 1
                    ? "1 dia de atraso"
                    : `${diasAtraso} dias de atraso`;

            tituloFatura.innerText =
                `Fatura Atual (${textoAtraso})`;

            tituloFatura.style.setProperty(
                "color",
                "#ef4444",
                "important"
            );
        }

        // Valor continua preto
        if (valorFatura) {
            valorFatura.style.setProperty(
                "color",
                "#222",
                "important"
            );
        }

        // Ícone vermelho
        if (iconeCarteira) {
            iconeCarteira.style.setProperty(
                "background-color",
                "#fef2f2",
                "important"
            );

            iconeCarteira.style.setProperty(
                "color",
                "#ef4444",
                "important"
            );
        }

        if (iconeCarteiraInterno) {
            iconeCarteiraInterno.style.setProperty(
                "color",
                "#ef4444",
                "important"
            );
        }

        // Vencimento vermelho
        blocoVencimento.classList.add(
            "alerta-vencido"
        );

        blocoVencimento.style.setProperty(
            "background",
            "#fef2f2",
            "important"
        );

        blocoVencimento.style.setProperty(
            "color",
            "#dc2626",
            "important"
        );

        blocoVencimento.style.setProperty(
            "border",
            "none",
            "important"
        );

        blocoVencimento.innerHTML = `
            <i
                class="fa-regular fa-clock"
                style="color: #ef4444 !important;"
            ></i>

            <span style="color: #dc2626 !important; font-weight: 600;">
                Vencida em:
            </span>

            <strong
                id="dataVencimentoMobile"
                style="color: #dc2626 !important;"
            >
                ${dataFormatada}
            </strong>
        `;

    } else {

        // ==========================================
        // FATURA EM DIA
        // ==========================================

        if (tituloFatura) {

            tituloFatura.innerText =
                "Fatura Atual";

            tituloFatura.style.setProperty(
                "color",
                "#00b140",
                "important"
            );
        }

        // Valor normal
        if (valorFatura) {
            valorFatura.style.setProperty(
                "color",
                "#222",
                "important"
            );
        }

        // Ícone verde
        if (iconeCarteira) {

            iconeCarteira.classList.remove(
                "icone-reduzido"
            );

            iconeCarteira.style.setProperty(
                "background-color",
                "#eef8f1",
                "important"
            );

            iconeCarteira.style.setProperty(
                "color",
                "#00b140",
                "important"
            );
        }

        if (iconeCarteiraInterno) {
            iconeCarteiraInterno.style.setProperty(
                "color",
                "#00b140",
                "important"
            );
        }

        // Vencimento normal
        blocoVencimento.classList.remove(
            "alerta-vencido"
        );

        blocoVencimento.style.setProperty(
            "background",
            "#f8fafc",
            "important"
        );

        blocoVencimento.style.setProperty(
            "color",
            "#334155",
            "important"
        );

        blocoVencimento.style.setProperty(
            "border",
            "1px solid #e2e8f0",
            "important"
        );

        blocoVencimento.innerHTML = `
            <i class="fa-regular fa-clock"></i>

            <span>
                Vencimento:
            </span>

            <strong
                id="dataVencimentoMobile"
            >
                ${dataFormatada}
            </strong>
        `;
    }
}

// ======================================
// FUNÇÃO PARA BAIXAR COMPROVANTE VIA BACKEND
// ======================================

async function baixarComprovante(url) {
    try {
        const resposta = await fetch(
            `${API_BASE_URL}/comprovante`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ url })
            }
        );

        if (!resposta.ok) {
            throw new Error(
                "Não foi possível obter o comprovante."
            );
        }

        const blob = await resposta.blob();
        const urlBlob = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = urlBlob;
        link.download = "comprovante-pagamento.pdf";

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(urlBlob);

    } catch (erro) {
        console.error(
            "Erro ao baixar comprovante:",
            erro
        );

        window.open(url, "_blank");
    }
}
function abrirConfirmacaoVolta() {

    // ======================================
    // PC: VOLTA DIRETO
    // ======================================

    if (window.innerWidth > 768) {

        window.location.href = "servicos.html";

        return;
    }


    // ======================================
    // MOBILE: ABRE CONFIRMAÇÃO
    // ======================================

    const modal =
        document.getElementById("modalVoltar");

    if (modal) {

        modal.style.display = "flex";
    }
}


// ======================================
// CONFIRMAR VOLTA
// ======================================

window.confirmarVolta = function () {

    window.location.href =
        "servicos.html";
};


// ======================================
// FECHAR CONFIRMAÇÃO
// ======================================

window.fecharConfirmacaoVolta = function () {

    const modal =
        document.getElementById("modalVoltar");

    if (modal) {

        modal.style.display = "none";
    }
};


// ======================================
// DEIXA A FUNÇÃO DISPONÍVEL NO HTML
// ======================================

window.abrirConfirmacaoVolta =
    abrirConfirmacaoVolta;