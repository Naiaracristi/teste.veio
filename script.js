const URL_SCRIPT =
  "https://script.google.com/macros/s/AKfycbxdGQoJJouLOD9WbsPgdfofRjHkuk1hHQ93Yyl-1kCx762LEv1Kct_dN2CnGPollTgq/exec";

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function salvarNaPlanilha(dados) {
  fetch(URL_SCRIPT, {
    method: "POST",
    body: JSON.stringify(dados),
  })
    .then((resposta) => resposta.json())
    .then((resultado) => console.log("Salvo na planilha:", resultado))
    .catch((erro) => console.error("Erro ao salvar:", erro));
}

// ---------- REFERÊNCIAS AOS ELEMENTOS DO HTML ----------
const formServico = document.getElementById("formServico");
const linhasServico = document.getElementById("linhasServico");
const btnAddLinhaServico = document.getElementById("btnAddLinhaServico");
const resumo = document.getElementById("resumoOrcamento");

// ================================================
// PARTE 1: CRIAR LINHAS DE SERVIÇO DINAMICAMENTE
// ================================================
function criarLinhaServico() {
  const linha = document.createElement("div");
  linha.className = "linha-servico";

  linha.innerHTML = `
    <input type="text" class="nomeServico" placeholder="Nome do Serviço"/>
    <input type="number" class="metragem" step="0.01" min="0" placeholder="Metragem (m²) - opcional" />
    <input type="number" class="valorM2" step="0.01" min="0" placeholder="Valor (R$)" />
    <button type="button" class="remover-linha">Remover</button>
  `;

  linha.querySelector(".remover-linha").addEventListener("click", function () {
    linha.remove();
  });

  linhasServico.appendChild(linha);
}

btnAddLinhaServico.addEventListener("click", criarLinhaServico);
criarLinhaServico();

function coletarLinhasServico() {
  const linhas = [];
  document.querySelectorAll(".linha-servico").forEach(function (linha) {
    const nome = linha.querySelector(".nomeServico").value.trim();
    const metragemInput = linha.querySelector(".metragem").value;
    const valorM2 = parseFloat(linha.querySelector(".valorM2").value);

    // metragem agora é opcional
    const metragem =
      metragemInput.trim() === "" ? null : parseFloat(metragemInput);

    // só precisa ter valor válido; metragem pode ficar em branco
    if (!isNaN(valorM2)) {
      const subtotal =
        metragem !== null && !isNaN(metragem) ? metragem * valorM2 : valorM2;

      linhas.push({
        nome: nome,
        metragem: metragem,
        valor: valorM2,
        subtotal: subtotal,
      });
    }
  });
  return linhas;
}

// ================================================
// PARTE 2: GERAR O ORÇAMENTO PRINCIPAL
// ================================================
formServico.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const nomeCliente = document.getElementById("nomeCliente").value.trim();
  const dataBruta = document.getElementById("dataOrcamento").value;

  const linhasServicoPreenchidas = coletarLinhasServico();

  if (!nomeCliente || !dataBruta || linhasServicoPreenchidas.length === 0) {
    alert(
      "Preencha todos os campos e ao menos uma linha de serviço antes de gerar o orçamento.",
    );
    return;
  }

  const totalServico = linhasServicoPreenchidas.reduce(function (soma, linha) {
    return soma + linha.subtotal;
  }, 0);
  const totalGeral = totalServico;

  const [ano, mes, dia] = dataBruta.split("-");
  const dataFormatada = `${dia}/${mes}/${ano}`;
  imprimirResumo({
    nomeCliente,
    dataFormatada,
    totalServico,
    totalGeral,
    linhasServico: linhasServicoPreenchidas,
  });
});

document.getElementById("btnImprimir").addEventListener("click", function () {
  window.print();
});

function imprimirResumo(dados) {
  let htmlServico = "<ul>";
  dados.linhasServico.forEach(function (linha) {
    if (linha.metragem !== null) {
      htmlServico += `<li>${linha.nome}: ${linha.metragem} m² x R$ ${formatarMoeda(linha.valor)} = R$ ${formatarMoeda(linha.subtotal)}</li>`;
    } else {
      htmlServico += `<li>${linha.nome}: R$ ${formatarMoeda(linha.valor)}</li>`;
    }
  });
  htmlServico += "</ul>";

  resumo.innerHTML = `
      <h2>Resumo do Orçamento</h2>
      <p><strong>Cliente:</strong> ${dados.nomeCliente}</p>
      <p><strong>Data:</strong> ${dados.dataFormatada}</p>
      ${htmlServico}
      <p><strong>Subtotal do serviço:</strong> R$ ${formatarMoeda(dados.totalServico)}</p>

      <p class="total">Total geral: R$ ${formatarMoeda(dados.totalGeral)}</p>
    `;

  resumo.style.display = "block";
  resumo.scrollIntoView({ behavior: "smooth" });

  document.getElementById("btnImprimir").style.display = "inline-block";

  salvarNaPlanilha({
    cliente: dados.nomeCliente,
    data: dados.dataFormatada,
    linhasServico: JSON.stringify(dados.linhasServico),
    totalServico: dados.totalServico,
    totalGeral: dados.totalGeral,
  });
}
