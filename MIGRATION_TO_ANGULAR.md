# 🗺️ Mapa de Carreiras - Migração para Angular

## 📋 Visão Geral do Projeto

O **Mapa de Carreiras** é uma aplicação interativa React que visualiza progressões de carreira através de um mapa mental dinâmico. Utiliza D3.js para criar visualizações SVG interativas e algoritmos inteligentes para calcular compatibilidade entre posições baseado em **sobreposição real de faixas salariais**.

### 🎯 Funcionalidades Principais Implementadas
- ✅ Visualização SVG com D3.js (1000x700px) com zoom/pan
- ✅ Sistema de busca em tempo real com filtros múltiplos
- ✅ Algoritmo de compatibilidade baseado em sobreposição salarial
- ✅ Histórico de posições visitadas com navegação
- ✅ Legenda interativa em acordeão (removida da parte inferior)
- ✅ Layout responsivo com Tailwind CSS
- ✅ Anti-colisão de nós com algoritmo iterativo
- ✅ Controles de zoom centralizados no SVG
- ✅ Sistema de scores de compatibilidade (0-100%)
- ✅ Detecção automática de "teto de carreira"
- ❌ **Botão "Mostrar Válidos" foi removido** (conforme solicitado)

### 🎮 Interações do Usuário
- **Busca**: Input reativo para encontrar posições
- **Clique em nós**: Seleciona nova posição central 
- **Zoom/Pan**: Controles mouse + botões -, ⌂, +
- **Histórico**: Chips clicáveis para revisitar posições
- **Legenda**: Acordeão na parte inferior da tela
- **Reset**: Volta para posição inicial (dev-net)

---

## 🏗️ Arquitetura Atual (React)

### 📊 Estados Gerenciados (React Hooks)

```typescript
// Estados principais do componente CareerMindMapWorking
const [selectedPositionId, setSelectedPositionId] = useState('dev-net');
const [visibleNodes, setVisibleNodes] = useState(['dev-net']);
const [searchTerm, setSearchTerm] = useState('');
const [searchResults, setSearchResults] = useState([]);
const [showSearch, setShowSearch] = useState(false);
const [isLegendOpen, setIsLegendOpen] = useState(false);
const [visitedPositions, setVisitedPositions] = useState(['dev-net']);
```

### 🔄 Fluxo de Dados Principal

1. **Seleção de Posição**: `changePosition(newPositionId)`
   - Atualiza `selectedPositionId`
   - Adiciona ao `visitedPositions` (histórico)
   - Calcula `smartConnections` para nova posição
   - Atualiza `visibleNodes` com conexões válidas

2. **Sistema de Busca**: `handleSearchPositions(term)`
   - Busca em title, description, pillar, level, salary
   - Calcula compatibility score se há posição selecionada
   - Ordena por compatibilidade + alfabética
   - Atualiza `searchResults`

3. **Visualização D3**: `useEffect([visibleNodes, selectedPositionId])`
   - Re-renderiza SVG quando estado muda
   - Posiciona nós com anti-colisão (100 iterações)
   - Aplica zoom/pan com limites (0.3x - 3x)
   - Renderiza conexões com cores e setas

---

## 🧮 Algoritmo de Compatibilidade Detalhado

### 🎯 Critério Fundamental: Sobreposição de Faixas Salariais

**IMPORTANTE**: Este é o filtro eliminatório. Sem sobreposição = sem conexão.

```typescript
// Filtro principal que determina viabilidade da transição
const hasRangeOverlap = currentSalaryMax >= targetSalaryMin && 
                       currentSalaryMin <= targetSalaryMax;

if (!hasRangeOverlap) {
  return; // Elimina conexão imediatamente
}
```

### 📊 Exemplos Reais de Sobreposição

#### ✅ **Conexões Aprovadas** (com sobreposição)

```typescript
// UX Designer (R$ 8.000-14.000) → UX Lead (R$ 12.000-18.000)
// Sobreposição: R$ 12.000-14.000 (R$ 2.000 de overlap)
// Análise: ✅ Viável - progressão dentro da compatibilidade salarial

// Dev Pleno (R$ 10.000-16.000) → Dev Sênior (R$ 14.000-22.000)
// Sobreposição: R$ 14.000-16.000 (R$ 2.000 de overlap)  
// Análise: ✅ Viável - evolução natural com base comum

// Analista Dados (R$ 12.000-18.000) → Cientista Dados (R$ 16.000-25.000)
// Sobreposição: R$ 16.000-18.000 (R$ 2.000 de overlap)
// Análise: ✅ Viável - especialização com progressão
```

#### ❌ **Conexões Rejeitadas** (sem sobreposição)

```typescript
// UX Designer (R$ 8.000-14.000) → Diretor Produto (R$ 20.000-35.000)
// Gap: R$ 14.000 → R$ 20.000 (R$ 6.000 sem sobreposição)
// Análise: ❌ Inviável - salto salarial muito grande

// Dev Júnior (R$ 4.000-7.000) → Tech Lead (R$ 18.000-28.000)
// Gap: R$ 7.000 → R$ 18.000 (R$ 11.000 sem sobreposição)
// Análise: ❌ Inviável - progressão irrealista

// Analista Jr (R$ 6.000-10.000) → Gerente (R$ 25.000-40.000)
// Gap: R$ 10.000 → R$ 25.000 (R$ 15.000 sem sobreposição)
// Análise: ❌ Inviável - mudança muito abrupta
```

### 🏆 Sistema de Scores (após aprovação no filtro principal)

#### 1. **Score Salarial** (0-40 pontos)

```typescript
const salaryIncrease = targetSalaryAvg - currentSalaryAvg;

if (salaryIncrease > 0) {
  // Há progressão dentro da faixa compatível
  const progressionPercentage = salaryIncrease / currentSalaryAvg;
  const salaryScore = Math.min(40, progressionPercentage * 40);
  
  if (progressionPercentage > 0.5) {
    reasons.push('Grande progressão salarial'); // >50% aumento
  } else if (progressionPercentage > 0.2) {
    reasons.push('Boa progressão salarial'); // 20-50% aumento  
  } else {
    reasons.push('Progressão salarial moderada'); // 0-20% aumento
  }
} else {
  // Compatibilidade sem progressão (movimento lateral)
  compatibilityScore += 25;
  reasons.push('Faixa salarial compatível');
}
```

#### 2. **Score por Área** (5-30 pontos)

```typescript
if (currentPos.pillar === targetPos.pillar) {
  compatibilityScore += 30; // Mesma área = máxima pontuação
  reasons.push('Mesma área');
} else {
  // Mapeamento de áreas relacionadas
  const relatedAreas = {
    'Tecnologia': ['Dados', 'Produto'],
    'Gestão': ['Financeiro', 'Recursos Humanos'], 
    'Financeiro': ['Gestão', 'Dados'],
    'Dados': ['Tecnologia', 'Financeiro'],
    'Produto': ['Tecnologia', 'Dados'],
    'Recursos Humanos': ['Gestão']
  };
  
  if (relatedAreas[currentPos.pillar]?.includes(targetPos.pillar)) {
    compatibilityScore += 18; // Área relacionada
    reasons.push('Área relacionada');
  } else {
    compatibilityScore += 5; // Área completamente nova
    reasons.push('Nova área');
  }
}
```

#### 3. **Score Hierárquico** (0-25 pontos)

```typescript
const levelScore = {
  'Júnior': 1, 'Pleno': 2, 'Sênior': 3, 'Especialista': 3,
  'Coordenador': 4, 'Gerente': 5, 'Diretor': 6, 'VP': 7, 'C-Level': 8
};

const currentLevel = levelScore[currentPos.level] || 2;
const targetLevel = levelScore[targetPos.level] || 2;
const levelDiff = targetLevel - currentLevel;

if (levelDiff === 0) {
  compatibilityScore += 20; // Movimento lateral
  reasons.push('Mesmo nível');
} else if (levelDiff === 1) {
  compatibilityScore += 25; // Promoção natural (melhor pontuação)
  reasons.push('Progressão natural');
} else if (levelDiff === 2) {
  compatibilityScore += 15; // Grande salto (menos pontos)
  reasons.push('Grande crescimento');
}
// levelDiff < 0 (regressão) ou > 2 (salto muito grande) = 0 pontos
```

#### 4. **Filtro Final e Ordenação**

