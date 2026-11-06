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
        const cpf = req.params.cpf.replace(/\D/g, "");

        console.log("CONSULTA CLIENTE - CPF:", cpf);

        const form = new FormData();

        form.append("token", process.env.SGP_TOKEN);
        form.append("app", process.env.SGP_APP);
        form.append("cpfcnpj", cpf);

        const resposta = await axios.post(
            "https://sistema.unicatelecom.com.br/api/ura/consultacliente/",
            form,
            {
                headers: form.getHeaders(),
                timeout: 15000
            }
        );

        return res.json(resposta.data);

    } catch (erro) {
        console.error(
            "ERRO CONSULTA CLIENTE:",
            erro.response?.data || erro.message
        );

        return res.status(erro.response?.status || 500).json({
            erro: erro.response?.data || erro.message
        });
    }
});


// ======================================
// STATUS INTERNET
// ======================================

app.post("/verifica-acesso", async (req, res) => {
    try {
        const { cpfcnpj, senha, contrato } = req.body;

        if (!process.env.SGP_TOKEN || !process.env.SGP_APP) {
            return res.status(500).json({
                erro: "Autenticação do SGP não configurada."
            });
        }

        console.log("======================================");
        console.log("VERIFICA ACESSO");
        console.log("CPF:", cpfcnpj);
        console.log("CONTRATO:", contrato);
        console.log("SENHA:", senha ? "OK" : "VAZIA");
        console.log("======================================");

        const form = new FormData();

        form.append("token", process.env.SGP_TOKEN.trim());
        form.append("app", process.env.SGP_APP.trim());
        form.append("cpfcnpj", cpfcnpj);
        form.append("senha", senha);
        form.append("contrato", String(contrato));

        const resposta = await axios.post(
            "https://sistema.unicatelecom.com.br/api/central/verificaacesso/",
            form,
            {
                headers: form.getHeaders(),
                timeout: 15000
            }
        );

        console.log("RESPOSTA SGP:", resposta.data);

        console.log(
            "DADOS COMPLETOS DO CLIENTE:",
            JSON.stringify(resposta.data, null, 2)
        );

        return res.json(resposta.data);

    } catch (erro) {
        console.error("ERRO VERIFICA ACESSO:");
        console.error("STATUS:", erro.response?.status);
        console.error(
            "RESPOSTA:",
            erro.response?.data || erro.message
        );

        return res.status(erro.response?.status || 500).json({
            erro: erro.response?.data || erro.message
        });
    }
});


// ======================================
// FATURAS
// ======================================

