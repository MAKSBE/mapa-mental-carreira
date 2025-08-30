# 📊 Mapa Mental de Carreira - Documentação Técnica

## 🎯 Visão Geral

O **Mapa Mental de Carreira** é uma aplicação React interativa que utiliza D3.js para visualizar conexões inteligentes entre posições profissionais. O sistema analisa compatibilidade salarial, áreas profissionais e níveis hierárquicos para sugerir transições de carreira realistas.

---

## 🏗️ Arquitetura do Sistema

### **Stack Tecnológico**
- **Frontend**: React 18.2.0 + Vite 5.0.0
- **Visualização**: D3.js 7.8.5 (SVG manipulation)
- **UI Framework**: Tailwind CSS 3.3.6
- **Ícones**: Lucide React
- **Linguagem**: JavaScript/JSX

### **Estrutura de Arquivos**
```
src/
├── components/
│   └── CareerMindMapWorking.jsx  # Componente principal
├── data/
│   └── positions.js              # Base de dados das posições
└── assets/                       # Recursos estáticos
```

---

## 🧠 Algoritmo de Conexões Inteligentes

### **Função: `getSmartConnections(positionId)`**

O coração do sistema é o algoritmo que calcula compatibilidade entre posições baseado em três pilares:

#### **1. Score Salarial (35-45 pontos)**
```javascript
const salaryFlexibility = 0.3; // 30% de flexibilidade
const minAcceptableSalary = currentSalaryAvg * (1 - salaryFlexibility);
const maxAcceptableSalary = currentSalaryAvg * (1 + salaryFlexibility * 1.5);
```

**Critérios:**
- ✅ **Salário compatível**: 15-35 pontos (dentro da faixa ±30%)
- ✅ **Progressão salarial**: 10 pontos (salário maior que atual)
- ✅ **Potencial de crescimento**: Bonificação por aumento salarial

#### **2. Score por Área Profissional (5-30 pontos)**
```javascript
const relatedAreas = {
  'Tecnologia': ['Dados', 'Produto'],
  'Gestão': ['Financeiro', 'Recursos Humanos'],
  'Financeiro': ['Gestão', 'Dados'],
  'Dados': ['Tecnologia', 'Financeiro'],
  'Produto': ['Tecnologia', 'Dados'],
  'Recursos Humanos': ['Gestão']
};
```

**Pontuação:**
- 🎯 **Mesma área**: 30 pontos
- 🔄 **Área relacionada**: 18 pontos  
- 🆕 **Nova área**: 5 pontos

#### **3. Score por Nível Hierárquico (15-25 pontos)**
```javascript
const levelScore = {
  'Júnior': 1, 'Pleno': 2, 'Sênior': 3, 'Especialista': 3,
  'Coordenador': 4, 'Gerente': 5, 'Diretor': 6, 'VP': 7, 'C-Level': 8
};
```

**Progressão:**
- ⚖️ **Mesmo nível**: 20 pontos
- 📈 **Progressão natural** (+1 nível): 25 pontos
- 🚀 **Grande crescimento** (+2 níveis): 15 pontos

### **Filtro de Qualidade**
- ✅ Apenas conexões com **score ≥ 20%** são exibidas
- 📊 Máximo de **12 conexões** por posição
- 🏆 Ordenação por score (maior para menor)

---

## 🎨 Sistema de Visualização

### **Layout do Mapa Mental**

#### **Nó Central**
- 📍 **Posição**: Centro do SVG (500x350)
- 📏 **Dimensões**: 160x80 pixels (posição atual)
- 🎨 **Estilo**: Borda dourada + sombra destacada

#### **Posicionamento Radial por Área**
```javascript
const pillarAngles = {
  'Tecnologia': { startAngle: 0, endAngle: Math.PI * 0.33 },
  'Produto': { startAngle: Math.PI * 0.33, endAngle: Math.PI * 0.66 },
  'Dados': { startAngle: Math.PI * 0.66, endAngle: Math.PI },
  'Gestão': { startAngle: Math.PI, endAngle: Math.PI * 1.33 },
  'Financeiro': { startAngle: Math.PI * 1.33, endAngle: Math.PI * 1.66 },
  'Recursos Humanos': { startAngle: Math.PI * 1.66, endAngle: Math.PI * 2 }
};
```

