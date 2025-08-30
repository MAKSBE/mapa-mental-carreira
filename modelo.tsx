import React, { useState, useRef, useEffect } from 'react';
import { Search, Info, Users, Code, Briefcase, DollarSign, TrendingUp, ArrowRight, Plus, Filter, Target, Link, Zap } from 'lucide-react';

const AdvancedCareerPathSystem = () => {
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredPosition, setHoveredPosition] = useState(null);
  const [expandedBranches, setExpandedBranches] = useState(['dev-net']);
  const [animatingPositions, setAnimatingPositions] = useState([]);
  const [showConnections, setShowConnections] = useState(true);
  const [salaryFilter, setSalaryFilter] = useState({ min: 0, max: 50000 });
  const [searchResults, setSearchResults] = useState([]);
  const [focusedCareerPath, setFocusedCareerPath] = useState(null);
  const svgRef = useRef();

  // Estrutura expandida com mais carreiras e conexões
  const careerEcosystem = {
    // Posições centrais/iniciais
    centers: {
      'dev-net': {
        id: 'dev-net',
        title: 'Desenvolvedor .NET',
        level: 'Pleno',
        salary: 'R$ 8.000 - R$ 12.000',
        salaryMin: 8000,
        salaryMax: 12000,
        color: '#1E3A8A',
        x: 400,
        y: 300,
        pillar: 'Tecnologia',
        area: 'Desenvolvimento',
        requirements: ['3+ anos em .NET', 'C#, ASP.NET Core', 'SQL Server/PostgreSQL'],
        description: 'Desenvolvimento de aplicações web e desktop com tecnologias Microsoft.',
        transferableSkills: ['programacao', 'logica', 'bancodados', 'analiseproblemas'],
        connections: ['dev-frontend', 'dev-backend', 'analista-sistemas', 'dev-fullstack']
      },
      'analista-marketing': {
        id: 'analista-marketing',
        title: 'Analista de Marketing',
        level: 'Pleno',
        salary: 'R$ 6.000 - R$ 10.000',
        salaryMin: 6000,
        salaryMax: 10000,
        color: '#DC2626',
        x: 150,
        y: 200,
        pillar: 'Marketing',
        area: 'Comunicação',
        requirements: ['Marketing Digital', 'Google Analytics', 'Redes Sociais'],
        description: 'Estratégias de marketing digital e análise de campanhas.',
        transferableSkills: ['analise', 'comunicacao', 'creativity', 'dados'],
        connections: ['product-manager', 'ux-designer', 'analista-dados']
      },
      'analista-financeiro': {
        id: 'analista-financeiro',
        title: 'Analista Financeiro',
        level: 'Pleno',
        salary: 'R$ 7.000 - R$ 11.000',
        salaryMin: 7000,
        salaryMax: 11000,
        color: '#059669',
        x: 700,
        y: 400,
        pillar: 'Financeiro',
        area: 'Finanças',
        requirements: ['Excel Avançado', 'Contabilidade', 'PowerBI'],
        description: 'Análise financeira, orçamentos e indicadores econômicos.',
        transferableSkills: ['analise', 'dados', 'excel', 'logica'],
        connections: ['analista-dados', 'bi-analyst', 'controller']
      }
    },

    // Todas as posições do ecossistema
    positions: {
      // TECNOLOGIA - Desenvolvimento
      'dev-frontend': {
        id: 'dev-frontend',
        title: 'Desenvolvedor Frontend',
        level: 'Pleno',
        salary: 'R$ 7.000 - R$ 11.000',
        salaryMin: 7000,
        salaryMax: 11000,
        color: '#7C3AED',
        x: 300,
        y: 150,
        pillar: 'Tecnologia',
        area: 'Desenvolvimento',
        requirements: ['React/Vue/Angular', 'JavaScript/TypeScript', 'CSS/SASS'],
        description: 'Desenvolvimento de interfaces de usuário modernas e responsivas.',
        transferableSkills: ['programacao', 'ux', 'design', 'logica'],
        connections: ['ux-designer', 'dev-fullstack', 'product-manager'],
        parent: 'dev-net'
      },

      'dev-backend': {
        id: 'dev-backend',
        title: 'Desenvolvedor Backend',
        level: 'Pleno',
        salary: 'R$ 8.500 - R$ 13.000',
        salaryMin: 8500,
        salaryMax: 13000,
        color: '#1E40AF',
        x: 500,
        y: 150,
        pillar: 'Tecnologia',
        area: 'Desenvolvimento',
        requirements: ['APIs REST', 'Microserviços', 'Docker/Kubernetes'],
        description: 'Desenvolvimento de sistemas backend, APIs e arquitetura de serviços.',
        transferableSkills: ['programacao', 'arquitetura', 'bancodados', 'seguranca'],
        connections: ['arquiteto-software', 'devops-engineer', 'tech-lead'],
        parent: 'dev-net'
      },

      'dev-fullstack': {
        id: 'dev-fullstack',
        title: 'Desenvolvedor Fullstack',
        level: 'Sênior',
        salary: 'R$ 10.000 - R$ 16.000',
        salaryMin: 10000,
        salaryMax: 16000,
        color: '#3B82F6',
        x: 400,
        y: 100,
        pillar: 'Tecnologia',
        area: 'Desenvolvimento',
        requirements: ['Frontend + Backend', 'DevOps básico', 'Experiência completa'],
        description: 'Desenvolvimento completo de aplicações web do frontend ao backend.',
        transferableSkills: ['programacao', 'arquitetura', 'ux', 'gestao'],
        connections: ['tech-lead', 'product-manager', 'arquiteto-software'],
        parent: 'dev-frontend'
      },

      'tech-lead': {
        id: 'tech-lead',
        title: 'Tech Lead',
        level: 'Sênior',
        salary: 'R$ 14.000 - R$ 20.000',
        salaryMin: 14000,
        salaryMax: 20000,
        color: '#60A5FA',
        x: 550,
        y: 50,
        pillar: 'Tecnologia',
        area: 'Liderança Técnica',
        requirements: ['Liderança técnica', 'Mentoria', 'Arquitetura de soluções'],
        description: 'Liderança de equipes técnicas e definição de padrões de desenvolvimento.',
        transferableSkills: ['lideranca', 'mentoria', 'arquitetura', 'gestao'],
        connections: ['cto', 'gerente-ti', 'arquiteto-software'],
        parent: 'dev-backend'
      },

      'arquiteto-software': {
        id: 'arquiteto-software',
        title: 'Arquiteto de Software',
        level: 'Sênior',
        salary: 'R$ 15.000 - R$ 25.000',
        salaryMin: 15000,
        salaryMax: 25000,
        color: '#2563EB',
        x: 650,
        y: 100,
        pillar: 'Tecnologia',
        area: 'Arquitetura',
        requirements: ['Arquitetura de sistemas', 'Cloud Computing', 'Padrões de design'],
        description: 'Definição da arquitetura técnica e padrões de desenvolvimento enterprise.',
        transferableSkills: ['arquitetura', 'planejamento', 'lideranca', 'estrategia'],
        connections: ['cto', 'consultor-ti'],
        parent: 'dev-backend'
      },

      // TECNOLOGIA - Dados e Analytics
      'analista-dados': {
        id: 'analista-dados',
        title: 'Analista de Dados',
        level: 'Pleno',
        salary: 'R$ 8.000 - R$ 12.000',
        salaryMin: 8000,
        salaryMax: 12000,
        color: '#0891B2',
        x: 600,
        y: 250,
        pillar: 'Dados',
        area: 'Analytics',
        requirements: ['SQL', 'Python/R', 'Power BI/Tableau'],
        description: 'Análise de dados, relatórios e insights para negócio.',
        transferableSkills: ['analise', 'dados', 'estatistica', 'programacao'],
        connections: ['data-scientist', 'bi-analyst', 'product-analyst'],
        parent: 'analista-financeiro'
      },

      'data-scientist': {
        id: 'data-scientist',
        title: 'Cientista de Dados',
        level: 'Sênior',
        salary: 'R$ 12.000 - R$ 20.000',
        salaryMin: 12000,
        salaryMax: 20000,
        color: '#0EA5E9',
        x: 700,
        y: 150,
        pillar: 'Dados',
        area: 'Ciência de Dados',
        requirements: ['Machine Learning', 'Python/R avançado', 'Estatística'],
        description: 'Modelagem preditiva, machine learning e insights avançados.',
        transferableSkills: ['programacao', 'estatistica', 'pesquisa', 'analise'],
        connections: ['ml-engineer', 'head-dados'],
        parent: 'analista-dados'
      },

      'bi-analyst': {
        id: 'bi-analyst',
        title: 'Analista de BI',
        level: 'Pleno',
        salary: 'R$ 9.000 - R$ 13.000',
        salaryMin: 9000,
        salaryMax: 13000,
        color: '#0284C7',
        x: 750,
        y: 300,
        pillar: 'Dados',
        area: 'Business Intelligence',
        requirements: ['Power BI/Tableau', 'SQL avançado', 'ETL/Data Warehouse'],
        description: 'Desenvolvimento de dashboards e relatórios executivos.',
        transferableSkills: ['analise', 'dados', 'visualizacao', 'negocio'],
        connections: ['arquiteto-dados', 'analista-dados'],
        parent: 'analista-dados'
      },

      // PRODUTO E UX
      'ux-designer': {
        id: 'ux-designer',
        title: 'UX Designer',
        level: 'Pleno',
        salary: 'R$ 7.500 - R$ 12.000',
        salaryMin: 7500,
        salaryMax: 12000,
        color: '#EC4899',
        x: 200,
        y: 100,
        pillar: 'Design',
        area: 'User Experience',
        requirements: ['Figma/Adobe XD', 'Pesquisa com usuários', 'Prototipagem'],
        description: 'Design de experiência do usuário, pesquisa e prototipagem.',
        transferableSkills: ['design', 'pesquisa', 'empatia', 'comunicacao'],
        connections: ['product-designer', 'product-manager', 'dev-frontend'],
        parent: 'analista-marketing'
      },

      'product-manager': {
        id: 'product-manager',
        title: 'Product Manager',
        level: 'Sênior',
        salary: 'R$ 12.000 - R$ 18.000',
        salaryMin: 12000,
        salaryMax: 18000,
        color: '#F59E0B',
        x: 250,
        y: 50,
        pillar: 'Produto',
        area: 'Gestão de Produto',
        requirements: ['Estratégia de produto', 'Metodologias ágeis', 'Analytics'],
        description: 'Gestão estratégica de produtos digitais e roadmap de desenvolvimento.',
        transferableSkills: ['estrategia', 'gestao', 'analise', 'comunicacao'],
        connections: ['head-produto', 'cpo', 'consultant-produto'],
        parent: 'ux-designer'
      },

      'product-analyst': {
        id: 'product-analyst',
        title: 'Product Analyst',
        level: 'Pleno',
        salary: 'R$ 8.500 - R$ 13.000',
        salaryMin: 8500,
        salaryMax: 13000,
        color: '#D97706',
        x: 350,
        y: 200,
        pillar: 'Produto',
        area: 'Analytics de Produto',
        requirements: ['Google Analytics', 'SQL', 'A/B Testing'],
        description: 'Análise de métricas de produto e otimização de conversão.',
        transferableSkills: ['analise', 'dados', 'experimentacao', 'produto'],
        connections: ['product-manager', 'analista-dados', 'growth-hacker'],
        parent: 'analista-dados'
      },

      // GESTÃO E LIDERANÇA
      'gerente-ti': {
        id: 'gerente-ti',
        title: 'Gerente de TI',
        level: 'Gerência',
        salary: 'R$ 15.000 - R$ 22.000',
        salaryMin: 15000,
        salaryMax: 22000,
        color: '#7C2D12',
        x: 500,
        y: 450,
        pillar: 'Gestão',
        area: 'Gestão de TI',
        requirements: ['Gestão de equipes', 'ITIL/COBIT', 'Orçamento de TI'],
        description: 'Gestão estratégica de tecnologia e equipes de desenvolvimento.',
        transferableSkills: ['gestao', 'lideranca', 'estrategia', 'orcamento'],
        connections: ['diretor-ti', 'cto', 'consultor-gestao'],
        parent: 'tech-lead'
      },

      'cto': {
        id: 'cto',
        title: 'Chief Technology Officer',
        level: 'C-Level',
        salary: 'R$ 25.000 - R$ 45.000',
        salaryMin: 25000,
        salaryMax: 45000,
        color: '#1F2937',
        x: 400,
        y: 500,
        pillar: 'Liderança',
        area: 'Liderança Executiva',
        requirements: ['Visão estratégica', 'Liderança executiva', 'Inovação tecnológica'],
        description: 'Liderança executiva em tecnologia e estratégia de inovação digital.',
        transferableSkills: ['lideranca', 'estrategia', 'inovacao', 'negocios'],
        connections: ['ceo', 'consultor-executivo'],
        parent: 'gerente-ti'
      },

      // FINANCEIRO
      'controller': {
        id: 'controller',
        title: 'Controller',
        level: 'Sênior',
        salary: 'R$ 12.000 - R$ 18.000',
        salaryMin: 12000,
        salaryMax: 18000,
        color: '#047857',
        x: 800,
        y: 450,
        pillar: 'Financeiro',
        area: 'Controladoria',
        requirements: ['Controladoria', 'IFRS', 'Gestão de equipes'],
        description: 'Controladoria corporativa e gestão de processos financeiros.',
        transferableSkills: ['gestao', 'analise', 'compliance', 'lideranca'],
        connections: ['cfo', 'diretor-financeiro'],
        parent: 'analista-financeiro'
      }
    }
  };

  // Função para buscar posições
  const searchPositions = (term) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    const allPositions = { ...careerEcosystem.centers, ...careerEcosystem.positions };
    const results = Object.values(allPositions).filter(position => 
      position.title.toLowerCase().includes(term.toLowerCase()) ||
      position.area.toLowerCase().includes(term.toLowerCase()) ||
      position.pillar.toLowerCase().includes(term.toLowerCase()) ||
      position.description.toLowerCase().includes(term.toLowerCase()) ||
      position.requirements.some(req => req.toLowerCase().includes(term.toLowerCase()))
    );

    setSearchResults(results);
  };

  // Função para focar em uma carreira específica e mostrar suas conexões
  const focusOnCareer = (positionId) => {
    const position = careerEcosystem.centers[positionId] || careerEcosystem.positions[positionId];
    if (!position) return;

    setFocusedCareerPath(positionId);
    setSelectedPosition(position);

    // Expandir a trilha completa desta carreira
    const pathToExpand = getFullCareerPath(positionId);
    setExpandedBranches(['dev-net', ...pathToExpand]);
    setAnimatingPositions(pathToExpand);
    setTimeout(() => setAnimatingPositions([]), 800);
  };

  // Função para obter o caminho completo de uma carreira
  const getFullCareerPath = (positionId) => {
    const position = careerEcosystem.centers[positionId] || careerEcosystem.positions[positionId];
    if (!position) return [];

    const path = [positionId];
    
    // Adicionar conexões diretas
    if (position.connections) {
      path.push(...position.connections);
    }

    // Adicionar posições conectadas por habilidades transferíveis e faixa salarial
    Object.values(careerEcosystem.positions).forEach(otherPosition => {
      if (otherPosition.id === positionId) return;

      // Verificar sobreposição salarial (±20%)
      const salaryOverlap = (
        (position.salaryMin <= otherPosition.salaryMax * 1.2) &&
        (position.salaryMax >= otherPosition.salaryMin * 0.8)
      );

      // Verificar habilidades transferíveis
      const skillsOverlap = position.transferableSkills?.some(skill =>
        otherPosition.transferableSkills?.includes(skill)
      );

      if ((salaryOverlap && skillsOverlap) || position.connections?.includes(otherPosition.id)) {
        path.push(otherPosition.id);
      }
    });

    return [...new Set(path)];
  };

  // Função para filtrar posições por salário
  const getFilteredPositions = () => {
    const allPositions = { ...careerEcosystem.centers, ...careerEcosystem.positions };
    return Object.values(allPositions).filter(position => {
      const matchesSearch = searchTerm === '' || 
        position.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        position.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
        position.pillar.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSalary = position.salaryMin >= salaryFilter.min && 
                           position.salaryMax <= salaryFilter.max;

      const isInExpandedBranch = expandedBranches.includes(position.id) ||
                                Object.keys(careerEcosystem.centers).includes(position.id);

      return matchesSearch && matchesSalary && isInExpandedBranch;
    });
  };

  // Função para renderizar conexões com base em habilidades e salários
  const renderSmartConnections = () => {
    if (!showConnections) return [];

    const connections = [];
    const positions = getFilteredPositions();

    positions.forEach(position => {
      if (position.connections) {
        position.connections.forEach(connectedId => {
          const connectedPosition = careerEcosystem.centers[connectedId] || careerEcosystem.positions[connectedId];
          if (!connectedPosition || !expandedBranches.includes(connectedId)) return;

          const isHighlighted = focusedCareerPath === position.id || focusedCareerPath === connectedId ||
                               (selectedPosition && (selectedPosition.id === position.id || selectedPosition.id === connectedId));
          
          // Determinar tipo de conexão
          const salaryOverlap = (position.salaryMin <= connectedPosition.salaryMax * 1.2) &&
                               (position.salaryMax >= connectedPosition.salaryMin * 0.8);
          
          const skillsOverlap = position.transferableSkills?.some(skill =>
            connectedPosition.transferableSkills?.includes(skill)
          );

          let connectionType = 'normal';
          let strokeColor = '#94A3B8';
          let strokeWidth = 2;

          if (salaryOverlap && skillsOverlap) {
            connectionType = 'strong';
            strokeColor = '#10B981';
            strokeWidth = 3;
          } else if (salaryOverlap) {
            connectionType = 'salary';
            strokeColor = '#F59E0B';
            strokeWidth = 2.5;
          } else if (skillsOverlap) {
            connectionType = 'skills';
            strokeColor = '#8B5CF6';
            strokeWidth = 2.5;
          }

          if (isHighlighted) {
            strokeColor = '#EF4444';
            strokeWidth = 4;
          }

          connections.push(
            <g key={`${position.id}-${connectedId}`}>
              <path
                d={`M ${position.x} ${position.y} Q ${(position.x + connectedPosition.x) / 2} ${(position.y + connectedPosition.y) / 2 - 40} ${connectedPosition.x} ${connectedPosition.y}`}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeOpacity={isHighlighted ? 1 : 0.6}
                fill="none"
                className="transition-all duration-500"
                style={{
                  filter: isHighlighted ? `drop-shadow(0 2px 8px ${strokeColor}40)` : 'none',
                  strokeDasharray: connectionType === 'skills' ? '5,5' : connectionType === 'salary' ? '10,5' : 'none'
                }}
              />
              {/* Indicador de tipo de conexão */}
              {connectionType !== 'normal' && (
                <circle
                  cx={(position.x + connectedPosition.x) / 2}
                  cy={(position.y + connectedPosition.y) / 2 - 40}
                  r="3"
                  fill={strokeColor}
                  opacity={isHighlighted ? 1 : 0.8}
                />
              )}
            </g>
          );
        });
      }
    });

    return connections;
  };

  // Função para renderizar os nós
  const renderNodes = () => {
    const positions = getFilteredPositions();

    return positions.map(position => {
      const isSelected = selectedPosition?.id === position.id;
      const isHovered = hoveredPosition?.id === position.id;
      const isAnimating = animatingPositions.includes(position.id);
      const isFocused = focusedCareerPath === position.id;
      const isCenter = Object.keys(careerEcosystem.centers).includes(position.id);
      const hasConnections = position.connections && position.connections.length > 0;

      return (
        <g key={position.id}>
          {/* Card principal */}
          <rect
            x={position.x - (isCenter ? 90 : 80)}
            y={position.y - (isCenter ? 30 : 25)}
            width={isCenter ? 180 : 160}
            height={isCenter ? 60 : 50}
            rx="10"
            ry="10"
            fill={position.color}
            stroke={isSelected ? '#1D4ED8' : (isFocused ? '#EF4444' : '#fff')}
            strokeWidth={isSelected || isFocused ? 4 : 2}
            opacity={isSelected || isHovered || isFocused ? 1 : 0.9}
            className={`cursor-pointer transition-all duration-500 hover:opacity-100 ${
              isAnimating ? 'animate-pulse' : ''
            }`}
            onClick={() => focusOnCareer(position.id)}
            onMouseEnter={() => setHoveredPosition(position)}
            onMouseLeave={() => setHoveredPosition(null)}
            style={{
              filter: isSelected || isHovered || isFocused ? 'drop-shadow(0 6px 16px rgba(0,0,0,0.3))' : 'none',
              transform: isHovered ? 'scale(1.05)' : (isAnimating ? 'scale(1.02)' : 'scale(1)'),
              transformOrigin: `${position.x}px ${position.y}px`
            }}
          />

          {/* Título */}
          <text
            x={position.x}
            y={position.y - 8}
            textAnchor="middle"
            fill="white"
            fontSize={isCenter ? "13" : "11"}
            fontWeight="600"
            className="pointer-events-none select-none"
            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
          >
            {position.title}
          </text>
          
          {/* Área/Pillar */}
          <text
            x={position.x}
            y={position.y + 2}
            textAnchor="middle"
            fill="white"
            fontSize="9"
            opacity="0.9"
            className="pointer-events-none select-none"
          >
            {position.area}
          </text>

          {/* Salário */}
          <text
            x={position.x}
            y={position.y + 12}
            textAnchor="middle"
            fill="white"
            fontSize="8"
            opacity="0.8"
            className="pointer-events-none select-none"
          >
            {position.salary.replace('R$ ', '').replace(' - R$ ', ' - ')}
          </text>

          {/* Indicador de conexões */}
          {hasConnections && (
            <g>
              <circle
                cx={position.x + (isCenter ? 85 : 75)}
                cy={position.y}
                r="8"
                fill="#10B981"
                stroke="white"
                strokeWidth="2"
                opacity="0.9"
              />
              <Link className="w-3 h-3" x={position.x + (isCenter ? 82 : 72)} y={position.y - 3} fill="white" />
            </g>
          )}

          {/* Badge de foco */}
          {isFocused && (
            <g>
              <circle
                cx={position.x - (isCenter ? 75 : 65)}
                cy={position.y - (isCenter ? 15 : 10)}
                r="6"
                fill="#EF4444"
                stroke="white"
                strokeWidth="2"
              />
              <Target className="w-2 h-2" x={position.x - (isCenter ? 77 : 67)} y={position.y - (isCenter ? 17 : 12)} fill="white" />
            </g>
          )}

          {/* Animação de destaque */}
          {isAnimating && (
            <rect
              x={position.x - (isCenter ? 95 : 85)}
              y={position.y - (isCenter ? 35 : 30)}
              width={isCenter ? 190 : 170}
              height={isCenter ? 70 : 60}
              rx="15"
              ry="15"
              fill="none"
              stroke="#10B981"
              strokeWidth="3"
              opacity="0.6"
              className="animate-ping"
            />
          )}
        </g>
      );
    });
  };

  useEffect(() => {
    searchPositions(searchTerm);
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header Expandido */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ecossistema de Carreiras Conectadas</h1>
              <p className="text-gray-600">Explore trilhas interconectadas baseadas em habilidades transferíveis e faixas salariais</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Busca inteligente */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar carreiras, habilidades, áreas..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    {searchResults.map(result => (
                      <div
                        key={result.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => {
                          focusOnCareer(result.id);
                          setSearchResults([]);
                          setSearchTerm('');
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: result.color }}
                            ></div>
                            <div>
                              <div className="font-medium text-gray-900">{result.title}</div>
                              <div className="text-sm text-gray-500">{result.area} • {result.salary}</div>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Filtros */}
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-600" />
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    const [min, max] = e.target.value.split('-').map(Number);
                    setSalaryFilter({ min: min || 0, max: max || 50000 });
                  }}
                >
                  <option value="0-50000">Todas as faixas</option>
                  <option value="0-10000">Até R$ 10.000</option>
                  <option value="10000-20000">R$ 10.000 - R$ 20.000</option>
                  <option value="20000-50000">R$ 20.000+</option>
                </select>
              </div>

              {/* Toggle de conexões */}
              <button
                onClick={() => setShowConnections(!showConnections)}
                className={`p-2 rounded-lg transition-colors ${
                  showConnections ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Zap className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Mapa Principal */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Mapa de Carreiras Interconectadas</h2>
                    <p className="text-blue-100">Clique em qualquer posição para explorar conexões baseadas em habilidades e salários</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setExpandedBranches(Object.keys(careerEcosystem.centers));
                        setFocusedCareerPath(null);
                        setSelectedPosition(null);
                      }}
                      className="px-3 py-1 bg-white bg-opacity-20 rounded-lg text-sm hover:bg-opacity-30 transition-colors"
                    >
                      📈 Expandir Tudo
                    </button>
                    <button
                      onClick={() => {
                        setExpandedBranches(['dev-net']);
                        setFocusedCareerPath(null);
                        setSelectedPosition(null);
                        setAnimatingPositions([]);
                      }}
                      className="px-3 py-1 bg-white bg-opacity-20 rounded-lg text-sm hover:bg-opacity-30 transition-colors"
                    >
                      ↻ Resetar
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="relative overflow-auto">
                <svg
                  ref={svgRef}
                  width="1000"
                  height="600"
                  viewBox="0 0 1000 600"
                  className="w-full"
                  style={{ minHeight: '600px', background: 'radial-gradient(circle at center, #f8fafc 0%, #e2e8f0 100%)' }}
                >
                  {/* Padrão de fundo */}
                  <defs>
                    <pattern id="connectionPattern" patternUnits="userSpaceOnUse" width="40" height="40">
                      <circle cx="20" cy="20" r="1" fill="#e2e8f0" opacity="0.4"/>
                    </pattern>
                    <linearGradient id="strongConnection" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.8"/>
                      <stop offset="100%" stopColor="#059669" stopOpacity="0.8"/>
                    </linearGradient>
                  </defs>
                  
                  <rect width="100%" height="100%" fill="url(#connectionPattern)"/>
                  
                  {/* Conexões inteligentes */}
                  {renderSmartConnections()}
                  
                  {/* Nós */}
                  {renderNodes()}
                </svg>
              </div>

              {/* Legenda expandida */}
              <div className="p-4 bg-gray-50 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Áreas de Carreira</h4>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded bg-blue-800"></div>
                        <span>Tecnologia</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded bg-cyan-600"></div>
                        <span>Dados & Analytics</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded bg-pink-600"></div>
                        <span>Design & UX</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded bg-amber-600"></div>
                        <span>Produto</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded bg-green-700"></div>
                        <span>Financeiro</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded bg-red-700"></div>
                        <span>Marketing</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Tipos de Conexão</h4>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-1 bg-green-500"></div>
                        <span>Habilidades + Salário</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-1 bg-amber-500"></div>
                        <span>Faixa Salarial</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-1 bg-purple-500" style={{borderStyle: 'dashed', borderWidth: '1px 0'}}></div>
                        <span>Habilidades</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-1 bg-red-500"></div>
                        <span>Trilha Focada</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Carreiras em Destaque */}
            <div className="mt-6 bg-white rounded-xl shadow-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 Trilhas Populares</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.values(careerEcosystem.centers).map(career => (
                  <div 
                    key={career.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors hover:shadow-md"
                    onClick={() => focusOnCareer(career.id)}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: career.color }}
                      ></div>
                      <h4 className="font-medium text-gray-900">{career.title}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{career.description}</p>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-green-600 font-medium">{career.salary}</span>
                      <span className="text-blue-600">
                        {career.connections?.length || 0} conexões
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Painel de Detalhes Expandido */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border sticky top-4">
              <div className="p-4 bg-gradient-to-r from-gray-800 to-gray-700 text-white rounded-t-xl">
                <h2 className="text-lg font-semibold flex items-center">
                  <Info className="w-5 h-5 mr-2" />
                  {selectedPosition ? 'Detalhes da Posição' : 'Navegação Inteligente'}
                </h2>
              </div>
              
              <div className="p-6 max-h-[80vh] overflow-y-auto">
                {selectedPosition ? (
                  <div className="space-y-6">
                    {/* Header da posição */}
                    <div>
                      <div 
                        className="w-12 h-12 rounded-lg mb-3 flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: selectedPosition.color }}
                      >
                        {selectedPosition.title.charAt(0)}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedPosition.title}</h3>
                      <div className="flex flex-col space-y-2 text-sm">
                        <div className="flex items-center text-gray-600">
                          <TrendingUp className="w-4 h-4 mr-2" />
                          <span className="font-medium">{selectedPosition.level}</span>
                        </div>
                        <div className="flex items-center text-green-600">
                          <DollarSign className="w-4 h-4 mr-2" />
                          <span className="font-medium">{selectedPosition.salary}</span>
                        </div>
                        <div className="flex items-center text-blue-600">
                          <Briefcase className="w-4 h-4 mr-2" />
                          <span className="font-medium">{selectedPosition.area}</span>
                        </div>
                      </div>
                    </div>

                    {/* Descrição */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">📝 Descrição</h4>
                      <p className="text-gray-700 text-sm leading-relaxed">{selectedPosition.description}</p>
                    </div>

                    {/* Requisitos */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">✅ Requisitos</h4>
                      <ul className="space-y-2">
                        {selectedPosition.requirements.map((req, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Habilidades Transferíveis */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">🔄 Habilidades Transferíveis</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedPosition.transferableSkills?.map((skill, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        )) || <span className="text-gray-500 text-sm">Não especificadas</span>}
                      </div>
                    </div>

                    {/* Conexões de Carreira */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">🚀 Próximos Passos</h4>
                      <div className="space-y-3">
                        {selectedPosition.connections?.map(connectedId => {
                          const connectedPos = careerEcosystem.centers[connectedId] || careerEcosystem.positions[connectedId];
                          if (!connectedPos) return null;

                          // Determinar tipo de transição
                          const salaryIncrease = connectedPos.salaryMin > selectedPosition.salaryMax;
                          const sameArea = connectedPos.area === selectedPosition.area;
                          
                          return (
                            <div 
                              key={connectedId}
                              className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 cursor-pointer hover:shadow-md transition-all"
                              onClick={() => focusOnCareer(connectedId)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <div 
                                    className="w-3 h-3 rounded"
                                    style={{ backgroundColor: connectedPos.color }}
                                  ></div>
                                  <span className="font-medium text-sm text-gray-900">{connectedPos.title}</span>
                                </div>
                                <div className="flex space-x-1">
                                  {salaryIncrease && <span className="text-xs text-green-600">💰</span>}
                                  {sameArea && <span className="text-xs text-blue-600">🎯</span>}
                                  <ArrowRight className="w-3 h-3 text-blue-500" />
                                </div>
                              </div>
                              <div className="text-xs text-gray-600 mb-1">{connectedPos.area} • {connectedPos.salary}</div>
                              <div className="text-xs text-blue-700">
                                {salaryIncrease ? '📈 Aumento salarial' : sameArea ? '🔄 Mesma área' : '🌟 Nova área'}
                              </div>
                            </div>
                          );
                        }) || (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            <p>🎯 Posição especializada</p>
                            <p className="text-xs mt-1">Explore outras áreas para descobrir transições!</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Análise de Transição */}
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">🎯 Análise de Transição</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Nível de Senioridade:</span>
                          <span className="font-medium">{selectedPosition.level}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Conexões Disponíveis:</span>
                          <span className="font-medium">{selectedPosition.connections?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Potencial de Crescimento:</span>
                          <span className="font-medium text-green-600">
                            {selectedPosition.connections?.length > 2 ? 'Alto' : 
                             selectedPosition.connections?.length > 0 ? 'Médio' : 'Especializado'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Target className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Explore Carreiras Conectadas</h3>
                    <p className="text-gray-600 mb-4 text-sm">Use a busca inteligente ou clique em qualquer posição para descobrir trilhas de carreira</p>
                    
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-blue-900 mb-2">💡 Recursos Disponíveis</h4>
                      <ul className="text-xs text-blue-800 space-y-1 text-left">
                        <li>🔍 Busca por carreira, área ou habilidade</li>
                        <li>💰 Filtro por faixa salarial</li>
                        <li>🔗 Conexões baseadas em habilidades</li>
                        <li>📈 Análise de potencial de crescimento</li>
                        <li>🎯 Trilhas de transição inteligentes</li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-800 text-sm">🚀 Comece Explorando:</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {Object.values(careerEcosystem.centers).slice(0, 3).map(career => (
                          <button
                            key={career.id}
                            onClick={() => focusOnCareer(career.id)}
                            className="flex items-center space-x-2 p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                          >
                            <div 
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: career.color }}
                            ></div>
                            <span className="text-sm font-medium text-gray-700">{career.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas do Ecossistema */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-4 border">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total de Carreiras</p>
                <p className="text-lg font-semibold text-gray-900">{Object.keys(careerEcosystem.positions).length + Object.keys(careerEcosystem.centers).length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Link className="w-4 h-4 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Conexões Ativas</p>
                <p className="text-lg font-semibold text-gray-900">
                  {Object.values(careerEcosystem.positions).reduce((acc, pos) => acc + (pos.connections?.length || 0), 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Áreas Cobertas</p>
                <p className="text-lg font-semibold text-gray-900">6</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-amber-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Faixa Salarial</p>
                <p className="text-lg font-semibold text-gray-900">R$ 6K - R$ 45K</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <Zap className="w-4 h-4 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Transições Possíveis</p>
                <p className="text-lg font-semibold text-gray-900">
                  {focusedCareerPath ? 
                    getFullCareerPath(focusedCareerPath).length - 1 : 
                    'Selecione uma carreira'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedCareerPathSystem;