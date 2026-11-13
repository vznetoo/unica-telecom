const express = require("express");
const cors = require("cors");
const axios = require("axios");
const FormData = require("form-data");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

console.log("======================================");
console.log("SERVIDOR INICIADO");
console.log("======================================");



// ======================================
// CONSULTA CLIENTE - SGP
// ======================================

app.get("/cliente/:cpf", async (req, res) => {

    try {

        const cpf =
            req.params.cpf.replace(/\D/g, "");

        console.log("======================================");
        console.log("CONSULTA CLIENTE");
        console.log("CPF:", cpf);
        console.log("======================================");

        const form = new FormData();

        form.append(
            "token",
            process.env.SGP_TOKEN
        );

        form.append(
            "app",
            process.env.SGP_APP
        );

        form.append(
            "cpfcnpj",
            cpf
        );

        const resposta = await axios.post(
            "https://sistema.unicatelecom.com.br/api/ura/consultacliente/",
            form,
            {
                headers: form.getHeaders(),
                timeout: 15000
            }
        );

        res.json(
            resposta.data
        );

    } catch (erro) {

        console.log(
            "ERRO CONSULTA CLIENTE:",
            erro.response?.data ||
            erro.message
        );

        res.status(
            erro.response?.status || 500
        ).json({
            erro:
                erro.response?.data ||
                erro.message
        });

    }

});


// ======================================
// STATUS INTERNET
// ======================================

app.post("/verifica-acesso", async (req, res) => {

    try {

        const {
            cpfcnpj,
            senha,
            contrato
        } = req.body;

        console.log("======================================");
        console.log("VERIFICA ACESSO");
        console.log("CPF:", cpfcnpj);
        console.log("CONTRATO:", contrato);
        console.log(
            "SENHA:",
            senha ? "OK" : "VAZIA"
        );
        console.log("======================================");

        const form = new FormData();
        form.append("token", process.env.SGP_TOKEN.trim());
form.append("app", process.env.SGP_APP.trim());

        form.append(
            "cpfcnpj",
            cpfcnpj
        );

        form.append(
            "senha",
            senha
        );

        form.append(
            "contrato",
            String(contrato)
        );

        const resposta = await axios.post(
            "https://sistema.unicatelecom.com.br/api/central/verificaacesso/",
            form,
            {
                headers: form.getHeaders(),
                timeout: 15000
            }
        );

        console.log(
            "RESPOSTA SGP:",
            resposta.data
        );

      console.log(
    "DADOS COMPLETOS DO CLIENTE:",
    JSON.stringify(resposta.data, null, 2)
);

res.json(
    resposta.data
);
    } catch (erro) {

        console.error(
            "ERRO VERIFICA ACESSO:"
        );

        console.error(
            "STATUS:",
            erro.response?.status
        );

        console.error(
            "RESPOSTA:",
            erro.response?.data ||
            erro.message
        );

        res.status(
            erro.response?.status || 500
        ).json({
            erro:
                erro.response?.data ||
                erro.message
        });

    }

});


// ======================================
// FATURAS
// ======================================

app.post("/faturas", async (req, res) => {

    try {

        const {
            cpfcnpj,
            senha,
            contrato
        } = req.body;

        const form = new FormData();

        form.append(
            "token",
            process.env.SGP_TOKEN
        );

        form.append(
            "app",
            process.env.SGP_APP
        );

        form.append(
            "cpfcnpj",
            cpfcnpj
        );

        form.append(
            "senha",
            senha
        );

        form.append(
            "contrato",
            contrato
        );

        const resposta = await axios.post(
            "https://sistema.unicatelecom.com.br/api/central/titulos/",
            form,
            {
                headers: form.getHeaders(),
                timeout: 15000
            }
        );

        res.json(
            resposta.data
        );

    } catch (erro) {

        console.log(
            "ERRO FATURAS:",
            erro.response?.data ||
            erro.message
        );

        res.status(
            erro.response?.status || 500
        ).json({
            erro:
                erro.response?.data ||
                erro.message
        });

    }

});




// ======================================
// LOGIN CENTRAL DO ASSINANTE - SGP
// ======================================