```typescript
// Score mínimo de 20 pontos para ser exibido
if (compatibilityScore >= 20) {
  connections.push({
    id: targetId,
    position: targetPos,
    score: Math.min(100, Math.round(compatibilityScore)), // Máximo 100
    reasons: reasons,
    salaryDifference: Math.round(targetSalaryAvg - currentSalaryAvg),
    transitionType: currentPos.pillar === targetPos.pillar ? 'internal' : 'cross-functional'
  });
}

// Ordenar por score (maior primeiro) e limitar a 12 resultados
return connections.sort((a, b) => b.score - a.score).slice(0, 12);
```

### 🔍 Detecção de Teto de Carreira

```typescript
// Verificar se posição atual é teto da carreira na área
const sameAreaPositions = Object.entries(positions).filter(([id, pos]) => 
  id !== positionId && pos.pillar === currentPos.pillar
);

const isCareerCeiling = sameAreaPositions.every(([id, pos]) => {
  const otherSalaryMax = pos.salaryMax || 0;
  return currentSalaryMin >= otherSalaryMax; // Salário mínimo atual >= salário máximo de outras posições
});

// Se é teto E sem progressão salarial, reduzir score
if (isCareerCeiling && targetSalaryAvg <= currentSalaryAvg) {
  return; // Não mostrar movimentos laterais quando já no teto
}
```

---

## 🎨 Interface Detalhada (Estado Atual)

### 📱 Layout Responsivo

#### Header (Sempre Visível)
```tsx
<div className="bg-white shadow-sm border-b">
  <div className="max-w-7xl mx-auto px-6 py-4">
    {/* Título e estatísticas */}
    <div className="flex items-center justify-between mb-4">
      <div>
        <h1>Mapa de Carreiras</h1>
        <p>Versão Funcional - Sistema Interativo</p>
      </div>
      <div className="flex items-center gap-4">
        {/* Indicadores: Total de posições, Visíveis, Conexões, Histórico */}
      </div>
    </div>
    
    {/* Sistema de busca */}
    <div className="flex flex-col lg:flex-row gap-4">
      <input type="text" placeholder="Buscar..." />
      <button onClick={handleReset}>↻ Resetar</button>
      {/* Botão "Mostrar Válidos" foi REMOVIDO */}
    </div>
  </div>
</div>
```

#### Histórico de Carreira (Condicional)
```tsx
{visitedPositions.length > 1 && (
  <div className="bg-white rounded-xl shadow-lg">
    <div className="p-4 bg-gradient-to-r from-gray-600 to-gray-700">
      <h2>Histórico de Carreira</h2>
    </div>
    <div className="p-4">
      {/* Chips clicáveis das posições visitadas */}
      {visitedPositions.slice(0, -1).map(positionId => (
        <div onClick={() => changePosition(positionId)}>
          {/* Chip com cor da área */}
        </div>
      ))}
    </div>
  </div>
)}
```

#### Mapa SVG (1000x700px)
```tsx
<div className="bg-white rounded-xl shadow-lg">
  <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600">
    <h2>Mapa Mental de Carreira</h2>
  </div>
  <svg 
    ref={svgRef}
    width="100%" height="700"
    viewBox="0 0 1000 700"
    style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}
  />
</div>
```

**Funcionalidades SVG Implementadas**:
- ✅ Zoom: 0.3x a 3x (scroll mouse + botões)
- ✅ Pan: Arrastar com mouse
- ✅ Controles centralizados: -, ⌂, + (125px width, bottom center)
- ✅ Anti-colisão: 100 iterações, margem 25px
- ✅ Nó central: 160x80px, borda dourada
- ✅ Nós conectados: 140x70px
- ✅ Conexões: Linhas sólidas (mesma área) vs tracejadas (cross-functional)
- ✅ Espessura das linhas: Baseada no score de compatibilidade
- ✅ Setas direcionais: Azul (internal) vs Roxo (cross-functional)

#### Painel de Detalhes (2 Colunas)
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Coluna Esquerda: Info da posição */}
  <div>
    <h3>{selectedPosition.title}</h3>
    <div>Nível, Salário, Área</div>
    <div>Descrição</div>
    <div>Requisitos (primeiros 5)</div>
  </div>
  
  {/* Coluna Direita: Oportunidades */}
  <div>
    <h4>Conexões Inteligentes de Carreira</h4>
    
    {/* Mensagens de teto */}
    {isAbsoluteMaximum && (
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50">
        🏆 LIMITE MÁXIMO ATINGIDO!
      </div>
    )}
    
    {/* Lista de conexões */}
    {smartConnections.map(connection => (
      <div className="p-3 cursor-pointer" onClick={() => handleNodeClick(connection)}>
        {/* Score, tipo de transição, diferença salarial */}
      </div>
    ))}
  </div>
</div>
```

#### Legenda (Acordeão na Parte Inferior)
```tsx
{visibleNodes.length > 1 && (
  <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
    <button onClick={() => setIsLegendOpen(!isLegendOpen)}>
      Legenda das Conexões ({connections.length} ativas)
    </button>
    
    {isLegendOpen && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tipos de Conexão */}
        {/* Indicadores Visuais */} 
        {/* Áreas Profissionais */}
      </div>
    )}
  </div>
)}
```

### 🎨 Sistema de Cores

```scss
// Áreas profissionais
$area-colors: (
  'Tecnologia': #1E40AF,      // Azul escuro 💻
  'Produto': #7C3AED,         // Roxo 🎯
  'Dados': #DC2626,           // Vermelho 📊
  'Gestão': #059669,          // Verde 👥
  'Financeiro': #D97706,      // Laranja 💰
  'Recursos Humanos': #BE185D // Rosa 👤
);

// Estados de compatibilidade
$compatibility-colors: (
  'alta': #10B981,     // Verde (≥70%)
  'media': #F59E0B,    // Amarelo (50-69%)
  'baixa': #EF4444     // Vermelho (20-49%)
);

// Conexões
$connection-colors: (
  'internal': #60A5FA,        // Azul claro (mesma área)
  'cross-functional': #A78BFA // Roxo claro (mudança de área)
);

