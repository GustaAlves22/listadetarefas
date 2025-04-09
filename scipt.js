// Seleção de elementos do DOM
const tarefaInput = document.getElementById('tarefa');
const vencimentoInput = document.getElementById('vencimento');
const categoriaInput = document.getElementById('categoria');
const adicionarBtn = document.getElementById('adicionar');
const listaTarefas = document.getElementById('lista-tarefas');
const sumarioEl = document.getElementById('sumario');
const todasBtn = document.getElementById('todas');
const ativasBtn = document.getElementById('ativas');
const completasBtn = document.getElementById('completas');
const filtroCategoria = document.getElementById('filtro-categoria');
const botoesOrdenacao = document.querySelectorAll('#ordenacao button');

// Array para armazenar as tarefas
let tarefas = [];
let filtroAtual = 'todas';
let ordemAtual = 'data'; // Padrão de ordenação

// Carregar tarefas do localStorage (quando existirem)
function carregarTarefas() {
    const tarefasSalvas = localStorage.getItem('tarefas');
    if (tarefasSalvas) {
        tarefas = JSON.parse(tarefasSalvas);
        atualizarLista();
    }
}

// Salvar tarefas no localStorage
function salvarTarefas() {
    localStorage.setItem('tarefas', JSON.stringify(tarefas));
}

// Adicionar uma nova tarefa
function adicionarTarefa() {
    const texto = tarefaInput.value.trim();
    const dataVencimento = vencimentoInput.value;

    if (texto === '') {
        alert('Por favor, digite uma tarefa!');
        return;
    }

    const tarefa = {
        id: Date.now(),
        texto,
        completa: false,
        dataCriacao: new Date(),
        dataVencimento: dataVencimento ? new Date(dataVencimento) : null,
        categoria: categoriaInput.value || ''
    };

    tarefas.push(tarefa);

    tarefaInput.value = '';
    vencimentoInput.value = '';
    categoriaInput.value = '';

    atualizarLista();
    salvarTarefas();
}

// Completar uma tarefa
function completarTarefa(id) {
    const tarefa = tarefas.find(item => item.id === id);

    if (tarefa) {
        tarefa.completa = !tarefa.completa;
        atualizarLista();
        salvarTarefas();
    }
}

// Remover uma tarefa
function removerTarefa(id) {
    tarefas = tarefas.filter(item => item.id !== id);
    atualizarLista();
    salvarTarefas();
}

// Atualizar a lista de tarefas na UI
function atualizarLista() {
    listaTarefas.innerHTML = '';

    let tarefasFiltradas = tarefas;

    if (filtroAtual === 'ativas') {
        tarefasFiltradas = tarefas.filter(tarefa => !tarefa.completa);
    } else if (filtroAtual === 'completas') {
        tarefasFiltradas = tarefas.filter(tarefa => tarefa.completa);
    }

    const categoriaSelecionada = filtroCategoria.value;
    if (categoriaSelecionada) {
        tarefasFiltradas = tarefasFiltradas.filter(t => t.categoria === categoriaSelecionada);
    }

    tarefasFiltradas.sort((a, b) => {
        if (ordemAtual === 'texto') {
            return a.texto.localeCompare(b.texto);
        } else if (ordemAtual === 'data') {
            return new Date(a.dataCriacao) - new Date(b.dataCriacao);
        } else if (ordemAtual === 'status') {
            return (a.completa === b.completa) ? 0 : a.completa ? 1 : -1;
        }
        return 0;
    });

    tarefasFiltradas.forEach(tarefa => {
        const li = document.createElement('li');
        if (tarefa.completa) {
            li.classList.add('completa');
        }

        const vencida = tarefa.dataVencimento && new Date(tarefa.dataVencimento) < new Date() && !tarefa.completa;

        const categoriaCor = {
            'Trabalho': '#e0f7fa',
            'Estudos': '#fff9c4',
            'Pessoal': '#fce4ec',
            '': '#f9f9f9'
        };

        li.style.backgroundColor = categoriaCor[tarefa.categoria] || '#f9f9f9';

        if (vencida) {
            li.style.backgroundColor = '#ffe5e5';
        }

        const dataVencStr = tarefa.dataVencimento 
            ? ` <small style="color:#888">(Vence em: ${new Date(tarefa.dataVencimento).toLocaleDateString()})</small>` 
            : '';

        const categoriaTag = tarefa.categoria
            ? `<span style="background:#ccc; padding:2px 6px; border-radius:4px; font-size:12px;">${tarefa.categoria}</span>`
            : '';

        li.innerHTML = `
            <div style="display:flex; flex-direction:column; flex:1">
                <span>${tarefa.texto} ${dataVencStr}</span>
                ${categoriaTag}
            </div>
            <div class="acoes">
                <button class="completar">${tarefa.completa ? 'Reativar' : 'Completar'}</button>
                <button class="remover">Remover</button>
            </div>
        `;

        const completarBtn = li.querySelector('.completar');
        const removerBtn = li.querySelector('.remover');

        completarBtn.addEventListener('click', () => completarTarefa(tarefa.id));
        removerBtn.addEventListener('click', () => removerTarefa(tarefa.id));

        listaTarefas.appendChild(li);
    });

    atualizarSumario();
    atualizarGraficoProporcao();
    atualizarGraficoProdutividade();
}