app.post("/login", async (req, res) => {
    const inicioLogin = Date.now();

    try {
        console.log("======================================");
        console.log("[LOGIN] Nova tentativa");
        console.log("======================================");

        const { login, senha, captchaToken } = req.body;

        if (!login || !senha) {
            return res.status(400).json({
                erro: "Informe seu login e senha."
            });
        }

        if (!captchaToken) {
            return res.status(400).json({
                erro: "Confirme que você não é um robô."
            });
        }

        if (!process.env.RECAPTCHA_SECRET_KEY) {
            return res.status(500).json({
                erro: "A verificação de segurança não está configurada."
            });
        }

        // Verificar reCAPTCHA
        const parametros = new URLSearchParams();
        parametros.append("secret", process.env.RECAPTCHA_SECRET_KEY);
        parametros.append("response", captchaToken);

        const verificacao = await axios.post(
            "https://www.google.com/recaptcha/api/siteverify",
            parametros.toString(),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                timeout: 10000
            }
        );

        if (verificacao.data.success !== true) {
            console.warn(
                "[LOGIN] CAPTCHA rejeitado:",
                verificacao.data["error-codes"] || []
            );

            return res.status(403).json({
                erro: "Erro no login. Tente novamente."
            });
        }

        // Dados conforme documentação do SGP

        // AUTENTICAÇÃO SGP - FORM-DATA

        const token = String(process.env.SGP_TOKEN || "").trim();
        const appSGP = String(process.env.SGP_APP || "").trim();
        const loginSGP = String(login).trim();

        if (!token || !appSGP) {
            throw new Error("Token ou App do SGP não configurado.");
        }

        const dadosSGP = new FormData();

        dadosSGP.append("token", token);
        dadosSGP.append("app", appSGP);
        dadosSGP.append("cpfcnpj", loginSGP);
        dadosSGP.append("senha", String(senha));

        console.log("[LOGIN] Enviando Form-data ao SGP.");

        const inicioSGP = Date.now();

        const resposta = await axios.post(
            "https://sistema.unicatelecom.com.br/api/central/contratos",
            dadosSGP,
            {
                headers: {
                    ...dadosSGP.getHeaders(),
                    "Accept": "application/json"
                },
                timeout: 15000
            }
        );


        console.log(
            `[TEMPO] SGP login: ${Date.now() - inicioSGP} ms`
        );

        console.log(
            `[TEMPO] Login total: ${Date.now() - inicioLogin} ms`
        );

        return res.json(resposta.data);

    } catch (erro) {
        console.error("======================================");
        console.error("[LOGIN] ERRO");
        console.error("STATUS:", erro.response?.status);
        console.error(
            "RESPOSTA SGP:",
            JSON.stringify(erro.response?.data || erro.message)
        );

        console.error(
            `[TEMPO] Login até o erro: ${Date.now() - inicioLogin} ms`
        );

        const statusSGP = erro.response?.status;

        if (statusSGP === 401 || statusSGP === 403) {
            return res.status(401).json({
                erro: "Erro no Login. Tente novamente."
            });
        }

        return res.status(500).json({
            erro: "Não foi possível realizar o login. Tente novamente."
        });
    }
});



// ======================================
// CONTRATO PDF - GET
// ======================================

app.get("/contrato/:contratoId", async (req, res) => {

    console.log("======================================");
    console.log("GERAR CONTRATO PDF");
    console.log("======================================");

    try {

        const contratoId =
            req.params.contratoId;

        console.log(
            "Contrato:",
            contratoId
        );

        const form =
            new FormData();

const tamanhoFormData = await new Promise((resolve, reject) => {
    dadosSGP.getLength((erro, tamanho) => {
        if (erro) {
            reject(erro);
        } else {
            resolve(tamanho);
        }
    });
});

const resposta = await axios.post(
    "https://sistema.unicatelecom.com.br/api/central/contratos",
    dadosSGP,
    {
        headers: {
            ...dadosSGP.getHeaders(),
            "Content-Length": tamanhoFormData,
            "Accept": "application/json"
        },
        maxBodyLength: Infinity,
        timeout: 15000
    }
);

        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        res.setHeader(
            "Content-Disposition",
            "inline; filename=contrato.pdf"
        );

        res.send(
            resposta.data
        );

    } catch (erro) {

        console.log(
            "ERRO CONTRATO:",
            erro.response?.data ||
            erro.message
        );

        res.status(500).send(
            "Erro"
        );

    }

});


// ======================================
// GERAR CONTRATO PDF - POST
// ======================================

app.post("/contrato", async (req, res) => {

    try {

        console.log(
            "BODY RECEBIDO:",
            req.body
        );

        const {
            login,
            senha
        } = req.body;

        console.log(
            "LOGIN RECEBIDO:",
            login
        );

        console.log(
            "SENHA RECEBIDA:",
            senha ? "OK" : "VAZIA"
        );

        const form =
            new FormData();

        form.append(
            "usuario",
            login
        );

        form.append(
            "senha",
            senha
        );
const inicioSGP = Date.now();
        const resposta = await axios.post(
            "https://sistema.unicatelecom.com.br/api/centralapp/contrato/print/contrato/",
            form,
            {
                headers: form.getHeaders(),
                responseType: "arraybuffer",
                timeout: 15000
            }
        );

        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        res.setHeader(
            "Content-Disposition",
            "inline; filename=contrato.pdf"
        );

        res.send(
            resposta.data
        );

    } catch (erro) {

        console.log(
            "STATUS:",
            erro.response?.status
        );

        if (erro.response?.data) {

            console.log(
                "RESPOSTA:",
                Buffer.from(
                    erro.response.data
                ).toString("utf8")
            );

        }

        console.log(
            "MESSAGE:",
            erro.message
        );

        res.status(500).send(
            "Erro"
        );

    }

});