// Estado atual
$current-position: #FBBF24;   // Dourado
```

---
```typescript
interface Position {
  id: string;
  title: string;
  description: string;
  pillar: 'Tecnologia' | 'Produto' | 'Dados' | 'Gestão' | 'Financeiro' | 'Recursos Humanos';
  level: 'Júnior' | 'Pleno' | 'Sênior' | 'Especialista' | 'Coordenador' | 'Gerente' | 'Diretor' | 'VP' | 'C-Level';
  salary: string; // Formato: "R$ 5.000 - 8.000"
  salaryMin: number;
  salaryMax: number;
  requirements?: string[];
}
```

#### Interface Connection
```typescript
interface Connection {
  id: string;
  position: Position;
  score: number; // 0-100
  reasons: string[];
  salaryDifference: number;
  transitionType: 'internal' | 'cross-functional';
}
```

#### Interface Node (para D3.js)
```typescript
interface Node extends Position {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

---

## 🧮 Algoritmo de Compatibilidade

### Critérios de Avaliação

#### 1. **Filtro Principal - Sobreposição de Faixas Salariais** 
```typescript
// Verificar sobreposição real entre faixas salariais
const hasRangeOverlap = currentSalaryMax >= targetSalaryMin && currentSalaryMin <= targetSalaryMax;

if (!hasRangeOverlap) {
  return; // Eliminar posições sem sobreposição de faixas
}

// Exemplos de sobreposição:
// UX Designer (8-14k) ↔ UX Lead (12-18k) ✅ (sobreposição: 12-14k)
// UX Designer (8-14k) ↔ Diretor (20-35k) ❌ (sem sobreposição)
// Dev Pleno (10-16k) ↔ Dev Sênior (14-22k) ✅ (sobreposição: 14-16k)
```

#### 2. **Score Salarial (0-40 pontos)**
```typescript
const salaryIncrease = targetSalaryAvg - currentSalaryAvg;

if (salaryIncrease > 0) {
  // Há progressão salarial dentro da faixa compatível
  const progressionPercentage = salaryIncrease / currentSalaryAvg;
  const salaryScore = Math.min(40, progressionPercentage * 40);
  
  // Categorização da progressão
  if (progressionPercentage > 0.5) {
    reasons.push('Grande progressão salarial'); // >50% aumento
  } else if (progressionPercentage > 0.2) {
    reasons.push('Boa progressão salarial'); // 20-50% aumento
  } else {
    reasons.push('Progressão salarial moderada'); // 0-20% aumento
  }
} else if (hasRangeOverlap) {
  // Há compatibilidade salarial mesmo sem progressão
  compatibilityScore += 25;
  reasons.push('Faixa salarial compatível');
}
```

#### 3. **Score por Área (0-30 pontos)**

```typescript
// Mesma área = 30 pontos
if (currentPillar === targetPillar) {
  score += 30;
  reasons.push('Mesma área');
}

// Áreas relacionadas = 18 pontos
const relatedAreas = {
  'Tecnologia': ['Dados', 'Produto'],
  'Gestão': ['Financeiro', 'Recursos Humanos'],
  'Financeiro': ['Gestão', 'Dados'],
  'Dados': ['Tecnologia', 'Financeiro'],
  'Produto': ['Tecnologia', 'Dados'],
  'Recursos Humanos': ['Gestão']
};

if (relatedAreas[currentPillar]?.includes(targetPillar)) {
  score += 18;
  reasons.push('Área relacionada');
} else {
  // Área completamente nova = 5 pontos
  score += 5;
  reasons.push('Nova área');
}
```

#### 4. **Score Hierárquico (0-25 pontos)**
```typescript
const levelScores = {
  'Júnior': 1, 'Pleno': 2, 'Sênior': 3, 'Especialista': 3,
  'Coordenador': 4, 'Gerente': 5, 'Diretor': 6, 'VP': 7, 'C-Level': 8
};

const levelDiff = targetLevel - currentLevel;

if (levelDiff === 0) {
  score += 20; // Movimento lateral
  reasons.push('Mesmo nível');
} else if (levelDiff === 1) {
  score += 25; // Promoção natural
  reasons.push('Progressão natural');
} else if (levelDiff === 2) {
  score += 15; // Grande salto
  reasons.push('Grande crescimento');
}
// Regressão hierárquica ou saltos muito grandes = 0 pontos
```

#### 5. **Filtro Final**
```typescript
// Score mínimo de 20 pontos para exibição
if (compatibilityScore >= 20) {
  connections.push(connection);
}

// Ordenar por score e limitar a 12 resultados
return connections.sort((a, b) => b.score - a.score).slice(0, 12);
```

### 📊 Exemplos Práticos de Sobreposição

#### ✅ **Conexões Válidas**
```typescript
// UX Designer (8k-14k) → UX Lead (12k-18k)
// Sobreposição: 12k-14k ✅
// Score: Progressão (15 pts) + Mesma área (30 pts) + Progressão natural (25 pts) = 70 pts

// Dev Pleno (10k-16k) → Dev Sênior (14k-22k) 
// Sobreposição: 14k-16k ✅
// Score: Progressão (20 pts) + Mesma área (30 pts) + Progressão natural (25 pts) = 75 pts

// Analista Dados (12k-18k) → Cientista Dados (16k-25k)
// Sobreposição: 16k-18k ✅
// Score: Progressão (25 pts) + Mesma área (30 pts) + Progressão natural (25 pts) = 80 pts
```

#### ❌ **Conexões Bloqueadas**
```typescript
// UX Designer (8k-14k) → Diretor Produto (20k-35k)
// Sobreposição: Nenhuma ❌ (gap de 6k)
// Resultado: Conexão rejeitada no filtro principal

// Dev Júnior (4k-7k) → Tech Lead (18k-28k)
// Sobreposição: Nenhuma ❌ (gap de 11k)
// Resultado: Conexão rejeitada no filtro principal

// Analista Jr (6k-10k) → Gerente (25k-40k)
// Sobreposição: Nenhuma ❌ (gap de 15k)
// Resultado: Conexão rejeitada no filtro principal
```

---

## 🎨 Interface do Usuário

### 📱 Layout Principal

#### Header
- **Título**: "Mapa de Carreiras"
- **Estatísticas**: Total de posições, nós visíveis, oportunidades de progressão
- **Indicadores**: Nível máximo atingido, histórico de posições

#### Sistema de Busca
- **Input**: Busca por cargo, descrição, área, nível ou salário
- **Botões**: "Mostrar Válidos", "Resetar"
- **Resultados**: Grid responsivo com compatibility score

#### Visualização SVG
- **Dimensões**: 1000x700px
- **Funcionalidades**: Zoom (0.3x - 3x), Pan, Controles centralizados
- **Background**: Gradiente linear
- **Nó Central**: Posição atual (160x80px, borda dourada)
- **Nós Conectados**: Oportunidades (140x70px)

#### Painel de Detalhes
- **Lado Esquerdo**: Informações da posição (título, nível, salário, descrição, requisitos)
- **Lado Direito**: Lista de oportunidades de progressão com scores

#### Histórico de Carreira
- **Chips**: Posições visitadas anteriormente
- **Cores**: Por área profissional
- **Interação**: Clique para revisitar

#### Legenda (Acordeão)
- **Tipos de Conexão**: Linhas sólidas (mesma área) vs tracejadas (mudança de área)
- **Indicadores Visuais**: Posição atual, histórico, espessura por compatibilidade
- **Cores por Área**: Mapeamento visual das 6 áreas profissionais

---

## 🎨 Design System

### 🌈 Paleta de Cores

#### Áreas Profissionais
```scss
$colors: (
  'tecnologia': #1E40AF,      // Azul escuro
  'produto': #7C3AED,         // Roxo
  'dados': #DC2626,           // Vermelho
  'gestao': #059669,          // Verde
  'financeiro': #D97706,      // Laranja
  'recursos-humanos': #BE185D // Rosa
);
```

#### Estados de Compatibilidade
```scss
$compatibility: (
  'alta': #10B981,      // Verde (≥70%)
  'media': #F59E0B,     // Amarelo (50-69%)
  'baixa': #EF4444      // Vermelho (17-49%)
);
```

#### UI Elements
```scss
$ui: (
  'primary': #3B82F6,    // Azul primário
  'secondary': #6B7280,  // Cinza
  'success': #10B981,    // Verde
  'warning': #F59E0B,    // Amarelo
  'danger': #EF4444,     // Vermelho
  'current': #FBBF24     // Dourado (posição atual)
);
```

### 📐 Layout e Espaçamento
- **Container**: max-width: 7xl (1280px)
- **Padding**: px-6 (24px horizontal)
- **Gap**: space-y-8 (32px vertical)
- **Border Radius**: rounded-xl (12px)
- **Shadows**: shadow-lg

---

## 🚀 Setup do Projeto Angular

### 📦 Dependências Necessárias

```bash
# Criar projeto
ng new mapa-carreira-angular --routing --style=scss

# Dependências principais
npm install d3 @types/d3
npm install lucide-angular

# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer; npx tailwindcss init

# Angular Material (opcional)
ng add @angular/material
```

### 🗂️ Estrutura de Pastas

```
src/
├── app/
│   ├── core/
│   │   ├── models/
│   │   │   ├── position.interface.ts
│   │   │   ├── connection.interface.ts
│   │   │   └── node.interface.ts
│   │   └── services/
│   │       ├── career-calculator.service.ts
│   │       ├── position-data.service.ts
│   │       └── d3-visualization.service.ts
│   ├── features/
│   │   └── career-map/
│   │       ├── components/
│   │       │   ├── career-map/
│   │       │   ├── search-panel/
│   │       │   ├── position-details/
│   │       │   ├── career-history/
│   │       │   └── legend-panel/
│   │       └── career-map.module.ts
│   ├── shared/
│   │   ├── components/
│   │   └── utils/
│   └── data/
│       └── positions.ts
```

---

## 🧩 Componentes Angular

### 1. **CareerMapComponent** (Principal)
```typescript
@Component({
  selector: 'app-career-map',
  templateUrl: './career-map.component.html',
  styleUrls: ['./career-map.component.scss']
})
export class CareerMapComponent implements OnInit, OnDestroy {
  @ViewChild('svgContainer', { static: true }) svgContainer!: ElementRef<SVGElement>;
  
  // Signals (Angular 17+)
  selectedPositionId = signal<string>('dev-net');
  visibleNodes = signal<string[]>(['dev-net']);
  searchTerm = signal<string>('');
  visitedPositions = signal<string[]>(['dev-net']);
  isLegendOpen = signal<boolean>(false);
  
  // Computed
  selectedPosition = computed(() => 
    this.positionService.getPosition(this.selectedPositionId())
  );
  
  smartConnections = computed(() => 
    this.careerCalculator.getSmartConnections(this.selectedPositionId())
  );
  
  constructor(
    private positionService: PositionDataService,
    private careerCalculator: CareerCalculatorService,
    private d3Service: D3VisualizationService
  ) {}
  
  ngOnInit() {
    this.setupD3Visualization();
  }
  
  private setupD3Visualization() {
    // Configurar efeito reativo para re-renderizar quando dados mudarem
    effect(() => {
      this.d3Service.renderVisualization(
        this.svgContainer.nativeElement,
        this.visibleNodes(),
        this.selectedPositionId(),
        this.smartConnections()
      );
    });
  }
}
```

### 2. **SearchPanelComponent**
```typescript
@Component({
  selector: 'app-search-panel',
  template: `
    <div class="flex flex-col lg:flex-row gap-4">
      <div class="relative flex-1">
        <lucide-icon name="search" class="absolute left-3 top-3 h-4 w-4 text-gray-400"></lucide-icon>
        <input
          type="text"
          placeholder="Buscar por cargo, descrição, área ou nível..."
          [ngModel]="searchTerm()"
          (ngModelChange)="onSearchChange($event)"
          class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div class="flex gap-2">
        <button 
          (click)="showAll.emit()"
          class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
          👁️ Mostrar Válidos
        </button>
        <button 
          (click)="reset.emit()"
          class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
          ↻ Resetar
        </button>
      </div>
    </div>
    
