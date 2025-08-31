# 🗺️ Mapa de Carreiras - Migração para Angular

## 📋 Visão Geral do Projeto

O **Mapa de Carreiras** é uma aplicação interativa que visualiza progressões de carreira através de um mapa mental dinâmico. Utiliza D3.js para criar visualizações SVG interativas e algoritmos inteligentes para calcular compatibilidade entre posições.

### 🎯 Objetivos Principais
- Visualizar oportunidades de progressão de carreira
- Calcular compatibilidade baseada em salário, área e nível hierárquico
- Permitir exploração interativa com zoom, pan e busca
- Manter histórico de posições visitadas
- Sistema de filtros inteligentes

---

## 🏗️ Arquitetura do Sistema

### 📊 Estrutura de Dados

#### Interface Position
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

---

---

## 🆕 Nova Implementação - Sobreposição de Faixas Salariais

### 📊 Conceito Principal

A nova implementação utiliza **sobreposição real de faixas salariais** como critério fundamental para determinar conexões válidas entre posições. Isso garante que as transições sejam realistas e economicamente viáveis.

### 🔍 Como Funciona

#### Verificação de Sobreposição
```typescript
const hasRangeOverlap = currentSalaryMax >= targetSalaryMin && 
                       currentSalaryMin <= targetSalaryMax;
```

#### Exemplos Práticos

##### ✅ **Conexões Aprovadas**
```
UX Designer (8k-14k) → UX Lead (12k-18k)
Sobreposição: 12k-14k (2k de overlap)
Análise: ✅ Viável - há compatibilidade salarial real

Dev Pleno (10k-16k) → Dev Sênior (14k-22k)  
Sobreposição: 14k-16k (2k de overlap)
Análise: ✅ Viável - progressão natural dentro da faixa

Analista (12k-18k) → Especialista (16k-25k)
Sobreposição: 16k-18k (2k de overlap)
Análise: ✅ Viável - evolução com base salarial compatível
```

##### ❌ **Conexões Rejeitadas**
```
UX Designer (8k-14k) → Diretor Produto (20k-35k)
Gap: 14k → 20k (6k sem sobreposição)
Análise: ❌ Inviável - salto salarial muito grande

Dev Junior (4k-7k) → Tech Lead (18k-28k)
Gap: 7k → 18k (11k sem sobreposição)
Análise: ❌ Inviável - progressão irrealista

Analista Jr (6k-10k) → Gerente (25k-40k)
Gap: 10k → 25k (15k sem sobreposição)
Análise: ❌ Inviável - mudança muito abrupta
```

### 🎯 Benefícios da Nova Abordagem

1. **Realismo Econômico**: Elimina transições financeiramente impossíveis
2. **Progressão Gradual**: Favorece crescimento sustentável na carreira
3. **Transparência**: Critérios claros e objetivos para cada conexão
4. **Precisão**: Reduz "falsos positivos" no mapa de oportunidades

### 📈 Impacto no Score de Compatibilidade

O sistema mantém os mesmos critérios de pontuação, mas agora aplica o **filtro de sobreposição primeiro**:

1. **Filtro Primário**: Sobreposição de faixas (elimina conexões inviáveis)
2. **Score Salarial**: 0-40 pontos (baseado na progressão dentro da faixa compatível)
3. **Score de Área**: 5-30 pontos (mesma área = maior pontuação)
4. **Score Hierárquico**: 0-25 pontos (progressão natural = maior pontuação)
5. **Filtro Final**: Mínimo 20 pontos para exibição

### 🛠️ Implementação Angular

Na migração para Angular, essa lógica deve ser implementada no `CareerCalculatorService`:

```typescript
private hasRangeOverlap(current: Position, target: Position): boolean {
  return current.salaryMax >= target.salaryMin && 
         current.salaryMin <= target.salaryMax;
}

getSmartConnections(positionId: string): Connection[] {
  // Aplicar filtro de sobreposição primeiro
  const compatiblePositions = this.getAllPositions()
    .filter(target => this.hasRangeOverlap(currentPosition, target));
  
  // Calcular scores apenas para posições compatíveis
  return compatiblePositions
    .map(target => this.calculateCompatibility(currentPosition, target))
    .filter(connection => connection && connection.score >= 20)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);
}
```

### 📊 Interface Atualizada

O painel de detalhes deve exibir informações sobre a compatibilidade salarial:

```typescript
// Adicionar ao template do PositionDetailsComponent
<div class="text-xs text-blue-600 mb-2">
  💰 Sobreposição Salarial: {{getOverlapRange(connection)}}
</div>

// Método no componente
getOverlapRange(connection: Connection): string {
  const current = this.selectedPosition();
  const target = connection.position;
  
  const overlapMin = Math.max(current.salaryMin, target.salaryMin);
  const overlapMax = Math.min(current.salaryMax, target.salaryMax);
  
  return `${overlapMin}k - ${overlapMax}k`;
}
```

---

**🚀 Boa sorte com a migração para Angular! Este documento deve cobrir todos os aspectos necessários para recriar o projeto com sucesso.**