// ======================================
// TESTE DO SERVIDOR
// ======================================

app.get("/teste", (req, res) => {

    res.send(
        "Servidor funcionando!"
    );

});


// ======================================
// BRAZ MÓVEL
// BUSCAR CLIENTE + LINHAS
// ======================================

app.get("/api/movel/cliente/:cpf", async (req, res) => {

    try {

        // ----------------------------------
        // PEGAR CPF
        // ----------------------------------

        const cpf =
            req.params.cpf.replace(/\D/g, "");

        console.log("======================================");
        console.log("BRAZ MÓVEL - CONSULTA CLIENTE");
        console.log("CPF:", cpf);
        console.log("======================================");


        // ----------------------------------
        // VALIDAR CPF
        // ----------------------------------

        if (cpf.length !== 11) {

            return res.status(400).json({
                erro: "CPF inválido."
            });

        }


        // ----------------------------------
        // VERIFICAR TOKEN
        // ----------------------------------

        const tokenExiste =
            !!process.env.BRAZ_MOVEL_TOKEN;

        console.log(
            "TOKEN BRAZ EXISTE:",
            tokenExiste
        );


        if (!tokenExiste) {

            console.error(
                "BRAZ_MOVEL_TOKEN não foi encontrado no .env"
            );

            return res.status(500).json({
                erro:
                    "Token da Braz Móvel não configurado no servidor."
            });

        }


        // ----------------------------------
        // CONSULTAR BRAZ MÓVEL
        // ----------------------------------

        const url =
            `https://api.brazmovel.com.br/v1/customer/cpf/${cpf}`;

        console.log(
            "CHAMANDO BRAZ MÓVEL:",
            url
        );


        const resposta =
            await axios.get(
                url,
                {
                    headers: {
                        Authorization:
                            `Bearer ${process.env.BRAZ_MOVEL_TOKEN}`
                    },

                    timeout: 15000
                }
            );


        // ----------------------------------
        // RESPOSTA
        // ----------------------------------

        console.log(
            "STATUS BRAZ MÓVEL:",
            resposta.status
        );

        console.log(
            "CLIENTE ENCONTRADO:",
            resposta.data?.name
        );

        console.log(
            "LINHAS ENCONTRADAS:",
            resposta.data?.lines?.length || 0
        );


        // ----------------------------------
        // DEVOLVER PARA FRONTEND
        // ----------------------------------

        res.json(
            resposta.data
        );


    } catch (erro) {

        console.log("======================================");
        console.log("ERRO BRAZ MÓVEL");
        console.log("======================================");

        console.log(
            "STATUS:",
            erro.response?.status
        );

        console.log(
            "DADOS:",
            JSON.stringify(
                erro.response?.data,
                null,
                2
            )
        );

        console.log(
            "MENSAGEM:",
            erro.message
        );


        // ----------------------------------
        // 401
        // ----------------------------------

        if (
            erro.response?.status === 401
        ) {

            return res.status(401).json({
                erro:
                    "Token da Braz Móvel inválido ou expirado."
            });

        }


        // ----------------------------------
        // 403
        // ----------------------------------

        if (
            erro.response?.status === 403
        ) {

            return res.status(403).json({
                erro:
                    "Acesso negado pela Braz Móvel. Verifique o token e as permissões da API."
            });

        }


        // ----------------------------------
        // 404
        // ----------------------------------

        if (
            erro.response?.status === 404
        ) {

            return res.status(404).json({
                erro:
                    "Cliente não encontrado na Braz Móvel."
            });

        }


        // ----------------------------------
        // OUTROS ERROS
        // ----------------------------------

        return res.status(
            erro.response?.status || 500
        ).json({
            erro:
                "Erro ao consultar cliente na Braz Móvel."
        });

    }

});


// ======================================
// BRAZ MÓVEL
// BUSCAR PLANOS DA LINHA
// ======================================