    <!-- Search Results -->
    <div *ngIf="searchResults().length > 0" 
         class="mt-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
      <!-- Results grid -->
    </div>
  `
})
export class SearchPanelComponent {
  @Input() searchTerm = input.required<string>();
  @Output() searchTermChange = output<string>();
  @Output() showAll = output<void>();
  @Output() reset = output<void>();
  @Output() positionSelected = output<string>();
  
  searchResults = computed(() => 
    this.positionService.searchPositions(this.searchTerm())
  );
}
```

### 3. **PositionDetailsComponent**
```typescript
@Component({
  selector: 'app-position-details',
  template: `
    <div class="bg-white rounded-xl shadow-lg border">
      <div class="p-4 bg-gradient-to-r from-gray-800 to-gray-700 text-white rounded-t-xl">
        <h2 class="text-lg font-semibold flex items-center">
          <lucide-icon name="info" class="w-5 h-5 mr-2"></lucide-icon>
          Detalhes da Posição
        </h2>
      </div>
      
      <div class="p-6" *ngIf="position()">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Position Info -->
          <div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">{{position()?.title}}</h3>
            <!-- Details -->
          </div>
          
          <!-- Opportunities -->
          <div>
            <h4 class="font-semibold text-gray-900 mb-2">Oportunidades de Progressão</h4>
            
            <!-- Max Level Message -->
            <div *ngIf="connections().length === 0"
                 class="mb-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg">
              <!-- Crown message -->
            </div>
            