app.post("/faturas", async (req, res) => {
    try {
        const { cpfcnpj, senha, contrato } = req.body;

        const form = new FormData();

        form.append("token", process.env.SGP_TOKEN);
        form.append("app", process.env.SGP_APP);
        form.append("cpfcnpj", cpfcnpj);
        form.append("senha", senha);
        form.append("contrato", contrato);

        const resposta = await axios.post(
            "https://sistema.unicatelecom.com.br/api/central/titulos/",
            form,
            {
                headers: form.getHeaders(),
                timeout: 15000
            }
        );

        return res.json(resposta.data);

    } catch (erro) {
        console.error(
            "ERRO FATURAS:",
            erro.response?.data || erro.message
        );

        return res.status(erro.response?.status || 500).json({
            erro: erro.response?.data || erro.message
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

        // VALIDAR CAPTCHA

        if (!captchaToken) {
            return res.status(400).json({
                erro: "Confirme que você não é um robô."
            });
        }

        if (!process.env.RECAPTCHA_SECRET_KEY) {
            console.error("RECAPTCHA_SECRET_KEY não configurada.");

            return res.status(500).json({
                erro: "A verificação de segurança não está configurada."
            });
        }

        const inicioCaptcha = Date.now();

        const parametros = new URLSearchParams();

        parametros.append(
            "secret",
            process.env.RECAPTCHA_SECRET_KEY
        );

        parametros.append(
            "response",
            captchaToken
        );

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

        console.log(
            `[TEMPO] CAPTCHA: ${Date.now() - inicioCaptcha} ms`
        );

        if (verificacao.data.success !== true) {
            console.warn(
                "CAPTCHA REJEITADO:",
                verificacao.data["error-codes"] || []
            );

            return res.status(403).json({
                erro: "Erro no login. Tente novamente."
            });
        }

        // VALIDAR CONFIGURAÇÃO SGP

        if (!process.env.SGP_TOKEN || !process.env.SGP_APP) {
            console.error("Credenciais do SGP não configuradas.");

            return res.status(500).json({
                erro: "A autenticação do SGP não está configurada."
            });
        }

        // PREPARAR LOGIN SGP

        const loginSGP = String(login).trim();

        const form = new FormData();

        form.append("token", process.env.SGP_TOKEN.trim());
        form.append("app", process.env.SGP_APP.trim());
        form.append("cpfcnpj", loginSGP);
        form.append("usuario", loginSGP);
        form.append("senha", senha);

        console.log("[LOGIN] Enviando dados ao SGP.");

        const inicioSGP = Date.now();

        const resposta = await axios.post(
            "https://sistema.unicatelecom.com.br/api/central/contratos",
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    Accept: "application/json"
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

        console.log("[LOGIN] Resposta recebida do SGP.");

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
    try {
        const contratoId = req.params.contratoId;

        console.log("GERAR CONTRATO PDF:", contratoId);

        const form = new FormData();

        const resposta = await axios.post(
            "https://sistema.unicatelecom.com.br/api/centralapp/contrato/print/contrato/",
            form,
            {
                headers: form.getHeaders(),
                responseType: "arraybuffer",
                timeout: 15000
            }
        );

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            "inline; filename=contrato.pdf"
        );

        return res.send(resposta.data);

    } catch (erro) {
        console.error(
            "ERRO CONTRATO:",
            erro.response?.data || erro.message
        );

        return res.status(500).send("Erro");
    }
});


// ======================================
// GERAR CONTRATO PDF - POST
// ======================================

app.post("/contrato", async (req, res) => {
    try {
        const { login, senha } = req.body;

        console.log("GERAR CONTRATO PDF");
        console.log("LOGIN RECEBIDO:", login);
        console.log("SENHA RECEBIDA:", senha ? "OK" : "VAZIA");

        const form = new FormData();

        form.append("usuario", login);
        form.append("senha", senha);

        const resposta = await axios.post(
            "https://sistema.unicatelecom.com.br/api/centralapp/contrato/print/contrato/",
            form,
            {
                headers: form.getHeaders(),
                responseType: "arraybuffer",
                timeout: 15000
            }
        );

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            "inline; filename=contrato.pdf"
        );

        return res.send(resposta.data);

    } catch (erro) {
        console.error("ERRO AO GERAR CONTRATO:");
        console.error("STATUS:", erro.response?.status);

        if (erro.response?.data) {
            console.error(
                "RESPOSTA:",
                Buffer.from(erro.response.data).toString("utf8")
            );
        }

        console.error("MESSAGE:", erro.message);

        return res.status(500).send("Erro");
    }
});


// ======================================
// TESTE DO SERVIDOR
// ======================================

app.get("/teste", (req, res) => {
    res.send("Servidor funcionando!");
});


// ======================================
// BRAZ MÓVEL - BUSCAR CLIENTE + LINHAS
// ======================================

app.get("/api/movel/cliente/:cpf", async (req, res) => {
    try {
        const cpf = req.params.cpf.replace(/\D/g, "");

        console.log("======================================");
        console.log("BRAZ MÓVEL - CONSULTA CLIENTE");
        console.log("CPF:", cpf);
        console.log("======================================");

        if (cpf.length !== 11) {
            return res.status(400).json({
                erro: "CPF inválido."
            });
        }

        if (!process.env.BRAZ_MOVEL_TOKEN) {
            console.error("BRAZ_MOVEL_TOKEN não configurado.");

            return res.status(500).json({
                erro: "Token da Braz Móvel não configurado no servidor."
            });
        }

        const url =
            `https://api.brazmovel.com.br/v1/customer/cpf/${cpf}`;

        console.log("CHAMANDO BRAZ MÓVEL:", url);

        const resposta = await axios.get(url, {
            headers: {
                Authorization:
                    `Bearer ${process.env.BRAZ_MOVEL_TOKEN}`
            },
            timeout: 15000
        });

        console.log("STATUS BRAZ MÓVEL:", resposta.status);
        console.log("CLIENTE ENCONTRADO:", resposta.data?.name);
        console.log(
            "LINHAS ENCONTRADAS:",
            resposta.data?.lines?.length || 0
        );

        return res.json(resposta.data);

    } catch (erro) {
        console.error("======================================");
        console.error("ERRO BRAZ MÓVEL");
        console.error("STATUS:", erro.response?.status);
        console.error(
            "DADOS:",
            JSON.stringify(erro.response?.data, null, 2)
        );
        console.error("MENSAGEM:", erro.message);

        if (erro.response?.status === 401) {
            return res.status(401).json({
                erro: "Token da Braz Móvel inválido ou expirado."
            });
        }

        if (erro.response?.status === 403) {
            return res.status(403).json({
                erro: "Acesso negado pela Braz Móvel. Verifique o token e as permissões da API."
            });
        }

        if (erro.response?.status === 404) {
            return res.status(404).json({
                erro: "Cliente não encontrado na Braz Móvel."
            });
        }

        return res.status(erro.response?.status || 500).json({
            erro: "Erro ao consultar cliente na Braz Móvel."
        });
    }
});


// ======================================
// BRAZ MÓVEL - BUSCAR PLANOS DA LINHA
// ======================================

app.get("/api/movel/linha/:lineId/planos", async (req, res) => {
    try {
        const lineId = req.params.lineId;

        console.log("======================================");
        console.log("BRAZ MÓVEL - PLANOS DA LINHA");
        console.log("LINE ID:", lineId);
        console.log("======================================");

        if (!lineId) {
            return res.status(400).json({
                erro: "ID da linha não informado."
            });
        }

        if (!process.env.BRAZ_MOVEL_TOKEN) {
            return res.status(500).json({
                erro: "Token da Braz Móvel não configurado."
            });
        }

        const url =
            `https://api.brazmovel.com.br/v1/line/${lineId}/plan`;

        console.log("CHAMANDO BRAZ MÓVEL:", url);

        const resposta = await axios.get(url, {
            headers: {
                Authorization:
                    `Bearer ${process.env.BRAZ_MOVEL_TOKEN}`
            },
            timeout: 15000
        });

        console.log("STATUS PLANOS:", resposta.status);
        console.log(
            "PLANOS RETORNADOS:",
            JSON.stringify(resposta.data, null, 2)
        );

        return res.json(resposta.data);

    } catch (erro) {
        console.error("======================================");
        console.error("ERRO AO BUSCAR PLANOS");
        console.error("STATUS:", erro.response?.status);
        console.error(
            "DADOS:",
            JSON.stringify(erro.response?.data, null, 2)
        );
        console.error("MENSAGEM:", erro.message);

        return res.status(erro.response?.status || 500).json({
            erro: "Erro ao consultar planos da linha na Braz Móvel."
        });
    }
});


// ======================================
// BRAZ MÓVEL - CONSUMO DA LINHA
// ======================================

app.get("/api/movel/linha/:lineId/usage", async (req, res) => {
    try {
        const lineId = req.params.lineId;

        console.log("======================================");
        console.log("BRAZ MÓVEL - CONSUMO DA LINHA");
        console.log("LINE ID:", lineId);
        console.log("======================================");

        if (!process.env.BRAZ_MOVEL_TOKEN) {
            return res.status(500).json({
                erro: "Token da Braz Móvel não configurado."
            });
        }

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
        console.log(
            "CONSUMO RETORNADO:",
            JSON.stringify(resposta.data, null, 2)
        );

        return res.json(resposta.data);

    } catch (erro) {
        console.error("======================================");
        console.error("ERRO AO BUSCAR CONSUMO");
        console.error("STATUS:", erro.response?.status);
        console.error(
            "DADOS:",
            JSON.stringify(erro.response?.data, null, 2)
        );
        console.error("MENSAGEM:", erro.message);

        return res.status(erro.response?.status || 500).json({
            erro: "Erro ao consultar consumo da linha na Braz Móvel."
        });
    }
});


// ======================================
// DOWNLOAD DE COMPROVANTE / RECIBO
// ======================================

app.post("/api/comprovante", async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                erro: "URL não informada."
            });
        }

        console.log("BAIXANDO COMPROVANTE:", url);

        const resposta = await axios.get(url, {
            responseType: "arraybuffer",
            timeout: 15000,
            headers: {
                "User-Agent": "Mozilla/5.0"
            }
        });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=comprovante-pagamento.pdf"
        );

        return res.send(resposta.data);

    } catch (erro) {
        console.error(
            "ERRO AO BAIXAR COMPROVANTE:",
            erro.message
        );

        return res.status(500).json({
            erro: "Erro ao baixar o comprovante do servidor externo."
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