// Atualizar o sumário de tarefas
function atualizarSumario() {
    const total = tarefas.length;
    const completas = tarefas.filter(tarefa => tarefa.completa).length;
    const pendentes = total - completas;

    sumarioEl.textContent = `Total de tarefas: ${total} | Completas: ${completas} | Pendentes: ${pendentes}`;
}

// Função para atualizar o gráfico de proporção
function atualizarGraficoProporcao() {
    const completas = tarefas.filter(t => t.completa).length;
    const pendentes = tarefas.length - completas;

    const canvas = document.getElementById('graficoProporcao');
    const ctx = canvas.getContext('2d');
    const total = completas + pendentes;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const raio = 60;
    const centroX = canvas.width / 2;
    const centroY = canvas.height / 2;

    let anguloInicial = 0;
    const proporcaoCompletas = completas / total;
    const anguloCompletas = proporcaoCompletas * 2 * Math.PI;

    // Completas (verde)
    ctx.beginPath();
    ctx.moveTo(centroX, centroY);
    ctx.arc(centroX, centroY, raio, anguloInicial, anguloInicial + anguloCompletas);
    ctx.fillStyle = "#4caf50";
    ctx.fill();

    // Pendentes (vermelho)
    ctx.beginPath();
    ctx.moveTo(centroX, centroY);
    ctx.arc(centroX, centroY, raio, anguloInicial + anguloCompletas, anguloInicial + 2 * Math.PI);
    ctx.fillStyle = "#f44336";
    ctx.fill();
}

// Função para atualizar o gráfico de produtividade
function atualizarGraficoProdutividade() {
    const canvas = document.getElementById('graficoProdutividade');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const completas = tarefas.filter(t => t.completa);

    const porDia = {};
    completas.forEach(t => {
        const dia = new Date(t.dataCriacao).toLocaleDateString();
        porDia[dia] = (porDia[dia] || 0) + 1;
    });

    const dias = Object.keys(porDia).sort((a, b) => new Date(a) - new Date(b));
    const larguraBarra = 40;
    const espacamento = 20;
    const alturaMax = 100;

    dias.forEach((dia, i) => {
        const x = i * (larguraBarra + espacamento) + 30;
        const altura = porDia[dia] * 20;
        const y = canvas.height - altura - 30;

        ctx.fillStyle = "#2196f3";
        ctx.fillRect(x, y, larguraBarra, altura);

        ctx.fillStyle = "#333";
        ctx.font = "12px Arial";
        ctx.fillText(dia, x, canvas.height - 10);
    });
}

// Mudar o filtro ativo
function mudarFiltro(filtro) {
    filtroAtual = filtro;

    todasBtn.classList.remove('ativo');
    ativasBtn.classList.remove('ativo');
    completasBtn.classList.remove('ativo');

    if (filtro === 'todas') {
        todasBtn.classList.add('ativo');
    } else if (filtro === 'ativas') {
        ativasBtn.classList.add('ativo');
    } else if (filtro === 'completas') {
        completasBtn.classList.add('ativo');
    }

    atualizarLista();
}

// Event Listeners
adicionarBtn.addEventListener('click', adicionarTarefa);

tarefaInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        adicionarTarefa();
    }
});

todasBtn.addEventListener('click', () => mudarFiltro('todas'));
ativasBtn.addEventListener('click', () => mudarFiltro('ativas'));
completasBtn.addEventListener('click', () => mudarFiltro('completas'));
filtroCategoria.addEventListener('change', atualizarLista);

botoesOrdenacao.forEach(btn => {
    btn.addEventListener('click', () => {
        ordemAtual = btn.getAttribute('data-ordem');
        botoesOrdenacao.forEach(b => b.classList.remove('ativo'));
        btn.classList.add('ativo');
        atualizarLista();
    });
});

// Inicializar a aplicação
carregarTarefas();
// Restaurar preferência do modo escuro
if (localStorage.getItem('modo-escuro') === 'true') {
    document.body.classList.add('dark-mode');
}

// Botão de alternância do modo escuro
const toggle = document.getElementById('toggleDarkMode');
function atualizarIconeTema() {
    toggle.innerHTML = document.body.classList.contains('dark-mode') ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}
atualizarIconeTema();

toggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('modo-escuro', document.body.classList.contains('dark-mode'));
    atualizarIconeTema();
});