app.get("/api/movel/linha/:lineId/planos", async (req, res) => {

    try {

        const lineId =
            req.params.lineId;

        console.log("======================================");
        console.log("BRAZ MÓVEL - PLANOS DA LINHA");
        console.log("LINE ID:", lineId);
        console.log("======================================");


        // ----------------------------------
        // VALIDAR ID DA LINHA
        // ----------------------------------

        if (!lineId) {

            return res.status(400).json({
                erro:
                    "ID da linha não informado."
            });

        }


        // ----------------------------------
        // VERIFICAR TOKEN
        // ----------------------------------

        if (!process.env.BRAZ_MOVEL_TOKEN) {

            return res.status(500).json({
                erro:
                    "Token da Braz Móvel não configurado."
            });

        }


        // ----------------------------------
        // CONSULTAR PLANOS NA BRAZ
        // ----------------------------------

        const url =
            `https://api.brazmovel.com.br/v1/line/${lineId}/plan`;

        console.log(
            "CHAMANDO BRAZ MÓVEL:",
            url
        );


        const resposta =
            await axios.get(
                url,
                {
                    headers: {
                        Authorization:
                            `Bearer ${process.env.BRAZ_MOVEL_TOKEN}`
                    },

                    timeout: 15000
                }
            );


        // ----------------------------------
        // MOSTRAR RESPOSTA
        // ----------------------------------

        console.log(
            "STATUS PLANOS:",
            resposta.status
        );

        console.log(
            "PLANOS RETORNADOS:"
        );

        console.log(
            JSON.stringify(
                resposta.data,
                null,
                2
            )
        );


        // ----------------------------------
        // DEVOLVER PARA FRONTEND
        // ----------------------------------

        res.json(
            resposta.data
        );


    } catch (erro) {

        console.log("======================================");
        console.log("ERRO AO BUSCAR PLANOS");
        console.log("======================================");

        console.log(
            "STATUS:",
            erro.response?.status
        );

        console.log(
            "DADOS:",
            JSON.stringify(
                erro.response?.data,
                null,
                2
            )
        );

        console.log(
            "MENSAGEM:",
            erro.message
        );


        // ----------------------------------
        // DEVOLVER ERRO
        // ----------------------------------

        res.status(
            erro.response?.status || 500
        ).json({
            erro:
                "Erro ao consultar planos da linha na Braz Móvel."
        });

    }

});


// ======================================
// DOWNLOAD DE COMPROVANTE / RECIBO
// ======================================

app.post("/api/comprovante", async (req, res) => {

    try {

        const {
            url
        } = req.body;


        if (!url) {

            return res.status(400).json({
                erro:
                    "URL não informada."
            });

        }


        console.log("======================================");
        console.log(
            "BAIXANDO COMPROVANTE:",
            url
        );
        console.log("======================================");


        const resposta =
            await axios.get(
                url,
                {
                    responseType:
                        "arraybuffer",

                    timeout:
                        15000,

                    headers: {
                        "User-Agent":
                            "Mozilla/5.0"
                    }
                }
            );


        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        res.setHeader(
            "Content-Disposition",
            "attachment; filename=comprovante-pagamento.pdf"
        );


        res.send(
            resposta.data
        );


    } catch (erro) {

        console.log(
            "ERRO AO BAIXAR COMPROVANTE:",
            erro.message
        );

        res.status(500).json({
            erro:
                "Erro ao baixar o comprovante do servidor externo."
        });

    }

});


// ======================================
// INICIAR SERVIDOR
// ======================================


const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log("======================================");
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log("======================================");
});


app.get("/api/movel/linha/:lineId/usage", async (req, res) => {
    try {
        const lineId = req.params.lineId;

        console.log("======================================");
        console.log("BRAZ MÓVEL - CONSUMO DA LINHA");
        console.log("LINE ID:", lineId);
        console.log("======================================");

        const url =
            `https://api.brazmovel.com.br/v1/line/${lineId}/usage`;

        const resposta = await axios.get(url, {
            headers: {
                Authorization:
                    `Bearer ${process.env.BRAZ_MOVEL_TOKEN}`
            },
            timeout: 15000
        });

        console.log("STATUS USAGE:", resposta.status);

        console.log("CONSUMO RETORNADO:");
        console.log(
            JSON.stringify(resposta.data, null, 2)
        );

        res.json(resposta.data);

    } catch (erro) {

        console.log("======================================");
        console.log("ERRO AO BUSCAR CONSUMO");
        console.log("======================================");

        console.log("STATUS:", erro.response?.status);

        console.log(
            "DADOS:",
            JSON.stringify(
                erro.response?.data,
                null,
                2
            )
        );

        console.log("MENSAGEM:", erro.message);

        res.status(
            erro.response?.status || 500
        ).json({
            erro:
                "Erro ao consultar consumo da linha na Braz Móvel."
        });
    }
});