            <!-- Connections List -->
            <div class="space-y-2 max-h-80 overflow-y-auto">
              <div *ngFor="let connection of connections()" 
                   [class]="getConnectionClasses(connection)"
                   (click)="connectionSelected.emit(connection.id)">
                <!-- Connection details -->
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PositionDetailsComponent {
  @Input() position = input<Position | null>();
  @Input() connections = input<Connection[]>([]);
  @Input() visibleNodes = input<string[]>([]);
  @Output() connectionSelected = output<string>();
}
```

### 4. **CareerHistoryComponent**
```typescript
@Component({
  selector: 'app-career-history',
  template: `
    <div *ngIf="visitedPositions().length > 1" class="w-full">
      <div class="bg-white rounded-xl shadow-lg border overflow-hidden">
        <div class="p-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white">
          <h2 class="text-lg font-semibold flex items-center">
            <lucide-icon name="clock" class="w-5 h-5 mr-2"></lucide-icon>
            Histórico de Carreira
          </h2>
          <p class="text-gray-200 text-sm">Posições visitadas anteriormente</p>
        </div>
        <div class="p-4">
          <div class="flex flex-wrap gap-2">
            <div *ngFor="let positionId of getHistoryPositions()" 
                 [style.background-color]="getAreaColor(positionId)"
                 (click)="positionSelected.emit(positionId)"
                 class="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer">
              <!-- History chip content -->
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CareerHistoryComponent {
  @Input() visitedPositions = input<string[]>([]);
  @Output() positionSelected = output<string>();
}
```

### 5. **LegendPanelComponent**
```typescript
@Component({
  selector: 'app-legend-panel',
  template: `
    <div *ngIf="visibleNodes().length > 1" 
         class="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
      <div class="max-w-7xl mx-auto px-6">
        <button
          (click)="toggleLegend()"
          class="w-full py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors">
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
            <span class="font-medium text-gray-900">Legenda das Conexões</span>
            <span class="text-sm text-gray-500">
              ({{connectionsCount()}} conexões ativas)
            </span>
          </div>
          <div [class]="'transform transition-transform ' + (isOpen() ? 'rotate-180' : '')">
            ↓
          </div>
        </button>
        
        <div *ngIf="isOpen()" class="pb-4 border-t border-gray-100">
          <!-- Legend content -->
        </div>
      </div>
    </div>
  `
})
export class LegendPanelComponent {
  @Input() visibleNodes = input<string[]>([]);
  @Input() connectionsCount = input<number>(0);
  @Input() isOpen = input<boolean>(false);
  @Output() isOpenChange = output<boolean>();
}
```

---

## 🔧 Services Angular

### 1. **PositionDataService**
```typescript
@Injectable({
  providedIn: 'root'
})
export class PositionDataService {
  private readonly positions = signal<Record<string, Position>>(POSITIONS_DATA);
  
  getPosition(id: string): Position | null {
    return this.positions()[id] || null;
  }
  
  getAllPositions(): Position[] {
    return Object.values(this.positions());
  }
  
  searchPositions(term: string): Position[] {
    if (!term.trim()) return [];
    
    const searchTerm = term.toLowerCase();
    return this.getAllPositions().filter(position =>
      position.title.toLowerCase().includes(searchTerm) ||
      position.description.toLowerCase().includes(searchTerm) ||
      position.pillar.toLowerCase().includes(searchTerm) ||
      position.level.toLowerCase().includes(searchTerm) ||
      position.salary.toLowerCase().includes(searchTerm)
    );
  }
}
```

### 2. **CareerCalculatorService**
```typescript
@Injectable({
  providedIn: 'root'
})
export class CareerCalculatorService {
  
  constructor(private positionService: PositionDataService) {}
  
  getSmartConnections(positionId: string): Connection[] {
    const currentPos = this.positionService.getPosition(positionId);
    if (!currentPos) return [];
    
    const connections: Connection[] = [];
    const allPositions = this.positionService.getAllPositions();
    
    // Implementar algoritmo de compatibilidade
    allPositions.forEach(targetPos => {
      if (targetPos.id === positionId) return;
      
      const connection = this.calculateCompatibility(currentPos, targetPos);
      if (connection && connection.score >= 17) {
        connections.push(connection);
      }
    });
    
    return connections
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  }
  
  private calculateCompatibility(current: Position, target: Position): Connection | null {
    const currentSalaryMin = current.salaryMin || 0;
    const currentSalaryMax = current.salaryMax || 0;
    const currentSalaryAvg = (currentSalaryMin + currentSalaryMax) / 2;
    
    const targetSalaryMin = target.salaryMin || 0;
    const targetSalaryMax = target.salaryMax || 0;
    const targetSalaryAvg = (targetSalaryMin + targetSalaryMax) / 2;

    // FILTRO: Verificar sobreposição de faixas salariais
    const hasRangeOverlap = currentSalaryMax >= targetSalaryMin && 
                           currentSalaryMin <= targetSalaryMax;
    
    if (!hasRangeOverlap) {
      return null; // Sem sobreposição = sem conexão
    }

    let score = 0;
    let reasons: string[] = [];

    // Score salarial (0-40 pontos)
    const salaryIncrease = targetSalaryAvg - currentSalaryAvg;
    if (salaryIncrease > 0) {
      const progressionPercentage = salaryIncrease / currentSalaryAvg;
      score += Math.min(40, progressionPercentage * 40);
      
      if (progressionPercentage > 0.5) {
        reasons.push('Grande progressão salarial');
      } else if (progressionPercentage > 0.2) {
        reasons.push('Boa progressão salarial');
      } else {
        reasons.push('Progressão salarial moderada');
      }
    } else {
      score += 25;
      reasons.push('Faixa salarial compatível');
    }

    // Score por área (0-30 pontos)
    if (current.pillar === target.pillar) {
      score += 30;
      reasons.push('Mesma área');
    } else {
      // Lógica de áreas relacionadas...
      score += 18; // ou 5 para áreas não relacionadas
      reasons.push('Área relacionada'); // ou 'Nova área'
    }

    // Score hierárquico (0-25 pontos)
    const levelDiff = this.getLevelDifference(current.level, target.level);
    if (levelDiff === 0) {
      score += 20;
      reasons.push('Mesmo nível');
    } else if (levelDiff === 1) {
      score += 25;
      reasons.push('Progressão natural');
    } else if (levelDiff === 2) {
      score += 15;
      reasons.push('Grande crescimento');
    }

    // Filtro final: score mínimo 20
    if (score >= 20) {
      return {
        id: target.id,
        position: target,
        score: Math.min(100, Math.round(score)),
        reasons: reasons,
        salaryDifference: Math.round(targetSalaryAvg - currentSalaryAvg),
        transitionType: current.pillar === target.pillar ? 'internal' : 'cross-functional'
      };
    }

    return null;
  }
}
```

### 3. **D3VisualizationService**
```typescript
@Injectable({
  providedIn: 'root'
})
export class D3VisualizationService {
  
  renderVisualization(
    container: SVGElement,
    visibleNodes: string[],
    selectedPositionId: string,
    connections: Connection[]
  ): void {
    const svg = d3.select(container);
    svg.selectAll("*").remove();
    
    // Implementar lógica de renderização D3.js
    this.setupZoom(svg);
    this.createNodes(svg, visibleNodes, selectedPositionId);
    this.createLinks(svg, connections);
    this.addControls(svg);
  }
  
  private setupZoom(svg: d3.Selection<SVGElement, unknown, null, undefined>): void {
    // Configurar zoom e pan
  }
  
  private createNodes(svg: any, visibleNodes: string[], selectedPositionId: string): void {
    // Criar nós do mapa mental
  }
  
  private createLinks(svg: any, connections: Connection[]): void {
    // Criar conexões entre nós
  }
  
  private addControls(svg: any): void {
    // Adicionar controles de zoom
  }
}
```

---

## 📋 Funcionalidades Detalhadas

### 🔍 Sistema de Busca
- **Input reativo** com debounce (300ms)
- **Filtros múltiplos**: título, descrição, área, nível, salário
- **Ordenação**: Por compatibilidade (se disponível) → alfabética
- **Seleção**: Adiciona à visualização se válido

### 🎮 Interações SVG
- **Zoom**: Scroll do mouse (0.3x - 3x)
- **Pan**: Arrastar com mouse
- **Hover**: Destaque de conexões relacionadas
- **Click**: Seleção de nova posição central
- **Controles**: Botões +, -, ⌂ (reset)

### 📊 Layout Inteligente
- **Nó Central**: Posição atual (centro do SVG)
- **Distribuição Angular**: Por área profissional (6 setores)
- **Raios Dinâmicos**: Baseado em tipo de transição e score
- **Anti-colisão**: Algoritmo iterativo (150 iterações)
- **Limites**: Margens para manter dentro do viewport

### 🏆 Sistema de Níveis
- **Detecção Automática**: Sem conexões válidas = nível máximo
- **Feedback Visual**: Coroa dourada + mensagem
- **Algoritmo**: Score mínimo 17 + sem regressão salarial

---

## 📱 Responsividade

### 🖥️ Desktop (≥1024px)
- Grid 2 colunas no painel de detalhes
- SVG completo (1000x700)
- Legenda em 3 colunas

### 📱 Tablet (768px - 1023px)
- Grid 1 coluna no painel de detalhes
- SVG adaptativo
- Legenda em 2 colunas

### 📱 Mobile (≤767px)
- Layout vertical
- SVG responsivo
- Legenda em 1 coluna
- Menu hambúrguer para controles

---

## 🧪 Testes

### Unit Tests
```typescript
// CareerCalculatorService
describe('CareerCalculatorService', () => {
  it('should calculate compatibility correctly', () => {
    // Test compatibility algorithm
  });
  
  it('should filter by minimum score', () => {
    // Test 17% minimum threshold
  });
  
  it('should sort by score descending', () => {
    // Test sorting logic
  });
});

// PositionDataService
describe('PositionDataService', () => {
  it('should search positions by multiple criteria', () => {
    // Test search functionality
  });
});
```

### Integration Tests
```typescript
// CareerMapComponent
describe('CareerMapComponent', () => {
  it('should render SVG visualization', () => {
    // Test D3 rendering
  });
  
  it('should handle position selection', () => {
    // Test interaction flow
  });
  
  it('should update visible nodes', () => {
    // Test state management
  });
});
```

### E2E Tests
```typescript
// Career exploration flow
describe('Career Map E2E', () => {
  it('should allow full career exploration', () => {
    // Test complete user journey
  });
});
```

---

## 🚀 Deployment

### Build de Produção
```bash
ng build --configuration production
```

### Otimizações
- **Lazy Loading**: Módulos por funcionalidade
- **Tree Shaking**: Remoção de código não utilizado
- **Code Splitting**: Chunks separados para D3.js
- **Service Worker**: Cache para melhor performance
- **Compression**: Gzip/Brotli no servidor

### Environment Variables
```typescript
// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.mapadecarreiras.com',
  analytics: {
    enabled: true,
    trackingId: 'GA_TRACKING_ID'
  }
};
```

---

## 📚 Documentação Adicional

### 🎨 Guia de Estilo
- Seguir Angular Style Guide
- Usar Prettier para formatação
- ESLint para qualidade de código
- Naming conventions consistentes

### 📖 README do Projeto
```markdown
# Mapa de Carreiras Angular

## Desenvolvimento
npm install
ng serve

## Build
ng build

## Testes
ng test
ng e2e
```

### 🔧 Configurações

#### angular.json
```json
{
  "projects": {
    "mapa-carreira": {
      "architect": {
        "build": {
          "options": {
            "styles": [
              "src/styles.scss"
            ],
            "scripts": []
          }
        }
      }
    }
  }
}
```

#### tailwind.config.js
```javascript
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'tecnologia': '#1E40AF',
        'produto': '#7C3AED',
        'dados': '#DC2626',
        'gestao': '#059669',
        'financeiro': '#D97706',
        'recursos-humanos': '#BE185D'
      }
    },
  },
  plugins: [],
}
```

---

## ✅ Checklist de Migração

### Setup Inicial
- [ ] Criar projeto Angular com routing e SCSS
- [ ] Instalar dependências (D3.js, Lucide, Tailwind)
- [ ] Configurar Tailwind CSS
- [ ] Criar estrutura de pastas

### Interfaces e Models
- [ ] Position interface
- [ ] Connection interface  
- [ ] Node interface
- [ ] Enums para áreas e níveis

### Services
- [ ] PositionDataService
- [ ] CareerCalculatorService
- [ ] D3VisualizationService

### Componentes
- [ ] CareerMapComponent (principal)
- [ ] SearchPanelComponent
- [ ] PositionDetailsComponent
- [ ] CareerHistoryComponent
- [ ] LegendPanelComponent

### Funcionalidades
- [ ] Algoritmo de compatibilidade
- [ ] Visualização D3.js
- [ ] Sistema de busca
- [ ] Histórico de navegação
- [ ] Responsividade

### Testes
- [ ] Unit tests para services
- [ ] Component tests
- [ ] E2E tests

### Deploy
- [ ] Build de produção
- [ ] Configuração de servidor
- [ ] Analytics (opcional)

---

## 🎯 Próximos Passos

1. **Implementar MVP** com funcionalidades básicas
2. **Adicionar testes** conforme desenvolvimento
3. **Otimizar performance** D3.js
4. **Implementar PWA** para uso offline
5. **Adicionar analytics** para métricas de uso
6. **Criar dashboard admin** para gestão de posições

## 🚀 Plano de Migração para Angular

### 📦 Setup Inicial do Projeto

```bash
# 1. Criar projeto Angular com routing e SCSS
ng new mapa-carreira-angular --routing --style=scss

# 2. Instalar dependências principais
npm install d3 @types/d3
npm install lucide-angular

# 3. Configurar Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init

# 4. Angular Material (opcional para componentes extras)
ng add @angular/material
```

### 🗂️ Estrutura de Pastas Angular

```
src/
├── app/
│   ├── core/
│   │   ├── models/
│   │   │   ├── position.interface.ts
│   │   │   ├── connection.interface.ts
│   │   │   └── node.interface.ts
│   │   └── services/
│   │       ├── career-calculator.service.ts
│   │       ├── position-data.service.ts
│   │       └── d3-visualization.service.ts
│   ├── features/
│   │   └── career-map/
│   │       ├── components/
│   │       │   ├── career-map/
│   │       │   ├── search-panel/
│   │       │   ├── position-details/
│   │       │   ├── career-history/
│   │       │   └── legend-panel/
│   │       └── career-map.module.ts
│   ├── shared/
│   │   └── components/
│   └── data/
│       └── positions.ts
```

### 🧩 Interfaces e Models

#### Position Interface
```typescript
export interface Position {
  id: string;
  title: string;
  description: string;
  pillar: 'Tecnologia' | 'Produto' | 'Dados' | 'Gestão' | 'Financeiro' | 'Recursos Humanos';
  level: 'Júnior' | 'Pleno' | 'Sênior' | 'Especialista' | 'Coordenador' | 'Gerente' | 'Diretor' | 'VP' | 'C-Level';
  salary: string; // "R$ 5.000 - 8.000"
  salaryMin: number;
  salaryMax: number;
  requirements?: string[];
}
```

#### Connection Interface
```typescript
export interface Connection {
  id: string;
  position: Position;
  score: number; // 0-100
  reasons: string[];
  salaryDifference: number;
  transitionType: 'internal' | 'cross-functional';
}
```

#### Node Interface (D3.js)
```typescript
export interface Node extends Position {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

---

## 🔧 Services Angular

### 1. **PositionDataService**

```typescript
import { Injectable, signal } from '@angular/core';
import { Position } from '../models/position.interface';
import { POSITIONS_DATA } from '../../data/positions';

@Injectable({
  providedIn: 'root'
})
export class PositionDataService {
  private readonly positions = signal<Record<string, Position>>(POSITIONS_DATA);
  
  getPosition(id: string): Position | null {
    return this.positions()[id] || null;
  }
  
  getAllPositions(): Position[] {
    return Object.values(this.positions());
  }
  
  searchPositions(term: string): Position[] {
    if (!term.trim()) return [];
    
    const searchTerm = term.toLowerCase();
    return this.getAllPositions().filter(position =>
      position.title.toLowerCase().includes(searchTerm) ||
      position.description.toLowerCase().includes(searchTerm) ||
      position.pillar.toLowerCase().includes(searchTerm) ||
      position.level.toLowerCase().includes(searchTerm) ||
      position.salary.toLowerCase().includes(searchTerm)
    );
  }
  
  getPositionsByArea(pillar: string): Position[] {
    return this.getAllPositions().filter(pos => pos.pillar === pillar);
  }
}
```

### 2. **CareerCalculatorService**

```typescript
import { Injectable } from '@angular/core';
import { Position, Connection } from '../models';
import { PositionDataService } from './position-data.service';

@Injectable({
  providedIn: 'root'
})
export class CareerCalculatorService {
  
  constructor(private positionService: PositionDataService) {}
  
  getSmartConnections(positionId: string): Connection[] {
    const currentPos = this.positionService.getPosition(positionId);
    if (!currentPos) return [];
    
    const connections: Connection[] = [];
    const allPositions = this.positionService.getAllPositions();
    
    // Implementar algoritmo de compatibilidade
    allPositions.forEach(targetPos => {
      if (targetPos.id === positionId) return;
      
      const connection = this.calculateCompatibility(currentPos, targetPos);
      if (connection && connection.score >= 20) {
        connections.push(connection);
      }
    });
    
    return connections
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  }
  
  private calculateCompatibility(current: Position, target: Position): Connection | null {
    const currentSalaryMin = current.salaryMin || 0;
    const currentSalaryMax = current.salaryMax || 0;
    const currentSalaryAvg = (currentSalaryMin + currentSalaryMax) / 2;
    
    const targetSalaryMin = target.salaryMin || 0;
    const targetSalaryMax = target.salaryMax || 0;
    const targetSalaryAvg = (targetSalaryMin + targetSalaryMax) / 2;

    // FILTRO PRINCIPAL: Verificar sobreposição de faixas salariais
    const hasRangeOverlap = currentSalaryMax >= targetSalaryMin && 
                           currentSalaryMin <= targetSalaryMax;
    
    if (!hasRangeOverlap) {
      return null; // Sem sobreposição = sem conexão
    }

    let score = 0;
    const reasons: string[] = [];

    // 1. Score salarial (0-40 pontos)
    const salaryIncrease = targetSalaryAvg - currentSalaryAvg;
    if (salaryIncrease > 0) {
      const progressionPercentage = salaryIncrease / currentSalaryAvg;
      score += Math.min(40, progressionPercentage * 40);
      
      if (progressionPercentage > 0.5) {
        reasons.push('Grande progressão salarial');
      } else if (progressionPercentage > 0.2) {
        reasons.push('Boa progressão salarial');
      } else {
        reasons.push('Progressão salarial moderada');
      }
    } else {
      score += 25;
      reasons.push('Faixa salarial compatível');
    }

    // 2. Score por área (5-30 pontos)
    if (current.pillar === target.pillar) {
      score += 30;
      reasons.push('Mesma área');
    } else {
      const relatedAreas = {
        'Tecnologia': ['Dados', 'Produto'],
        'Gestão': ['Financeiro', 'Recursos Humanos'],
        'Financeiro': ['Gestão', 'Dados'],
        'Dados': ['Tecnologia', 'Financeiro'],
        'Produto': ['Tecnologia', 'Dados'],
        'Recursos Humanos': ['Gestão']
      };
      
      if (relatedAreas[current.pillar as keyof typeof relatedAreas]?.includes(target.pillar)) {
        score += 18;
        reasons.push('Área relacionada');
      } else {
        score += 5;
        reasons.push('Nova área');
      }
    }

    // 3. Score hierárquico (0-25 pontos)
    const levelDiff = this.getLevelDifference(current.level, target.level);
    if (levelDiff === 0) {
      score += 20;
      reasons.push('Mesmo nível');
    } else if (levelDiff === 1) {
      score += 25;
      reasons.push('Progressão natural');
    } else if (levelDiff === 2) {
      score += 15;
      reasons.push('Grande crescimento');
    }

    // Filtro final: score mínimo 20
    if (score >= 20) {
      return {
        id: target.id,
        position: target,
        score: Math.min(100, Math.round(score)),
        reasons: reasons,
        salaryDifference: Math.round(targetSalaryAvg - currentSalaryAvg),
        transitionType: current.pillar === target.pillar ? 'internal' : 'cross-functional'
      };
    }

    return null;
  }
  
  private getLevelDifference(currentLevel: string, targetLevel: string): number {
    const levelScore = {
      'Júnior': 1, 'Pleno': 2, 'Sênior': 3, 'Especialista': 3,
      'Coordenador': 4, 'Gerente': 5, 'Diretor': 6, 'VP': 7, 'C-Level': 8
    };
    
    const current = levelScore[currentLevel as keyof typeof levelScore] || 2;
    const target = levelScore[targetLevel as keyof typeof levelScore] || 2;
    
    return target - current;
  }
  
  isCareerCeiling(positionId: string): boolean {
    const currentPos = this.positionService.getPosition(positionId);
    if (!currentPos) return false;
    
    const sameAreaPositions = this.positionService.getPositionsByArea(currentPos.pillar)
      .filter(pos => pos.id !== positionId);
    
    return sameAreaPositions.every(pos => {
      const otherSalaryMax = pos.salaryMax || 0;
      return (currentPos.salaryMin || 0) >= otherSalaryMax;
    });
  }
}
```

### 3. **D3VisualizationService**

```typescript
import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import { Position, Connection, Node } from '../models';

@Injectable({
  providedIn: 'root'
})
export class D3VisualizationService {
  
  renderVisualization(
    container: SVGElement,
    visibleNodes: string[],
    selectedPositionId: string,
    connections: Connection[],
    positions: Record<string, Position>
  ): void {
    const svg = d3.select(container);
    svg.selectAll("*").remove();
    
    const width = 1000;
    const height = 700;
    
    // Configurar zoom e pan
    const zoom = d3.zoom<SVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        mainContainer.attr("transform", event.transform);
      });
    
    svg.call(zoom);
    
    const mainContainer = svg.append("g").attr("class", "zoom-container");
    
    // Criar nós com layout inteligente
    const nodes = this.createNodes(visibleNodes, selectedPositionId, connections, positions, width, height);
    
    // Resolver colisões
    const adjustedNodes = this.resolveCollisions(nodes, width, height);
    
    // Renderizar links
    this.renderLinks(mainContainer, adjustedNodes, selectedPositionId, connections);
    
    // Renderizar nós
    this.renderNodes(mainContainer, adjustedNodes, selectedPositionId, (nodeId: string) => {
      // Callback para clique em nós - emitir evento
    });
    
    // Adicionar controles de zoom
    this.addZoomControls(svg, zoom, width, height);
  }
  
  private createNodes(
    visibleNodes: string[],
    selectedPositionId: string,
    connections: Connection[],
    positions: Record<string, Position>,
    width: number,
    height: number
  ): Node[] {
    // Implementar lógica de posicionamento dos nós
    // Baseado no código React original
    return visibleNodes.map((nodeId, index) => {
      const position = positions[nodeId];
      if (!position) return null;
      
      let x, y;
      
      if (nodeId === selectedPositionId) {
        // Nó central
        x = (width - 160) / 2;
        y = (height - 80) / 2;
      } else {
        // Lógica de posicionamento por área profissional
        x = width / 2 + 200 * Math.cos(index * 2 * Math.PI / visibleNodes.length);
        y = height / 2 + 200 * Math.sin(index * 2 * Math.PI / visibleNodes.length);
      }
      
      return {
        ...position,
        x: Math.max(10, Math.min(width - 150, x)),
        y: Math.max(10, Math.min(height - 80, y)),
        width: nodeId === selectedPositionId ? 160 : 140,
        height: nodeId === selectedPositionId ? 80 : 70
      };
    }).filter(Boolean) as Node[];
  }
  
  private resolveCollisions(nodes: Node[], width: number, height: number): Node[] {
    // Implementar algoritmo anti-colisão (100 iterações)
    const maxIterations = 100;
    
    for (let i = 0; i < maxIterations; i++) {
      let hasCollision = false;
      
      for (let j = 0; j < nodes.length; j++) {
        for (let k = j + 1; k < nodes.length; k++) {
          if (this.detectCollision(nodes[j], nodes[k])) {
            hasCollision = true;
            this.resolveNodeCollision(nodes[j], nodes[k]);
          }
        }
      }
      
      if (!hasCollision) break;
    }
    
    return nodes;
  }
  
  private detectCollision(node1: Node, node2: Node): boolean {
    const margin = 25;
    return (
      node1.x < node2.x + node2.width + margin &&
      node1.x + node1.width + margin > node2.x &&
      node1.y < node2.y + node2.height + margin &&
      node1.y + node1.height + margin > node2.y
    );
  }
  
  private resolveNodeCollision(node1: Node, node2: Node): void {
    // Implementar lógica de resolução de colisão
    const centerX = (node1.x + node2.x + node1.width + node2.width) / 2;
    const centerY = (node1.y + node2.y + node1.height + node2.height) / 2;
    
    const angle1 = Math.atan2(node1.y + node1.height/2 - centerY, node1.x + node1.width/2 - centerX);
    const angle2 = Math.atan2(node2.y + node2.height/2 - centerY, node2.x + node2.width/2 - centerX);
    
    const pushDistance = 60;
    node1.x += pushDistance * Math.cos(angle1);
    node1.y += pushDistance * Math.sin(angle1);
    node2.x += pushDistance * Math.cos(angle2);
    node2.y += pushDistance * Math.sin(angle2);
  }
  
  private renderLinks(
    container: d3.Selection<SVGGElement, unknown, null, undefined>,
    nodes: Node[],
    selectedPositionId: string,
    connections: Connection[]
  ): void {
    // Implementar renderização de links/conexões
    const centralNode = nodes.find(n => n.id === selectedPositionId);
    if (!centralNode) return;
    
    const links = connections
      .map(conn => {
        const targetNode = nodes.find(n => n.id === conn.id);
        return targetNode ? { source: centralNode, target: targetNode, connection: conn } : null;
      })
      .filter(Boolean);
    
    container.selectAll(".link")
      .data(links)
      .enter()
      .append("line")
      .attr("class", "link")
      .attr("x1", d => d!.source.x + d!.source.width / 2)
      .attr("y1", d => d!.source.y + d!.source.height / 2)
      .attr("x2", d => d!.target.x + d!.target.width / 2)
      .attr("y2", d => d!.target.y + d!.target.height / 2)
      .attr("stroke", d => d!.connection.transitionType === 'internal' ? '#60A5FA' : '#A78BFA')
      .attr("stroke-width", d => Math.max(2, (d!.connection.score / 100) * 5))
      .attr("opacity", 0.8);
  }
  
  private renderNodes(
    container: d3.Selection<SVGGElement, unknown, null, undefined>,
    nodes: Node[],
    selectedPositionId: string,
    onNodeClick: (nodeId: string) => void
  ): void {
    // Implementar renderização de nós
    const colorMap = {
      'Tecnologia': '#1E40AF',
      'Produto': '#7C3AED',
      'Dados': '#DC2626',
      'Gestão': '#059669',
      'Financeiro': '#D97706',
      'Recursos Humanos': '#BE185D'
    };
    
    const nodeGroups = container.selectAll(".node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.x},${d.y})`)
      .on("click", (event, d) => onNodeClick(d.id));
    
    // Retângulos
    nodeGroups.append("rect")
      .attr("width", d => d.width)
      .attr("height", d => d.height)
      .attr("rx", 10)
      .attr("fill", d => colorMap[d.pillar] || '#6B7280')
      .attr("stroke", d => d.id === selectedPositionId ? "#FBBF24" : "#E5E7EB")
      .attr("stroke-width", d => d.id === selectedPositionId ? 3 : 1.5);
    
    // Texto
    nodeGroups.append("text")
      .attr("x", d => d.width / 2)
      .attr("y", d => d.height / 2)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", "white")
      .style("font-size", "11px")
      .style("font-weight", "600")
      .text(d => d.title.length > 20 ? d.title.substring(0, 18) + "..." : d.title);
  }
  
  private addZoomControls(
    svg: d3.Selection<SVGElement, unknown, null, undefined>,
    zoom: d3.ZoomBehavior<SVGElement, unknown>,
    width: number,
    height: number
  ): void {
    // Implementar controles de zoom (+, -, ⌂)
    const controlsWidth = 125;
    const controlsHeight = 35;
    
    const controls = svg.append("g")
      .attr("class", "zoom-controls")
      .attr("transform", `translate(${(width - controlsWidth) / 2}, ${height - controlsHeight - 10})`);
    
    // Fundo dos controles
    controls.append("rect")
      .attr("width", controlsWidth)
      .attr("height", controlsHeight)
      .attr("rx", 8)
      .attr("fill", "rgba(255, 255, 255, 0.9)")
      .attr("stroke", "#e5e7eb");
    
    // Botão zoom out
    this.createZoomButton(controls, 0, "−", () => {
      svg.transition().duration(300).call(zoom.scaleBy, 0.67);
    });
    
    // Botão reset
    this.createZoomButton(controls, 45, "⌂", () => {
      svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
    });
    
    // Botão zoom in
    this.createZoomButton(controls, 90, "+", () => {
      svg.transition().duration(300).call(zoom.scaleBy, 1.5);
    });
  }
  
  private createZoomButton(
    container: d3.Selection<SVGGElement, unknown, null, undefined>,
    x: number,
    text: string,
    onClick: () => void
  ): void {
    const button = container.append("g")
      .attr("transform", `translate(${x}, 0)`)
      .style("cursor", "pointer")
      .on("click", onClick);
    
    button.append("rect")
      .attr("width", 35)
      .attr("height", 35)
      .attr("rx", 5)
      .attr("fill", "white")
      .attr("stroke", "#d1d5db");
    
    button.append("text")
      .attr("x", 17.5)
      .attr("y", 22)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", "#374151")
      .style("font-size", text === "⌂" ? "14px" : "18px")
      .style("font-weight", "bold")
      .text(text);
  }
}
```

---

## 🧩 Componentes Angular

### 1. **CareerMapComponent** (Principal)

```typescript
import { Component, OnInit, ViewChild, ElementRef, signal, computed, effect } from '@angular/core';
import { PositionDataService } from '../../core/services/position-data.service';
import { CareerCalculatorService } from '../../core/services/career-calculator.service';
import { D3VisualizationService } from '../../core/services/d3-visualization.service';

@Component({
  selector: 'app-career-map',
  templateUrl: './career-map.component.html',
  styleUrls: ['./career-map.component.scss']
})
export class CareerMapComponent implements OnInit {
  @ViewChild('svgContainer', { static: true }) 
  svgContainer!: ElementRef<SVGElement>;
  
  // Signals (Angular 17+)
  selectedPositionId = signal<string>('dev-net');
  visibleNodes = signal<string[]>(['dev-net']);
  searchTerm = signal<string>('');
  searchResults = signal<any[]>([]);
  showSearch = signal<boolean>(false);
  visitedPositions = signal<string[]>(['dev-net']);
  isLegendOpen = signal<boolean>(false);
  
  // Computed signals
  selectedPosition = computed(() => 
    this.positionService.getPosition(this.selectedPositionId())
  );
  
  smartConnections = computed(() => 
    this.careerCalculator.getSmartConnections(this.selectedPositionId())
  );
  
  allPositions = computed(() => 
    this.positionService.getAllPositions()
  );
  
  isCareerCeiling = computed(() =>
    this.careerCalculator.isCareerCeiling(this.selectedPositionId())
  );
  
  isAbsoluteMaximum = computed(() =>
    this.smartConnections().length === 0
  );
  
  constructor(
    private positionService: PositionDataService,
    private careerCalculator: CareerCalculatorService,
    private d3Service: D3VisualizationService
  ) {
    // Effect para re-renderizar D3 quando dados mudarem
    effect(() => {
      this.d3Service.renderVisualization(
        this.svgContainer.nativeElement,
        this.visibleNodes(),
        this.selectedPositionId(),
        this.smartConnections(),
        this.positionService.getAllPositions().reduce((acc, pos) => {
          acc[pos.id] = pos;
          return acc;
        }, {} as Record<string, any>)
      );
    });
  }
  
  ngOnInit() {
    // Componente já configurado com effects
  }
  
  changePosition(newPositionId: string) {
    if (newPositionId !== this.selectedPositionId()) {
      // Adicionar ao histórico
      this.visitedPositions.update(prev => {
        const updated = [...prev];
        const currentId = this.selectedPositionId();
        if (currentId && !updated.includes(currentId)) {
          updated.push(currentId);
        }
        if (!updated.includes(newPositionId)) {
          updated.push(newPositionId);
        }
        return updated;
      });
      
      this.selectedPositionId.set(newPositionId);
      
      // Calcular novas conexões
      const connections = this.careerCalculator.getSmartConnections(newPositionId);
      const validConnectionIds = connections.map(c => c.id);
      
      const newVisibleNodes = [newPositionId, ...validConnectionIds];
      this.visibleNodes.set([...new Set(newVisibleNodes)]);
    }
  }
  
  handleReset() {
    this.selectedPositionId.set('dev-net');
    this.visibleNodes.set(['dev-net']);
    this.searchTerm.set('');
    this.searchResults.set([]);
    this.showSearch.set(false);
    this.visitedPositions.set(['dev-net']);
  }
  
  handleSearch(term: string) {
    this.searchTerm.set(term);
    
    if (!term.trim()) {
      this.searchResults.set([]);
      this.showSearch.set(false);
      return;
    }
    
    const results = this.positionService.searchPositions(term);
    this.searchResults.set(results);
    this.showSearch.set(results.length > 0);
  }
  
  handleNodeClick(nodeId: string) {
    if (!this.visibleNodes().includes(nodeId)) {
      this.visibleNodes.update(prev => [...prev, nodeId]);
    }
    this.changePosition(nodeId);
  }
  
  toggleLegend() {
    this.isLegendOpen.update(current => !current);
  }
}
```

### 2. **SearchPanelComponent**

```typescript
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-search-panel',
  template: `
    <div class="flex flex-col lg:flex-row gap-4">
      <div class="relative flex-1">
        <lucide-icon name="search" class="absolute left-3 top-3 h-4 w-4 text-gray-400"></lucide-icon>
        <input
          type="text"
          placeholder="Buscar por cargo, descrição, área ou nível..."
          [value]="searchTerm()"
          (input)="onSearchChange($event)"
          class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      <div class="flex gap-2">
        <button 
          (click)="reset.emit()"
          class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
          ↻ Resetar
        </button>
      </div>
    </div>
    
    <!-- Search Results -->
    <div *ngIf="searchResults().length > 0" 
         class="mt-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
      <h3 class="font-semibold text-gray-800 mb-3">
        Resultados da Busca ({{searchResults().length}})
      </h3>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
        <div *ngFor="let result of searchResults()" 
             (click)="positionSelected.emit(result.id)"
             class="p-3 hover:bg-gray-50 rounded-lg cursor-pointer border-l-4 transition-colors border-blue-400">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="font-medium text-gray-900 text-sm">{{result.title}}</h4>
              <p class="text-xs text-gray-600">{{result.pillar}} • {{result.level}}</p>
            </div>
            <div class="text-right">
              <p class="text-xs font-medium text-green-600">{{result.salary}}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SearchPanelComponent {
  searchTerm = input.required<string>();
  searchResults = input.required<any[]>();
  reset = output<void>();
  positionSelected = output<string>();
  searchTermChange = output<string>();
  
  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTermChange.emit(target.value);
  }
}
```

---

## ✅ Checklist de Migração

### 📋 Setup e Configuração
- [ ] ✅ Criar projeto Angular com routing e SCSS
- [ ] ✅ Instalar dependências (D3.js, Lucide, Tailwind)
- [ ] ✅ Configurar Tailwind CSS com cores customizadas
- [ ] ✅ Criar estrutura de pastas modular

### 🔧 Interfaces e Models
- [ ] ✅ Position interface com salaryMin/salaryMax
- [ ] ✅ Connection interface com score/reasons
- [ ] ✅ Node interface para D3.js
- [ ] ✅ Enums para áreas e níveis hierárquicos

### 🛠️ Services
- [ ] ✅ PositionDataService com busca
- [ ] ✅ CareerCalculatorService com algoritmo de sobreposição
- [ ] ✅ D3VisualizationService com zoom/pan e anti-colisão

### 🧩 Componentes
- [ ] ✅ CareerMapComponent principal com Signals
- [ ] ✅ SearchPanelComponent reativo
- [ ] ✅ PositionDetailsComponent com 2 colunas
- [ ] ✅ CareerHistoryComponent com chips clicáveis
- [ ] ✅ LegendPanelComponent em acordeão

### 🎯 Funcionalidades Específicas
- [ ] ✅ Algoritmo de sobreposição salarial (filtro eliminatório)
- [ ] ✅ Visualização SVG com D3.js (1000x700px)
- [ ] ✅ Sistema de busca em tempo real
- [ ] ✅ Histórico de navegação entre posições
- [ ] ✅ Anti-colisão de nós (100 iterações)
- [ ] ✅ Controles de zoom centralizados (-, ⌂, +)
- [ ] ✅ Detecção automática de teto de carreira
- [ ] ❌ **Remover botão "Mostrar Válidos"** (não migrar)

### 🎨 Interface e UX
- [ ] ✅ Layout responsivo com Tailwind
- [ ] ✅ Cores por área profissional (6 cores)
- [ ] ✅ Indicadores de compatibilidade (verde/amarelo/vermelho)
- [ ] ✅ Legenda interativa na parte inferior
- [ ] ✅ Estados de loading e feedback visual

### 🧪 Testes
- [ ] ✅ Unit tests para CareerCalculatorService
- [ ] ✅ Component tests para cada componente
- [ ] ✅ Integration tests para fluxo completo
- [ ] ✅ E2E tests para jornada do usuário

### 🚀 Deploy e Otimização
- [ ] ✅ Build de produção otimizado
- [ ] ✅ Lazy loading de módulos
- [ ] ✅ Tree shaking para D3.js
- [ ] ✅ Service Worker para cache

---

## 🎯 Principais Diferenças React → Angular

### 🔄 Gerenciamento de Estado

| **React (Hooks)** | **Angular (Signals)** |
|-------------------|------------------------|
| `useState()` | `signal()` |
| `useEffect()` | `effect()` |
| Computed values | `computed()` |
| Props | `input()` |
| Callbacks | `output()` |

### 🧩 Estrutura de Componentes

| **React** | **Angular** |
|-----------|-------------|
| JSX | Template + Component |
| Props drilling | Dependency Injection |
| Context API | Services + Signals |
| Custom hooks | Services + Computed |

### 📦 Dependências

| **React** | **Angular** |
|-----------|-------------|
| `react-icons` | `lucide-angular` |
| Direct D3 usage | D3 em Service |
| CSS-in-JS | SCSS + Tailwind |
| React Router | Angular Router |

---

## 🚀 Próximos Passos

1. **Fase 1**: Setup e interfaces básicas
2. **Fase 2**: Services com algoritmo de compatibilidade  
3. **Fase 3**: Componente principal + D3.js
4. **Fase 4**: Componentes secundários (busca, detalhes, histórico)
5. **Fase 5**: Testes e otimizações
6. **Fase 6**: Deploy e documentação

---

**🎉 Migração Completa! Este documento cobre todos os aspectos necessários para recriar o Mapa de Carreiras em Angular com fidelidade total ao projeto React original.**