**Cálculo de Posição:**
- 🎯 Cada área profissional ocupa um setor de ~60° (π/3 radianos)
- 📐 Nós da mesma área são distribuídos uniformemente no setor
- 📏 **Raio base**: 240px (interno), 280px (cross-functional)
- ⚡ **Raio dinâmico**: `radius += (score/100) * 40` (compatibilidade)

### **Sistema Anti-Colisão**

#### **Algoritmo de Detecção**
```javascript
const detectCollision = (node1, node2) => {
  const margin = 25; // Margem de segurança
  return (
    node1.x < node2.x + node2.width + margin &&
    node1.x + node1.width + margin > node2.x &&
    node1.y < node2.y + node2.height + margin &&
    node1.y + node1.height + margin > node2.y
  );
};
```

#### **Resolução de Conflitos**
- 🔄 **100 iterações máximas** para resolver sobreposições
- 📐 **Empurrão radial**: Nós são afastados do centro em caso de colisão
- 🎯 **Prioridade**: Nó central mantém posição fixa
- 📏 **Limites**: Nós ficam dentro da área do SVG (1000x700)

---

## 🎮 Interatividade e Estados

### **Estados Principais**
```javascript
const [selectedPositionId, setSelectedPositionId] = useState('dev-net');
const [visibleNodes, setVisibleNodes] = useState(['dev-net']);
const [visitedPositions, setVisitedPositions] = useState(['dev-net']);
const [searchTerm, setSearchTerm] = useState('');
const [searchResults, setSearchResults] = useState([]);
const [showSearch, setShowSearch] = useState(false);
const [isLegendOpen, setIsLegendOpen] = useState(false);
```

### **Função: `changePosition(newPositionId)`**

**Fluxo de Mudança de Posição:**

1. **Atualização do Estado**
   ```javascript
   setSelectedPositionId(newPositionId);
   ```

2. **Gerenciamento de Histórico**
   ```javascript
   setVisitedPositions(prev => {
     const updated = [...prev];
     if (selectedPositionId && !updated.includes(selectedPositionId)) {
       updated.push(selectedPositionId);
     }
     if (!updated.includes(newPositionId)) {
       updated.push(newPositionId);
     }
     return updated;
   });
   ```

3. **Cálculo de Conexões**
   ```javascript
   const smartConnections = getSmartConnections(newPositionId);
   const validConnectionIds = smartConnections.map(c => c.id);
   const newVisibleNodes = [newPositionId, ...validConnectionIds];
   ```

4. **Renderização Sincronizada**
   - ⚡ Atualização imediata dos nós visíveis
   - 🎨 Re-renderização do SVG via useEffect
   - 📊 Atualização do painel de detalhes

---

## 🔍 Sistema de Busca

### **Funcionalidade de Busca**
```javascript
const handleSearchPositions = (term) => {
  const results = [];
  Object.entries(positions).forEach(([posKey, position]) => {
    if (
      position.title.toLowerCase().includes(term.toLowerCase()) ||
      position.description.toLowerCase().includes(term.toLowerCase()) ||
      position.pillar.toLowerCase().includes(term.toLowerCase()) ||
      position.level.toLowerCase().includes(term.toLowerCase()) ||
      position.salary.toLowerCase().includes(term.toLowerCase())
    ) {
      // Calcular compatibilidade se aplicável
      let compatibility = null;
      if (selectedPositionId && selectedPositionId !== posKey) {
        const connections = getSmartConnections(selectedPositionId);
        const connection = connections.find(c => c.id === posKey);
        if (connection) {
          compatibility = connection.score;
        }
      }
      
      results.push({
        ...position,
        key: posKey,
        compatibility: compatibility
      });
    }
  });
}
```

**Recursos de Busca:**
- 🔎 **Busca multicamp**: título, descrição, área, nível, salário
- 📊 **Compatibilidade**: Mostra % de compatibilidade com posição atual
- 📋 **Ordenação inteligente**: Por compatibilidade, depois alfabética
- ⚡ **Busca em tempo real**: Atualização conforme digitação

---

## 🎨 Interface de Usuário

### **Componentes Principais**

