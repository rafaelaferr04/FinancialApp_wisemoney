import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Trophy, Gamepad2, CheckCircle2, X, ChevronRight, Lock } from 'lucide-react';

// ─── Course data ──────────────────────────────────────────────────────────────
const COURSES = [
  // LEVEL 1
  {
    id: 'cashflow', icon: '💧', level: 1, xp_reward: 100,
    title: 'Cash Flow Essencial',
    description: 'Domina o movimento real de dinheiro na tua empresa e evita a armadilha do "lucro sem caixa".',
    lessons: [
      { title: 'O que é Cash Flow?', content: 'Cash flow é o registo de todo o dinheiro que entra e sai da empresa num período. Ao contrário do lucro contabilístico (que pode incluir vendas ainda não recebidas), o cash flow mostra o dinheiro real disponível. Uma empresa pode ser lucrativa no papel e ainda assim falir por falta de liquidez.' },
      { title: 'Os 3 tipos de fluxo', content: 'Operacional: dinheiro gerado pelas operações do dia-a-dia (vendas, pagamentos a fornecedores). Investimento: compra/venda de ativos como equipamento ou imóveis. Financiamento: empréstimos, emissão de capital, pagamento de dividendos. O fluxo operacional positivo é o sinal mais saudável de um negócio sustentável.' },
      { title: 'Previsão a 13 semanas', content: 'A técnica mais usada por CFOs experientes: projeta semana a semana as entradas e saídas durante 13 semanas (~3 meses). Permite antecipar apertos de liquidez com tempo suficiente para agir. Atualiza semanalmente e compara o previsto com o real para melhorar as estimativas futuras.' },
    ],
    quiz: [
      { q: 'Uma empresa tem €50k de lucro este mês mas fica sem dinheiro. Porquê?', opts: ['Erro de contabilidade', 'Clientes ainda não pagaram e ela tem de pagar fornecedores', 'Impostos excessivos', 'Salários demasiado altos'], correct: 1 },
      { q: 'O fluxo operacional positivo indica o quê?', opts: ['A empresa tem muitos investimentos', 'A empresa recebeu empréstimos', 'As operações geram dinheiro real', 'Os impostos foram pagos'], correct: 2 },
      { q: 'Para que serve a previsão de cash flow a 13 semanas?', opts: ['Calcular impostos', 'Antecipar apertos de liquidez com tempo para agir', 'Avaliar concorrentes', 'Definir salários'], correct: 1 },
      { q: 'Qual destes é um exemplo de fluxo de financiamento?', opts: ['Venda de produto ao cliente', 'Compra de equipamento', 'Recebimento de empréstimo bancário', 'Pagamento de salários'], correct: 2 },
    ],
  },
  {
    id: 'revenue_costs', icon: '📊', level: 1, xp_reward: 100,
    title: 'Receitas vs Custos',
    description: 'Aprende a classificar e controlar as entradas e saídas para manter o negócio saudável.',
    lessons: [
      { title: 'Tipos de receita', content: 'Receita operacional: gerada pelo core business (vendas de produtos/serviços). Receita não-operacional: juros, rendas, venda de ativos. Distinguir é importante para perceber se o negócio em si é viável. Uma empresa dependente de receitas não-operacionais é vulnerável e pouco atrativa para investidores.' },
      { title: 'Custos fixos vs variáveis', content: 'Custos fixos existem independentemente do volume: rendas, seguros, salários base. Custos variáveis crescem com a atividade: matérias-primas, comissões, embalagens. Conhecer esta distinção permite calcular o ponto de equilíbrio e tomar decisões de pricing informadas.' },
      { title: 'Controlo de custos', content: 'Regra dos 3 fornecedores: pede sempre 3 orçamentos para gastos relevantes. Revisão trimestral de contratos recorrentes. Identificar os "top 5 custos" e questionar cada um. Pequenas ineficiências repetidas mensalmente representam centenas de milhares de euros ao longo dos anos.' },
    ],
    quiz: [
      { q: 'Uma renda de escritório é um custo...', opts: ['Variável', 'Fixo', 'Operacional não-recorrente', 'Capital'], correct: 1 },
      { q: 'Comissões de vendedores são custos...', opts: ['Fixos', 'Variáveis', 'Financeiros', 'De investimento'], correct: 1 },
      { q: 'Uma empresa depende muito de receitas de venda de ativos. Qual o risco?', opts: ['Lucro excessivo', 'O negócio core pode não ser viável', 'Demasiados ativos', 'Nenhum risco'], correct: 1 },
      { q: 'Qual é a vantagem de conhecer custos fixos vs variáveis?', opts: ['Pagar menos impostos', 'Calcular o break-even e definir preços', 'Reduzir salários automaticamente', 'Aumentar receitas sem esforço'], correct: 1 },
    ],
  },
  {
    id: 'gross_margin', icon: '🎯', level: 1, xp_reward: 100,
    title: 'Margem Bruta Descomplicada',
    description: 'A margem bruta é o primeiro teste de viabilidade — aprende a calculá-la e a usá-la para tomar decisões.',
    lessons: [
      { title: 'Fórmula e significado', content: 'Margem Bruta = (Receita − Custo dos Bens Vendidos) ÷ Receita × 100. Mede a eficiência na produção/entrega antes dos custos fixos. Uma margem de 60% significa que de cada €100 faturados, €60 ficam disponíveis para cobrir estrutura e gerar lucro líquido.' },
      { title: 'Benchmarks por setor', content: 'Software/SaaS: 70–90%. Consultoria: 50–70%. Retalho: 30–50%. Restauração: 60–75% (mas com altos custos fixos). Manufatura: 20–40%. Comparar com empresas do mesmo setor é muito mais útil do que comparar com empresas de áreas diferentes.' },
      { title: 'Melhorar a margem', content: 'Três alavancas: (1) Aumentar preço — maior impacto por ponto percentual, mas requer proposta de valor sólida. (2) Reduzir custo de produção — negociar com fornecedores, automatizar processos. (3) Mudar mix de produtos — focar nos produtos com margem mais alta. Um aumento de 5pp na margem pode duplicar o lucro líquido.' },
    ],
    quiz: [
      { q: 'Receita €200k, custo dos bens €80k. Qual é a margem bruta?', opts: ['40%', '60%', '80%', '120%'], correct: 1 },
      { q: 'Qual setor tipicamente tem margens brutas mais altas?', opts: ['Retalho alimentar', 'Manufatura pesada', 'Software/SaaS', 'Construção civil'], correct: 2 },
      { q: 'Qual das seguintes aumenta a margem bruta?', opts: ['Contratar mais pessoas', 'Negociar melhor preço com fornecedores', 'Aumentar rendas', 'Expandir para novos mercados'], correct: 1 },
      { q: 'Margem bruta de 30% num SaaS indica...', opts: ['Muito bom desempenho', 'Desempenho abaixo do esperado para o setor', 'Resultado médio', 'Impossível avaliar'], correct: 1 },
    ],
  },
  {
    id: 'first_kpis', icon: '📌', level: 1, xp_reward: 100,
    title: 'KPIs: O Painel de Controlo',
    description: 'Define os indicadores certos para guiar decisões em vez de te perderes em métricas de vaidade.',
    lessons: [
      { title: 'O que é um KPI e porque importa', content: 'KPI (Key Performance Indicator) é uma métrica que mede o progresso em direção a um objetivo estratégico. A maioria das empresas mede demasiado e decide pouco. A regra: escolhe entre 5 a 10 KPIs que realmente influenciam decisões. O resto são métricas de vaidade.' },
      { title: 'KPIs essenciais para começar', content: '1. MRR/ARR — receita recorrente mensal/anual. 2. CAC — custo para adquirir um novo cliente. 3. LTV — valor total que um cliente gera ao longo da relação. 4. Churn Rate — % de clientes que perdes por mês. 5. Margem bruta — eficiência do produto/serviço. Estes 5 contam a história completa do negócio.' },
      { title: 'KPIs vs métricas de vaidade', content: 'Métricas de vaidade parecem impressionantes mas não guiam decisões: seguidores nas redes sociais, visitas ao website sem conversão, número de emails enviados. Um KPI real tem alvo definido, responsável, e influencia decisões de alocação de recursos. Se não muda nada na tua decisão, não é um KPI — é ruído.' },
    ],
    quiz: [
      { q: 'Quantos KPIs é ideal acompanhar de perto?', opts: ['1-2', '5-10', '20-30', 'O máximo possível'], correct: 1 },
      { q: 'O que é o Churn Rate?', opts: ['Taxa de crescimento de receita', '% de clientes perdidos por período', 'Custo de produção unitário', 'Taxa de satisfação da equipa'], correct: 1 },
      { q: 'Qual é uma métrica de vaidade?', opts: ['Margem bruta', 'Taxa de conversão de vendas', 'Número de seguidores sem engagement', 'Custo de aquisição de cliente'], correct: 2 },
      { q: 'LTV maior que CAC significa...', opts: ['A empresa está a perder dinheiro em cada cliente', 'Cada cliente gera mais valor do que custa adquirir', 'Os custos operacionais são baixos', 'A empresa tem demasiados clientes'], correct: 1 },
    ],
  },
  // LEVEL 2
  {
    id: 'breakeven', icon: '⚖️', level: 2, xp_reward: 200,
    title: 'Análise de Break-Even',
    description: 'Calcula exatamente quantas vendas precisas para cobrir todos os custos — essencial para qualquer decisão de pricing.',
    lessons: [
      { title: 'A fórmula do Break-Even', content: 'Break-Even (unidades) = Custos Fixos ÷ (Preço de Venda − Custo Variável por Unidade). A diferença (Preço − Custo Variável) chama-se "margem de contribuição por unidade". Quanto maior esta margem, menos unidades são necessárias para atingir o equilíbrio e mais rápido se gera lucro.' },
      { title: 'Break-Even em receita', content: 'Break-Even (€) = Custos Fixos ÷ Margem de Contribuição (%). Exemplo: €20k custos fixos, margem de contribuição de 40% → Break-Even = €50k de faturação mensal. Abaixo disto, a empresa acumula prejuízo; acima, gera lucro. É o número mais importante para o planeamento mensal.' },
      { title: 'Usar o Break-Even nas decisões', content: 'Antes de contratar: qual o impacto no Break-Even? Antes de expandir: a nova linha de negócio tem Break-Even atingível? Ao renegociar preços: onde está o novo equilíbrio? Conhecer o Break-Even transforma decisões intuitivas em decisões matematicamente fundamentadas.' },
    ],
    quiz: [
      { q: 'Custos fixos €15k, preço €50, custo variável €20. Qual é o Break-Even em unidades?', opts: ['200 unidades', '300 unidades', '500 unidades', '750 unidades'], correct: 2 },
      { q: 'Margem de contribuição é...', opts: ['Receita total − Custos fixos', 'Preço − Custo variável por unidade', 'Lucro após impostos', 'Receita − Custo dos bens vendidos'], correct: 1 },
      { q: 'Ao baixar o preço de venda, o Break-Even...', opts: ['Diminui', 'Aumenta', 'Fica igual', 'Desaparece'], correct: 1 },
      { q: 'Para que serve calcular o Break-Even antes de contratar?', opts: ['Cumprir obrigações legais', 'Perceber se o negócio aguenta o novo custo fixo', 'Definir a política de férias', 'Calcular IRS dos colaboradores'], correct: 1 },
    ],
  },
  {
    id: 'ebitda', icon: '📈', level: 2, xp_reward: 200,
    title: 'EBITDA na Prática',
    description: 'O indicador favorito dos investidores — aprende a calculá-lo, interpretá-lo e a não o confundir com cash flow.',
    lessons: [
      { title: 'O que é o EBITDA', content: 'EBITDA = Earnings Before Interest, Taxes, Depreciation & Amortization. Remove o efeito de decisões financeiras e contabilísticas, expondo a rentabilidade operacional pura do negócio. Permite comparar empresas com estruturas de capital e regimes fiscais diferentes — por isso é a métrica preferida em M&A e private equity.' },
      { title: 'Cálculo e interpretação', content: 'EBITDA = Resultado Líquido + Juros + Impostos + Depreciações + Amortizações. Margem EBITDA = EBITDA ÷ Receita. Uma margem EBITDA de 20% é sólida na maioria dos setores. Acima de 30% é excelente. Abaixo de 10% indica pressão estrutural de custos que precisa de atenção imediata.' },
      { title: 'EBITDA ≠ Cash Flow', content: 'Erro muito comum: confundir EBITDA com dinheiro disponível. EBITDA não considera: variações de capital de trabalho (stock, crédito a clientes), investimentos em equipamento (CAPEX), nem o pagamento de dívida. Uma empresa pode ter EBITDA positivo e ainda assim ter problemas sérios de liquidez. Usa ambos em complemento.' },
    ],
    quiz: [
      { q: 'EBITDA significa...', opts: ['Lucro total após impostos', 'Resultado antes de juros, impostos, depreciações e amortizações', 'Receita bruta total', 'Cash flow operacional'], correct: 1 },
      { q: 'Qual a principal vantagem do EBITDA para comparar empresas?', opts: ['Remove decisões financeiras e contabilísticas', 'Inclui todos os custos possíveis', 'Mede o caixa disponível exato', 'É sempre um número positivo'], correct: 0 },
      { q: 'Margem EBITDA de 8% indica...', opts: ['Rentabilidade excelente', 'Pressão de custos estrutural que precisa de atenção', 'Empresa de tecnologia saudável', 'Resultado dentro da média global'], correct: 1 },
      { q: 'EBITDA positivo garante liquidez suficiente?', opts: ['Sim, sempre', 'Não, porque ignora CAPEX e capital de trabalho', 'Só se a dívida for baixa', 'Só em empresas de serviços puros'], correct: 1 },
    ],
  },
  {
    id: 'pricing', icon: '💡', level: 2, xp_reward: 200,
    title: 'Estratégias de Pricing',
    description: 'O preço é a alavanca de maior impacto no lucro — aprende estratégias que maximizam valor e rentabilidade.',
    lessons: [
      { title: 'Os 3 modelos principais', content: 'Cost-plus: custo + % de margem. Simples mas ignora o valor percebido. Value-based: preço definido pelo valor criado para o cliente, não pelo custo. Permite margens muito maiores e é o modelo preferido em B2B. Competitivo: preço baseado na concorrência. Perigoso a longo prazo — leva inevitavelmente a guerras de preço.' },
      { title: 'Psicologia do preço', content: 'Anchoring: apresenta primeiro o preço mais alto para fazer o médio parecer razoável (a lógica por trás dos planos "Basic, Pro, Enterprise"). Charm pricing: €99 converte melhor do que €100. Decoy effect: uma terceira opção "irracional" torna a opção desejada mais atrativa. Estas técnicas aumentam conversão sem tocar nos custos.' },
      { title: 'O impacto real no lucro', content: 'Estudo McKinsey: um aumento de 1% no preço aumenta o lucro operacional em 8–11%, em média. Comparação: reduzir custos fixos 1% → +2.5% de lucro; aumentar volume 1% → +3.7% de lucro. O preço é a alavanca mais poderosa de todas. Rever preços pelo menos anualmente é uma obrigação estratégica de qualquer gestor.' },
    ],
    quiz: [
      { q: 'No value-based pricing, o preço é definido por...', opts: ['Custo + margem fixa', 'Preço da concorrência', 'Valor percebido pelo cliente', 'Volume de vendas esperado'], correct: 2 },
      { q: 'O que é o efeito "anchoring"?', opts: ['Baixar preços para ganhar quota de mercado', 'Apresentar preço alto primeiro para tornar o seguinte mais razoável', 'Oferecer desconto a clientes fiéis', 'Usar preços como €9.99'], correct: 1 },
      { q: 'Qual alavanca tem maior impacto no lucro operacional?', opts: ['Aumentar volume de vendas 1%', 'Reduzir custos variáveis 1%', 'Aumentar preço 1%', 'Contratar mais comerciais'], correct: 2 },
      { q: 'Uma guerra de preços com concorrentes tende a...', opts: ['Aumentar a rentabilidade do setor', 'Destruir margens de todos os players', 'Aumentar a fidelização dos clientes', 'Criar diferenciação sustentável'], correct: 1 },
    ],
  },
  {
    id: 'team_mgmt', icon: '👥', level: 2, xp_reward: 200,
    title: 'Equipas de Alta Performance',
    description: 'Equipas excelentes constroem-se com sistemas — aprende o que multiplica produtividade e engagement.',
    lessons: [
      { title: 'Clareza de papéis e expectativas', content: 'O maior destruidor de performance é a ambiguidade: cada colaborador deve saber exatamente o que se espera dele, como será medido, e quais são as prioridades. Uma job description não chega — define resultados esperados aos 30-60-90 dias de cada função e revê trimestralmente.' },
      { title: 'Feedback contínuo vs avaliação anual', content: 'Avaliações anuais são obsoletas. Empresas de alta performance operam com: check-ins semanais de 15 minutos (bloqueadores, progresso, próximas prioridades), feedback em tempo real após momentos significativos, e revisão trimestral de objetivos. O feedback frequente é o único que muda comportamentos duradouramente.' },
      { title: 'Psicologia de segurança', content: 'O Projeto Aristóteles da Google identificou o fator #1 em equipas de alto desempenho: segurança psicológica — a capacidade de errar sem medo de punição. Permite experimentação, inovação e honestidade radical. Combinada com autonomia real (zero microgestão), gera o nível de engagement que duplica a produtividade.' },
    ],
    quiz: [
      { q: 'Qual o maior destruidor de performance individual?', opts: ['Salário abaixo do mercado', 'Ambiguidade sobre papéis e expectativas', 'Falta de formação técnica', 'Escritório pequeno'], correct: 1 },
      { q: 'Qual modelo de feedback muda comportamentos com mais eficácia?', opts: ['Avaliação anual detalhada', 'Feedback esporádico quando há problemas', 'Feedback contínuo e em tempo real', 'Avaliação semestral por pares'], correct: 2 },
      { q: 'O fator #1 em equipas de alta performance (Projeto Aristóteles) é...', opts: ['Talento individual elevado', 'Bónus de desempenho generosos', 'Segurança psicológica', 'Horários completamente flexíveis'], correct: 2 },
      { q: 'Microgestão tende a...', opts: ['Aumentar a qualidade do trabalho', 'Reduzir engagement e iniciativa', 'Criar mais responsabilidade', 'Acelerar o onboarding de novos membros'], correct: 1 },
    ],
  },
  // LEVEL 3
  {
    id: 'valuation', icon: '🏦', level: 3, xp_reward: 350,
    title: 'Valuation: Quanto Vale a Empresa?',
    description: 'Aprende os métodos que investidores usam para valorizar negócios — essencial para rondas de investimento ou venda.',
    lessons: [
      { title: 'Múltiplos de receita e EBITDA', content: 'Método mais comum: Valor = Receita × Múltiplo ou Valor = EBITDA × Múltiplo. Múltiplos variam por setor: SaaS B2B 8-15× receita, retalho 0.5-1× receita, serviços 5-10× EBITDA. O múltiplo sobe com crescimento YoY elevado, receita recorrente, margens altas e mercado grande. Uma empresa que cresce 50%/ano vale 2–3× mais do que uma que cresce 10%.' },
      { title: 'DCF — Discounted Cash Flow', content: 'Valoriza a empresa com base nos cash flows futuros descontados a uma taxa (WACC — custo médio ponderado do capital). Fórmula: V = Σ (CF_t ÷ (1+r)^t). É o método mais rigoroso mas extremamente sensível às premissas — um erro de 1% na taxa de desconto pode alterar o valor em 30%. Usa o DCF para análise de sensibilidade, não como valor absoluto.' },
      { title: 'O que aumenta o valuation', content: 'Crescimento acelerado (>30% YoY) pode duplicar múltiplos. Receita recorrente (ARR/MRR) é valorizada muito mais do que receita projeto-a-projeto. Margens altas e em melhoria. Equipa fundadora experiente e complementar. Vantagem competitiva defensável: propriedade intelectual, network effects, switching costs altos. Mercado grande e com vento favorável.' },
    ],
    quiz: [
      { q: 'Uma empresa SaaS com €1M ARR e múltiplo de 10×. Qual o valuation?', opts: ['€1M', '€5M', '€10M', '€100M'], correct: 2 },
      { q: 'O que mais aumenta o múltiplo de receita?', opts: ['Ter muitos colaboradores', 'Crescimento acelerado e receita recorrente', 'Ter escritório próprio', 'Poucos concorrentes diretos'], correct: 1 },
      { q: 'O DCF é mais útil para...', opts: ['Calcular impostos anuais', 'Análise de sensibilidade — não valor absoluto', 'Definir salários da equipa', 'Comparar com concorrentes do setor'], correct: 1 },
      { q: 'Qual tipo de receita é mais valorizado por investidores?', opts: ['Receita pontual de projetos', 'Receita recorrente (subscriptions)', 'Receita de venda de ativos', 'Receita de consultoria ad-hoc'], correct: 1 },
    ],
  },
  {
    id: 'runway', icon: '🛫', level: 3, xp_reward: 350,
    title: 'Runway, Burn Rate e Sobrevivência',
    description: 'Aprende a calcular quanto tempo tens antes de ficar sem dinheiro — e como estender esse prazo estrategicamente.',
    lessons: [
      { title: 'Burn Rate e Runway', content: 'Burn Rate Bruto: total de despesas mensais. Burn Rate Líquido: despesas − receitas = dinheiro "queimado" por mês. Runway = Caixa disponível ÷ Burn Rate Líquido. Exemplo: €300k em caixa, burn líquido €25k/mês → 12 meses de runway. 18+ meses é considerado o mínimo confortável para startups em fase de crescimento.' },
      { title: 'Cenários e plano B', content: 'Cria sempre 3 cenários: base (previsão realista), otimista (tudo corre bem), pessimista (receita cai 30%, custos aumentam 15%). O plano B activa-se automaticamente se o runway descer abaixo de um threshold pré-definido (ex: 9 meses): congelar contratações, reduzir não-essenciais, acelerar cobrança, abrir nova ronda. Definir os gatilhos antes da crise é fundamental.' },
      { title: 'Estratégias para estender o runway', content: 'Aumento de receita (melhor opção): upsell a clientes existentes, acelerar conversão, lançar nova oferta rápida. Redução de custos: renegociar rendas e contratos, diferir investimentos, reduzir headcount não-crítico. Capital: investidores ou empréstimos (processo mais longo). Cobrança acelerada: oferecer desconto por pagamento antecipado a clientes.' },
    ],
    quiz: [
      { q: 'Caixa €240k, burn rate líquido €20k/mês. Qual é o runway?', opts: ['6 meses', '10 meses', '12 meses', '24 meses'], correct: 2 },
      { q: 'Qual é o runway mínimo confortável para uma startup?', opts: ['3 meses', '6 meses', '18 meses', '36 meses'], correct: 2 },
      { q: 'Qual estratégia para estender o runway tem impacto mais imediato?', opts: ['Abrir nova ronda de investimento', 'Upsell e cross-sell a clientes existentes', 'Contratar mais vendedores', 'Lançar um produto completamente novo'], correct: 1 },
      { q: 'Quando deves ativar o plano B de redução de custos?', opts: ['Quando o dinheiro acaba', 'Quando atingiste o threshold pré-definido (ex: runway < 9 meses)', 'Quando investidores pedem', 'No final do ano fiscal'], correct: 1 },
    ],
  },
  {
    id: 'nps_retention', icon: '⭐', level: 3, xp_reward: 350,
    title: 'NPS, Retenção e LTV',
    description: 'Clientes que ficam e recomendam são a base de qualquer negócio sustentável — mede e melhora sistematicamente.',
    lessons: [
      { title: 'NPS — Net Promoter Score', content: 'Pergunta única: "De 0 a 10, com que probabilidade recomendarias a nossa empresa a um amigo?". Promotores (9-10): evangelistas que geram crescimento orgânico. Passivos (7-8): satisfeitos mas vulneráveis à concorrência. Detratores (0-6): insatisfeitos e que danificam a tua reputação. NPS = %Promotores − %Detratores. Acima de 50 é excelente; acima de 70 é líder de mercado.' },
      { title: 'Churn Rate e retenção', content: 'Churn Rate Mensal = Clientes perdidos ÷ Clientes no início do mês. Um churn de 2%/mês parece baixo, mas equivale a ~22% ao ano — perdes 1 em cada 5 clientes. O objetivo para SaaS B2B é <1%/mês. Mede separadamente o churn de receita (revenue churn) — mais relevante porque conta o impacto financeiro real dos cancelamentos.' },
      { title: 'LTV e unit economics', content: 'LTV (Lifetime Value) = Receita Média por Cliente × Margem Bruta × (1 ÷ Churn Rate Mensal). Regra de ouro: LTV/CAC > 3 e payback period < 12 meses. Se LTV/CAC < 1, estás a destruir valor em cada novo cliente — alarme vermelho. Melhorar LTV: aumentar preço, reduzir churn, upsell. Reduzir CAC: referrals, conteúdo, partnerships estratégicos.' },
    ],
    quiz: [
      { q: '60% promotores, 15% passivos, 25% detratores. Qual é o NPS?', opts: ['+35', '+45', '+60', '+75'], correct: 0 },
      { q: 'Churn mensal de 3% equivale a que churn anual aproximado?', opts: ['3%', '18%', '31%', '36%'], correct: 2 },
      { q: 'LTV/CAC de 0.8 significa...', opts: ['Negócio saudável e escalável', 'LTV elevado acima do normal', 'Estás a destruir valor em cada cliente novo', 'Crescimento muito rápido do negócio'], correct: 2 },
      { q: 'O que é revenue churn?', opts: ['Número de clientes perdidos no período', 'Receita perdida por cancelamentos e downgrades', 'Custo de aquisição de novos clientes', 'Margem bruta dos clientes cancelados'], correct: 1 },
    ],
  },
  {
    id: 'fundraising', icon: '🤝', level: 3, xp_reward: 350,
    title: 'Captar Investimento',
    description: 'Percebe como funciona o venture capital, o que os investidores procuram e como estruturar uma ronda de sucesso.',
    lessons: [
      { title: 'Tipos de investimento', content: 'Pre-seed/Seed: €100k–€2M, geralmente business angels ou micro-VCs, produto ainda em validação. Series A: €2M–€15M, tracção comprovada e modelo escalável definido. Series B+: para escalar o que já funciona. Debt/Empréstimos: sem diluição de capital, para empresas com receita previsível. Cada fase tem expectativas diferentes de métricas e crescimento.' },
      { title: 'O que os VCs procuram', content: 'Equipa: experiência, complementaridade, resiliência ("founders que não desistem"). Mercado: TAM (Total Addressable Market) grande — mínimo €500M para interessar VCs. Tracção: crescimento MoM consistente (>10% é sólido para early stage). Unit economics positivos e em melhoria. Diferenciação: por que é que vocês ganham quando um concorrente com mais dinheiro entrar no mercado?' },
      { title: 'O processo e o pitch', content: 'Deck ideal (10-12 slides): problema, solução, mercado, produto demo, tracção, equipa, modelo de negócio, plano de uso do capital, financeiros. Primeira reunião: criar curiosidade, não explicar tudo. Due diligence: prepara data room com financeiros auditados, KPIs históricos, contratos chave, cap table. Negociar: valuation, liquidation preference, pro-rata rights. O "não" de hoje é frequentemente o "sim" de 6 meses.' },
    ],
    quiz: [
      { q: 'Uma ronda Series A é tipicamente para...', opts: ['Validar o produto com primeiros utilizadores', 'Escalar um modelo com tracção comprovada', 'Registar a empresa', 'Pagar dívidas acumuladas'], correct: 1 },
      { q: 'O que é o TAM?', opts: ['Taxa de aquisição mensal de clientes', 'Total Addressable Market — tamanho total do mercado potencial', 'Taxa de cancelamento de subscriptions', 'Tempo médio até ao mercado (time-to-market)'], correct: 1 },
      { q: 'Crescimento MoM de 10% equivale a que crescimento anual aproximado?', opts: ['120%', '150%', '214%', '10%'], correct: 2 },
      { q: 'O que deve conter o data room para due diligence?', opts: ['Apenas o deck de apresentação', 'Financeiros, KPIs históricos, contratos e cap table', 'Só os balanços dos últimos 3 anos', 'Lista de clientes e fornecedores'], correct: 1 },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'wm_biz_courses';
function loadProgress() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}
function saveProgress(p) { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); }

const LEVEL_META = {
  1: { label: 'Iniciado',   dot: 'bg-amber-500',  badge: 'bg-amber-100 text-amber-700' },
  2: { label: 'Intermédio', dot: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700' },
  3: { label: 'Avançado',   dot: 'bg-violet-500', badge: 'bg-violet-100 text-violet-700' },
};

// ─── Learn modal ──────────────────────────────────────────────────────────────
function LearnModal({ course, onClose, onComplete }) {
  const [step, setStep] = useState(0);
  const lesson = course.lessons[step];
  const isLast = step === course.lessons.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        className="relative bg-white rounded-2xl w-full max-w-lg z-10 overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{course.icon}</span>
            <div>
              <p className="text-white font-bold text-sm">{course.title}</p>
              <p className="text-slate-400 text-xs">{step + 1} de {course.lessons.length}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10"><X className="w-4 h-4 text-slate-400" /></button>
        </div>
        <div className="h-1 bg-slate-100">
          <div className="h-full bg-amber-500 transition-all" style={{ width: `${((step + 1) / course.lessons.length) * 100}%` }} />
        </div>
        <div className="p-6">
          <h3 className="font-bold text-slate-800 text-lg mb-3">{lesson.title}</h3>
          <p className="text-slate-600 text-sm leading-relaxed">{lesson.content}</p>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50">← Anterior</button>
          )}
          {isLast ? (
            <button onClick={() => { onComplete(); onClose(); }}
              className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Concluir
            </button>
          ) : (
            <button onClick={() => setStep(s => s + 1)}
              className="flex-1 h-11 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold flex items-center justify-center gap-1">
              Próximo <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Quiz modal ───────────────────────────────────────────────────────────────
function QuizModal({ course, onClose, onXP }) {
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = course.quiz[qIdx];
  const totalQ = course.quiz.length;
  const earnedXP = Math.round((score / totalQ) * course.xp_reward);

  const handleAnswer = (i) => {
    if (answered) return;
    setSelected(i);
    setAnswered(true);
    if (i === q.correct) setScore(s => s + 1);
  };

  const next = () => {
    if (qIdx + 1 >= totalQ) { setDone(true); onXP(earnedXP); }
    else { setQIdx(i => i + 1); setSelected(null); setAnswered(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        className="relative bg-white rounded-2xl w-full max-w-lg z-10 overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{course.icon}</span>
            <div>
              <p className="text-white font-bold text-sm">{course.title}</p>
              {!done && <p className="text-blue-200 text-xs">Pergunta {qIdx + 1} de {totalQ}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10"><X className="w-4 h-4 text-blue-200" /></button>
        </div>
        {!done && (
          <div className="h-1 bg-blue-900">
            <div className="h-full bg-amber-400 transition-all" style={{ width: `${(qIdx / totalQ) * 100}%` }} />
          </div>
        )}
        {done ? (
          <div className="p-8 text-center">
            <div className="text-5xl mb-3">{score === totalQ ? '🏆' : score >= totalQ / 2 ? '🎯' : '📚'}</div>
            <h3 className="font-bold text-slate-800 text-xl mb-1">{score}/{totalQ} corretas</h3>
            <p className="text-slate-500 text-sm mb-5">{score === totalQ ? 'Perfeito! Dominaste este tema.' : score >= totalQ / 2 ? 'Bom resultado! Continua a praticar.' : 'Estuda mais e volta a tentar!'}</p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl py-3 px-5 mb-6 inline-block">
              <span className="text-amber-700 font-bold text-xl">+{earnedXP} XP</span>
            </div>
            <button onClick={onClose} className="w-full h-11 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold">Fechar</button>
          </div>
        ) : (
          <div className="p-6">
            <p className="font-semibold text-slate-800 mb-5 leading-snug">{q.q}</p>
            <div className="space-y-2.5 mb-5">
              {q.opts.map((opt, i) => {
                const isRight = i === q.correct;
                const isChosen = i === selected;
                let cls = 'w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ';
                if (!answered) cls += 'border-slate-200 hover:border-blue-300 hover:bg-blue-50';
                else if (isRight) cls += 'border-emerald-400 bg-emerald-50 text-emerald-800';
                else if (isChosen) cls += 'border-red-400 bg-red-50 text-red-800';
                else cls += 'border-slate-100 text-slate-400';
                return <button key={i} onClick={() => handleAnswer(i)} disabled={answered} className={cls}>{opt}</button>;
              })}
            </div>
            {answered && (
              <div className={`p-3 rounded-xl mb-4 text-sm font-medium ${selected === q.correct ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {selected === q.correct ? '✓ Correto!' : `✗ A resposta certa era: "${q.opts[q.correct]}"`}
              </div>
            )}
            {answered && (
              <button onClick={next} className="w-full h-11 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold">
                {qIdx + 1 >= totalQ ? 'Ver resultado' : 'Próxima →'}
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Course Card ──────────────────────────────────────────────────────────────
function CourseCard({ course, unlocked, progress, onLearn, onQuiz }) {
  const completed = progress?.completed;
  const xp = progress?.xp || 0;
  const lessonsRead = progress?.lessonsRead || false;
  const fullPct = completed ? 100 : lessonsRead ? 50 : 0;

  return (
    <div className={`relative rounded-2xl bg-white p-3 sm:p-4 shadow-sm border border-slate-100 flex flex-col gap-2 ${!unlocked ? 'opacity-60' : ''}`}>
      {!unlocked && (
        <div className="absolute inset-0 rounded-2xl bg-white/70 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-1 p-3 text-center">
          <Lock className="h-5 w-5 text-slate-400" />
          <p className="text-sm text-slate-500">Completa o nível {course.level - 1}</p>
        </div>
      )}
      <div className="flex items-start gap-2.5">
        <div className="text-2xl sm:text-3xl shrink-0 mt-0.5">{course.icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-tight mb-0.5">{course.title}</h3>
          <p className="text-xs sm:text-sm text-slate-500 line-clamp-2">{course.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-500">
        <span className="flex items-center gap-0.5"><BookOpen className="h-3 w-3 shrink-0" />{course.lessons.length}</span>
        <span className="flex items-center gap-0.5"><Gamepad2 className="h-3 w-3 shrink-0" />{course.quiz.length}</span>
        <span className="flex items-center gap-0.5 text-amber-600 font-medium ml-auto">
          <Trophy className="h-3 w-3 shrink-0" />{xp > 0 ? `${xp}/` : ''}{course.xp_reward} XP
        </span>
      </div>
      {!completed && fullPct > 0 && (
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-0.5">
            <span>{lessonsRead ? 'Lições concluídas' : 'Em progresso'}</span>
            <span>{fullPct}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all" style={{ width: `${fullPct}%` }} />
          </div>
        </div>
      )}
      {completed && (
        <div className="flex items-center gap-1.5 text-emerald-600">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          <span className="text-sm font-medium">Completo · +{xp} XP</span>
        </div>
      )}
      {unlocked && (
        <div className="flex gap-1.5 mt-auto pt-1">
          <button onClick={onLearn}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-medium text-slate-700 transition-colors text-xs sm:text-sm">
            <BookOpen className="h-3.5 w-3.5 shrink-0" /> Aprender
          </button>
          <button onClick={onQuiz}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 font-medium text-white transition-colors text-xs sm:text-sm">
            <Gamepad2 className="h-3.5 w-3.5 shrink-0" /> Jogar (+XP)
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function BusinessGoals() {
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [progress, setProgress] = useState(loadProgress);
  const [learnModal, setLearnModal] = useState(null);
  const [quizModal, setQuizModal] = useState(null);

  const totalXP = Object.values(progress).reduce((s, p) => s + (p.xp || 0), 0);
  const completedCount = Object.values(progress).filter(p => p.completed).length;

  const levelCounts = [1, 2, 3].map(level => ({
    level,
    total: COURSES.filter(c => c.level === level).length,
    completed: COURSES.filter(c => c.level === level && progress[c.id]?.completed).length,
  }));

  const isCourseUnlocked = (course) => {
    if (course.level === 1) return true;
    return COURSES.filter(c => c.level === course.level - 1).every(pc => progress[pc.id]?.completed);
  };

  const handleLearnComplete = (course) => {
    const prev = loadProgress();
    const updated = { ...prev, [course.id]: { ...(prev[course.id] || {}), lessonsRead: true } };
    saveProgress(updated);
    setProgress(updated);
  };

  const handleQuizXP = (course, xp) => {
    const prev = loadProgress();
    const existing = prev[course.id] || {};
    const newXP = Math.max(existing.xp || 0, xp);
    const completed = newXP > 0 && existing.lessonsRead;
    const updated = { ...prev, [course.id]: { ...existing, xp: newXP, completed } };
    saveProgress(updated);
    setProgress(updated);
  };

  const levelsToRender = selectedLevel === 'all' ? [1, 2, 3] : [parseInt(selectedLevel)];

  return (
    <div className="space-y-5">
      {/* Hero banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden shadow-lg">
        <div className="bg-gradient-to-br from-amber-700 via-amber-800 to-orange-900 px-5 py-5 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute top-3 right-16 w-16 h-16 bg-white/5 rounded-full pointer-events-none" />
          <div className="relative">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center text-2xl backdrop-blur-sm shrink-0">🚀</div>
                <div className="min-w-0">
                  <p className="text-[10px] text-amber-200 font-semibold uppercase tracking-widest mb-0.5">Academia Business</p>
                  <p className="text-base sm:text-lg font-bold text-white">Formação para Empresários</p>
                  <p className="text-[11px] text-amber-200 mt-0.5">{COURSES.length} módulos · {completedCount} completos</p>
                </div>
              </div>
              <div className="bg-yellow-400/20 rounded-xl px-3 py-2 text-center shrink-0 backdrop-blur-sm">
                <div className="flex items-center gap-1 justify-center">
                  <Trophy className="h-3.5 w-3.5 text-yellow-300" />
                  <span className="text-base font-bold text-white">{totalXP}</span>
                </div>
                <p className="text-[10px] text-yellow-200">XP total</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {levelCounts.map(({ level, total, completed }) => (
                <div key={level} className="bg-white/10 rounded-xl px-3 py-2.5 backdrop-blur-sm">
                  <p className="text-[10px] text-amber-200 mb-1">Nível {level}</p>
                  <p className="text-white text-sm font-bold mb-1.5">{completed}<span className="text-amber-300 font-normal">/{total}</span></p>
                  <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white/70 rounded-full transition-all duration-700"
                      style={{ width: total > 0 ? `${(completed / total) * 100}%` : '0%' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Level filter tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {['all', '1', '2', '3'].map(level => (
          <button key={level} onClick={() => setSelectedLevel(level)}
            className={`flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${selectedLevel === level ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {level === 'all' ? 'Todos' : `Nível ${level}`}
          </button>
        ))}
      </div>

      {/* Course sections by level */}
      <div className="space-y-6">
        {levelsToRender.map(level => {
          const levelCourses = COURSES.filter(c => c.level === level);
          if (levelCourses.length === 0) return null;
          const meta = LEVEL_META[level];
          const lCount = levelCounts.find(l => l.level === level);
          return (
            <div key={level}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${meta.dot}`} />
                <h2 className="font-bold text-slate-800 text-sm sm:text-base">Nível {level} — {meta.label}</h2>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${meta.badge}`}>
                  {lCount?.completed}/{lCount?.total}
                </span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {levelCourses.map((course, idx) => (
                  <motion.div key={course.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                    <CourseCard
                      course={course}
                      unlocked={isCourseUnlocked(course)}
                      progress={progress[course.id]}
                      onLearn={() => setLearnModal(course)}
                      onQuiz={() => setQuizModal(course)}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {learnModal && (
          <LearnModal course={learnModal} onClose={() => setLearnModal(null)} onComplete={() => handleLearnComplete(learnModal)} />
        )}
        {quizModal && (
          <QuizModal course={quizModal} onClose={() => setQuizModal(null)} onXP={(xp) => handleQuizXP(quizModal, xp)} />
        )}
      </AnimatePresence>
    </div>
  );
}