#### **1. Header com Estatísticas**
```jsx
<div className="flex items-center gap-4">
  <span>{Object.keys(positions).length} Posições</span>
  <span>{visibleNodes.length} Visíveis</span>
  <span>{getSmartConnections(selectedPositionId).length} Conexões Inteligentes</span>
  <span>Histórico: {visitedPositions.length} posições</span>
</div>
```

#### **2. Histórico de Carreira** (Novo!)
- 📋 **Lista horizontal** acima do mapa mental
- 🎨 **Chips coloridos** por área profissional
- 👆 **Navegação por clique** para posições anteriores
- 📱 **Design responsivo** com flex-wrap

#### **3. Mapa SVG Interativo**
- 🎯 **1000x700px** com viewBox responsivo
- 🎨 **Gradiente de fundo**: `linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)`
- ⚡ **Hover effects**: Destaque de conexões relacionadas
- 👆 **Click handlers**: Navegação entre posições

#### **4. Painel de Detalhes**
- 📊 **Grid responsivo**: 1 coluna (mobile) → 2 colunas (desktop)
- 📋 **Lista de conexões**: Todas as 12 conexões com detalhes
- 🎨 **Indicadores visuais**: Score, tipo de transição, diferença salarial
- ✅ **Status visual**: Checkmark para nós visíveis no mapa

#### **5. Acordeão de Legenda**
- 📍 **Posição fixa**: Bottom da tela
- 📚 **3 seções**: Tipos de conexão, indicadores, áreas profissionais
- 🎨 **Paleta de cores**: Cada área tem cor específica
- 💡 **Explicação do algoritmo**: Sistema de 20% de corte

---

## 🎨 Sistema de Cores e Estilos

### **Paleta por Área Profissional**
```javascript
const colorMap = {
  'Tecnologia': '#1E40AF',      // Azul escuro
  'Produto': '#7C3AED',         // Roxo
  'Dados': '#DC2626',           // Vermelho
  'Gestão': '#059669',          // Verde
  'Financeiro': '#D97706',      // Laranja
  'Recursos Humanos': '#BE185D' // Rosa
};
```

### **Estilos de Conexão**
```javascript
// Conexões dentro da mesma área
if (d.type === 'internal') return '#60A5FA'; // Azul claro, linha sólida

// Conexões entre áreas diferentes  
if (d.type === 'cross-functional') return '#A78BFA'; // Roxo claro, linha tracejada
```

### **Indicadores Visuais**
- 🎯 **Posição atual**: Borda dourada (#FBBF24) + sombra
- 📏 **Espessura das linhas**: Proporcional ao score de compatibilidade
- 👻 **Opacidade**: Cross-functional = 0.6, Internal = 0.8
- 🎨 **Setas**: Marcadores SVG indicando direção da transição

---

## ⚡ Performance e Otimizações

### **Renderização Eficiente**
```javascript
useEffect(() => {
  const svg = d3.select(svgRef.current);
  svg.selectAll("*").remove(); // Limpeza completa antes de re-render
  
  // ... lógica de renderização ...
  
}, [visibleNodes, selectedPositionId]); // Dependências específicas
```

### **Prevenção de Re-renders Desnecessários**
- 🎯 **Dependências específicas**: useEffect só roda quando necessário
- 📊 **Cálculo sob demanda**: Conexões calculadas apenas quando mudança de posição
- 🚫 **Remoção de setTimeout**: Renderização síncrona para evitar inconsistências
- 🎨 **D3.js join pattern**: Eficiência na manipulação do DOM

### **Anti-Collision Optimizado**
- ⚡ **100 iterações máximas**: Evita loops infinitos
- 📐 **Detecção eficiente**: Verificação de overlap com margem
- 🎯 **Priorização**: Nó central mantém posição fixa
- 📏 **Validação de limites**: Nós sempre dentro da área visível

---

## 🔧 Funcionalidades Avançadas

### **1. Sistema de Filtros**
- **👁️ Mostrar Válidos**: Exibe todas as posições com conexões ≥20%
- **↻ Resetar**: Volta ao estado inicial (dev-net)
- **🔍 Busca dinâmica**: Filtro em tempo real com compatibilidade

### **2. Gestão de Histórico**
```javascript
// Histórico é gerenciado separadamente dos nós visíveis
const newVisibleNodes = [newPositionId, ...validConnectionIds];
// Não inclui mais automaticamente visitedPositions
```

### **3. Navegação Inteligente**
- **Clique em conexão**: Adiciona à visualização se tem score ≥20%
- **Clique no histórico**: Navega e calcula novas conexões
- **Busca com navegação**: Busca → clique → mudança de posição

### **4. Feedback Visual em Tempo Real**
- **Hover nos nós**: Destaque de conexões relacionadas
- **Indicador de visibilidade**: ✅ nos nós já visíveis no mapa
- **Score colorido**: Verde (70%+), Amarelo (50-69%), Laranja (<50%)

---

## 📊 Estrutura de Dados

### **Formato das Posições**
```javascript
{
  "dev-net": {
    "title": "Desenvolvedor .NET",
    "level": "Pleno",
    "pillar": "Tecnologia", 
    "salary": "R$ 8.000 - R$ 12.000",
    "salaryMin": 8000,
    "salaryMax": 12000,
    "description": "Desenvolvimento de aplicações...",
    "requirements": [
      "Experiência com C# e .NET Framework",
      "Conhecimento em SQL Server",
      // ...
    ]
  }
}
```

### **Estrutura de Conexão**
```javascript
{
  id: "targetPositionId",
  position: { /* dados da posição */ },
  score: 85, // 0-100
  reasons: ["Progressão salarial", "Mesma área"],
  salaryDifference: 3000, // Diferença em reais
  transitionType: "internal" // ou "cross-functional"
}
```

---

## 🚀 Fluxo de Execução

### **1. Inicialização**
```
App carrega → Estado inicial (dev-net) → Calcula conexões → Renderiza SVG
```

### **2. Mudança de Posição**
```
Click/Busca → changePosition() → Atualiza estados → useEffect → Re-render SVG
```

### **3. Renderização do Mapa**
```
Limpa SVG → Cria nós → Resolve colisões → Adiciona links → Adiciona interatividade
```

### **4. Interação do Usuário**
```
Hover → Destaque → Click → Navegação → Atualização → Feedback visual
```

---

## 🎯 Casos de Uso Principais

### **1. Exploração de Carreira**
- 👤 **Usuário**: Profissional buscando crescimento
- 🎯 **Objetivo**: Visualizar opções de transição realistas
- 📊 **Valor**: Baseado em dados salariais e compatibilidade

### **2. Planejamento de Transição**
- 👤 **Usuário**: Profissional em mudança de área
- 🎯 **Objetivo**: Entender requisitos e diferença salarial
- 📊 **Valor**: Score de compatibilidade + detalhes técnicos

### **3. Análise Comparativa**
- 👤 **Usuário**: Recrutador ou consultor de carreira
- 🎯 **Objetivo**: Comparar múltiplas opções
- 📊 **Valor**: Visualização clara de conexões e histórico

---

## 🔮 Possíveis Melhorias

### **Performance**
- ⚡ Lazy loading para grandes datasets
- 🎨 Canvas rendering para >100 nós
- 💾 Cache de conexões calculadas

### **UX/UI**
- 📱 Gestos touch para mobile
- 🎨 Animações de transição suaves
- 🔍 Zoom e pan no SVG

### **Funcionalidades**
- 📊 Exportação de relatórios
- 💾 Salvar histórico no localStorage
- 🎯 Filtros avançados por critérios específicos

---

## 📝 Conclusão

O **Mapa Mental de Carreira** é uma aplicação sofisticada que combina algoritmos inteligentes de compatibilidade com visualização interativa avançada. O sistema oferece insights valiosos para transições de carreira através de:

- 🧠 **Algoritmo robusto** de análise de compatibilidade
- 🎨 **Visualização clara** com D3.js e SVG
- ⚡ **Performance otimizada** com React + Vite
- 🎮 **Interatividade fluida** com feedback em tempo real
- 📊 **Interface intuitiva** com componentes bem estruturados

A aplicação representa uma ferramenta valiosa para profissionais, recrutadores e consultores de carreira que buscam dados quantitativos para decisões estratégicas de desenvolvimento profissional.

---

*Documentação gerada em: 30 de Agosto de 2025*  
*Versão: 2.0 (UI Reestruturada)*
