import React, { useState, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { Search, Info, Briefcase, DollarSign, TrendingUp } from 'lucide-react';
import { positions } from '../data/positions';

const CareerMindMapFixed = () => {
  const [selectedPositionId, setSelectedPositionId] = useState('dev-net');
  const [visibleNodes, setVisibleNodes] = useState(['dev-net']);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [viewMode, setViewMode] = useState('network'); // 'network' ou 'grid'
  const svgRef = useRef();
  
  const selectedPosition = selectedPositionId ? positions[selectedPositionId] : null;

  // Função para calcular conexões inteligentes aprimoradas
  const getSmartConnections = (positionId) => {
    const currentPos = positions[positionId];
    if (!currentPos) return [];

    const connections = [];
    const currentSalaryMin = currentPos.salaryMin || 0;
    const currentSalaryMax = currentPos.salaryMax || 0;
    const currentSalaryAvg = (currentSalaryMin + currentSalaryMax) / 2;

    // Definir faixas de transição salarial (±30% para flexibilidade)
    const salaryFlexibility = 0.3;
    const minAcceptableSalary = currentSalaryAvg * (1 - salaryFlexibility);
    const maxAcceptableSalary = currentSalaryAvg * (1 + salaryFlexibility * 1.5); // Permitir mais crescimento

    Object.entries(positions).forEach(([targetId, targetPos]) => {
      if (targetId === positionId) return; // Não incluir a própria posição

      const targetSalaryMin = targetPos.salaryMin || 0;
      const targetSalaryMax = targetPos.salaryMax || 0;
      const targetSalaryAvg = (targetSalaryMin + targetSalaryMax) / 2;

      // Calcular score de compatibilidade
      let compatibilityScore = 0;
      let reasons = [];

      // Score baseado em proximidade salarial (0-35 pontos)
      if (targetSalaryAvg >= minAcceptableSalary && targetSalaryAvg <= maxAcceptableSalary) {
        const salaryDiff = Math.abs(currentSalaryAvg - targetSalaryAvg);
        const maxDiff = currentSalaryAvg * salaryFlexibility;
        const salaryScore = Math.max(15, (1 - (salaryDiff / maxDiff)) * 35);
        compatibilityScore += salaryScore;
        
        if (targetSalaryAvg > currentSalaryAvg * 1.1) {
          reasons.push('Progressão salarial');
        } else {
          reasons.push('Salário compatível');
        }
      } else if (targetSalaryAvg > currentSalaryAvg) {
        // Mesmo se fora da faixa, dar pontos para crescimento
        compatibilityScore += 10;
        reasons.push('Potencial de crescimento');
      }

      // Score baseado em área/pillar (0-30 pontos)
      if (currentPos.pillar === targetPos.pillar) {
        compatibilityScore += 30; // Mesma área
        reasons.push('Mesma área');
      } else {
        // Áreas relacionadas expandidas
        const relatedAreas = {
          'Tecnologia': ['Dados', 'Produto', 'Inovação', 'Operações'],
          'Gestão': ['Finanças', 'Recursos Humanos', 'Operações', 'Produto'],
          'Finanças': ['Gestão', 'Dados', 'Consultoria', 'Operações'],
          'Dados': ['Tecnologia', 'Finanças', 'Produto', 'Inovação'],
          'Produto': ['Tecnologia', 'Dados', 'Gestão', 'Inovação'],
          'Recursos Humanos': ['Gestão', 'Operações', 'Consultoria'],
          'Operações': ['Gestão', 'Finanças', 'Recursos Humanos', 'Tecnologia'],
          'Inovação': ['Tecnologia', 'Produto', 'Dados', 'Gestão']
        };
        
        if (relatedAreas[currentPos.pillar]?.includes(targetPos.pillar)) {
          compatibilityScore += 18; // Áreas relacionadas
          reasons.push('Área relacionada');
        } else {
          compatibilityScore += 5; // Mudança de área
          reasons.push('Nova área');
        }
      }

      // Score baseado em nível hierárquico (0-25 pontos)
      const levelScore = {
        'Júnior': 1, 'Pleno': 2, 'Sênior': 3, 'Especialista': 3,
        'Coordenador': 4, 'Gerente': 5, 'Diretor': 6, 'VP': 7, 'C-Level': 8
      };
      
      const currentLevel = levelScore[currentPos.level] || 2;
      const targetLevel = levelScore[targetPos.level] || 2;
      const levelDiff = targetLevel - currentLevel;
      
      if (levelDiff === 0) {
        compatibilityScore += 20; // Mesmo nível
        reasons.push('Mesmo nível');
      } else if (levelDiff === 1) {
        compatibilityScore += 25; // Progressão natural
        reasons.push('Progressão natural');
      } else if (levelDiff === 2) {
        compatibilityScore += 15; // Crescimento significativo
        reasons.push('Grande crescimento');
      } else if (levelDiff < 0 && levelDiff >= -1) {
        compatibilityScore += 10; // Mudança lateral
        reasons.push('Mudança lateral');
      }

      // Score baseado em habilidades transferíveis (0-15 pontos)
      const skillMapping = {
        'Programação': ['Tecnologia', 'Dados'],
        'Análise': ['Dados', 'Finanças', 'Consultoria'],
        'Liderança': ['Gestão', 'Recursos Humanos'],
        'Comunicação': ['Recursos Humanos', 'Gestão', 'Produto'],
        'Estratégia': ['Gestão', 'Produto', 'Inovação'],
        'Processos': ['Operações', 'Gestão']
      };

      let skillTransferability = 0;
      Object.entries(skillMapping).forEach(([skill, areas]) => {
        if (areas.includes(currentPos.pillar) && areas.includes(targetPos.pillar)) {
          skillTransferability += 5;
        }
      });
      
      compatibilityScore += Math.min(15, skillTransferability);
      if (skillTransferability > 0) {
        reasons.push('Skills transferíveis');
      }

      // Score baseado em conexões existentes (0-10 pontos)
      if (currentPos.connections && currentPos.connections.includes(targetId)) {
        compatibilityScore += 10; // Conexão já definida
        reasons.push('Conexão direta');
      }

      // Bonus para cargos em alta demanda (0-8 pontos)
      const highDemandRoles = [
        'Data Scientist', 'Product Manager', 'DevOps Engineer', 
        'UX Designer', 'ML Engineer', 'Cloud Architect', 'Scrum Master'
      ];
      
      if (highDemandRoles.some(role => targetPos.title.includes(role))) {
        compatibilityScore += 8;
        reasons.push('Alta demanda');
      }

      // Bonus para transições comuns no mercado (0-12 pontos)
      const commonTransitions = {
        'Desenvolvedor': ['Tech Lead', 'Arquiteto', 'DevOps Engineer', 'Product Manager'],
        'Analista': ['Product Manager', 'Data Scientist', 'Consultor', 'Coordenador'],
        'Designer': ['Product Manager', 'UX Manager', 'Creative Director'],
        'QA': ['DevOps Engineer', 'Product Manager', 'Scrum Master'],
        'Tech Lead': ['Gerente', 'Arquiteto', 'Product Manager'],
        'Coordenador': ['Gerente', 'Especialista', 'Consultor']
      };

      Object.entries(commonTransitions).forEach(([currentRole, possibleRoles]) => {
        if (currentPos.title.includes(currentRole)) {
          possibleRoles.forEach(role => {
            if (targetPos.title.includes(role)) {
              compatibilityScore += 12;
              reasons.push('Transição comum');
            }
          });
        }
      });

      // Incluir se score mínimo for atingido
      if (compatibilityScore >= 20) {
        connections.push({
          id: targetId,
          position: targetPos,
          score: Math.min(100, Math.round(compatibilityScore)),
          reasons: reasons,
          salaryDifference: Math.round(targetSalaryAvg - currentSalaryAvg),
          transitionType: currentPos.pillar === targetPos.pillar ? 'internal' : 'cross-functional'
        });
      }
    });

    // Ordenar por score de compatibilidade e limitar para evitar sobrecarga visual
    return connections.sort((a, b) => b.score - a.score).slice(0, 12); // Top 12 conexões
  };

  const handleReset = () => {
    console.log('Reset acionado');
    setVisibleNodes(['dev-net']);
    setSelectedPositionId('dev-net');
    setSearchTerm('');
    setSearchResults([]);
    setShowSearch(false);
  };

  const handleShowAll = () => {
    const allPositionIds = Object.keys(positions);
    setVisibleNodes(allPositionIds);
    setViewMode('grid');
  };

  const handleSearchPositions = (term) => {
    if (!term.trim()) {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }

    const results = [];
    Object.entries(positions).forEach(([posKey, position]) => {
      if (
        position.title.toLowerCase().includes(term.toLowerCase()) ||
        position.description.toLowerCase().includes(term.toLowerCase()) ||
        position.pillar.toLowerCase().includes(term.toLowerCase()) ||
        position.level.toLowerCase().includes(term.toLowerCase()) ||
        position.salary.toLowerCase().includes(term.toLowerCase())
      ) {
        // Calcular compatibilidade com posição atual se houver uma selecionada
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
    
    // Ordenar por compatibilidade se houver, senão por ordem alfabética
    results.sort((a, b) => {
      if (a.compatibility && b.compatibility) {
        return b.compatibility - a.compatibility;
      }
      if (a.compatibility && !b.compatibility) return -1;
      if (!a.compatibility && b.compatibility) return 1;
      return a.title.localeCompare(b.title);
    });
    
    setSearchResults(results);
    setShowSearch(results.length > 0);
  };

  const handleNodeClick = (nodeData) => {
    console.log('Nó clicado:', nodeData.id);
    setSelectedPositionId(nodeData.id);
    
    // Expandir conexões inteligentes do nó clicado
    const newVisibleNodes = new Set(visibleNodes);
    const smartConnections = getSmartConnections(nodeData.id);
    
    // Adicionar as 4 melhores conexões automaticamente
    smartConnections.slice(0, 4).forEach(conn => {
      if (positions[conn.id]) {
        newVisibleNodes.add(conn.id);
      }
    });
    
    setVisibleNodes(Array.from(newVisibleNodes));
  };

  useEffect(() => {
    console.log('CareerMindMapFixed useEffect iniciado');
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    
    const width = 900;
    const height = 600;
    
    // Teste simples de renderização
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#333")
      .style("font-size", "24px")
      .text("Mapa Mental Carregando...");
    
    console.log('SVG básico renderizado');
    
    // Dimensões dos retângulos aumentadas para melhor visibilidade
    const nodeWidth = 140;
    const nodeHeight = 70;
    const centralNodeWidth = 160;
    const centralNodeHeight = 80;
    
    // Criar dados para os nós visíveis com layout de mapa mental aprimorado
    const nodes = visibleNodes.map((nodeId, index) => {
      const position = positions[nodeId];
      let x, y, level = 0, width = nodeWidth, height = nodeHeight;
      
      if (viewMode === 'grid') {
        // Layout em grade otimizado
        const cols = Math.ceil(Math.sqrt(visibleNodes.length));
        const cellWidth = 900 / cols;
        const cellHeight = 600 / cols;
        
        const col = index % cols;
        const row = Math.floor(index / cols);
        
        x = cellWidth * col + (cellWidth - nodeWidth) / 2;
        y = cellHeight * row + (cellHeight - nodeHeight) / 2;
      } else {
        // Layout de mapa mental com sistema anti-sobreposição avançado
        if (nodeId === selectedPositionId) {
          // Posição central
          x = (900 - centralNodeWidth) / 2;
          y = (600 - centralNodeHeight) / 2;
          level = 0;
          width = centralNodeWidth;
          height = centralNodeHeight;
        } else {
          // Posições radiais baseadas em compatibilidade e área
          const connections = getSmartConnections(selectedPositionId);
          const connectionData = connections.find(c => c.id === nodeId);
          
          if (connectionData) {
            // Agrupar por pillar para melhor organização
            const pillarGroups = {
              'Tecnologia': { startAngle: 0, endAngle: Math.PI * 0.4, radius: 180 },
              'Produto': { startAngle: Math.PI * 0.4, endAngle: Math.PI * 0.8, radius: 160 },
              'Dados': { startAngle: Math.PI * 0.8, endAngle: Math.PI * 1.2, radius: 170 },
              'Gestão': { startAngle: Math.PI * 1.2, endAngle: Math.PI * 1.6, radius: 150 },
              'Financeiro': { startAngle: Math.PI * 1.6, endAngle: Math.PI * 2.0, radius: 190 },
              'Recursos Humanos': { startAngle: Math.PI * 0.0, endAngle: Math.PI * 0.4, radius: 210 }
            };
            
            const pillarConfig = pillarGroups[position.pillar] || pillarGroups['Gestão'];
            const nodesInPillar = connections.filter(c => positions[c.id].pillar === position.pillar);
            const indexInPillar = nodesInPillar.findIndex(c => c.id === nodeId);
            
            // Calcular ângulo específico dentro do setor
            const angleRange = pillarConfig.endAngle - pillarConfig.startAngle;
            const angleStep = angleRange / Math.max(nodesInPillar.length, 1);
            const angle = pillarConfig.startAngle + (angleStep * indexInPillar) + (angleStep / 2);
            
            // Ajustar radius baseado na compatibilidade
            let radius = pillarConfig.radius;
            if (connectionData.transitionType === 'internal') {
              radius *= 0.8; // Conexões internas mais próximas
              level = 1;
            } else {
              radius *= 1.1; // Conexões cross-functional mais distantes
              level = 2;
            }
            
            // Posição base
            const baseX = 450 + radius * Math.cos(angle);
            const baseY = 300 + radius * Math.sin(angle);
            
            x = baseX - nodeWidth / 2;
            y = baseY - nodeHeight / 2;
            
          } else {
            // Fallback para nós sem conexão - distribuir em círculo externo
            const angle = (index * 2 * Math.PI) / visibleNodes.length;
            const radius = 220;
            x = 450 + radius * Math.cos(angle) - nodeWidth / 2;
            y = 300 + radius * Math.sin(angle) - nodeHeight / 2;
            level = 3;
          }
        }
      }
      
      return {
        id: nodeId,
        x: x,
        y: y,
        width: width,
        height: height,
        level: level,
        centerX: x + width / 2,
        centerY: y + height / 2,
        ...position
      };
    });
    
    // Sistema anti-sobreposição aprimorado
    if (viewMode === 'network' && nodes.length > 1) {
      const minDistance = 160; // Distância mínima aumentada entre nós
      let maxIterations = 50;
      let iteration = 0;
      
      while (iteration < maxIterations) {
        let hasOverlap = false;
        
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const nodeA = nodes[i];
            const nodeB = nodes[j];
            
            // Pular se um deles é o nó central
            if (nodeA.id === selectedPositionId || nodeB.id === selectedPositionId) continue;
            
            const dx = nodeA.centerX - nodeB.centerX;
            const dy = nodeA.centerY - nodeB.centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance) {
              hasOverlap = true;
              
              // Calcular vetor de afastamento
              const overlap = minDistance - distance;
              const angle = Math.atan2(dy, dx);
              
              // Mover ambos os nós para lados opostos
              const moveDistance = overlap / 2 + 10;
              
              nodeA.x += Math.cos(angle) * moveDistance;
              nodeA.y += Math.sin(angle) * moveDistance;
              nodeA.centerX = nodeA.x + nodeA.width / 2;
              nodeA.centerY = nodeA.y + nodeA.height / 2;
              
              nodeB.x -= Math.cos(angle) * moveDistance;
              nodeB.y -= Math.sin(angle) * moveDistance;
              nodeB.centerX = nodeB.x + nodeB.width / 2;
              nodeB.centerY = nodeB.y + nodeB.height / 2;
              
              // Manter dentro dos limites da tela
              nodeA.x = Math.max(10, Math.min(900 - nodeA.width - 10, nodeA.x));
              nodeA.y = Math.max(10, Math.min(600 - nodeA.height - 10, nodeA.y));
              nodeA.centerX = nodeA.x + nodeA.width / 2;
              nodeA.centerY = nodeA.y + nodeA.height / 2;
              
              nodeB.x = Math.max(10, Math.min(900 - nodeB.width - 10, nodeB.x));
              nodeB.y = Math.max(10, Math.min(600 - nodeB.height - 10, nodeB.y));
              nodeB.centerX = nodeB.x + nodeB.width / 2;
              nodeB.centerY = nodeB.y + nodeB.height / 2;
            }
          }
        }
        
        if (!hasOverlap) break;
        iteration++;
      }
    }
    
    console.log('Nós visíveis:', nodes);
    
    // Criar links inteligentes para o mapa mental
    const links = [];
    const centralNode = nodes.find(n => n.id === selectedPositionId);
    
    if (centralNode && viewMode === 'network') {
      const connections = getSmartConnections(selectedPositionId);
      
      connections.forEach(connection => {
        const targetNode = nodes.find(n => n.id === connection.id);
        if (targetNode) {
          links.push({
            source: centralNode,
            target: targetNode,
            connection: connection,
            type: connection.transitionType
          });
        }
      });
    } else if (viewMode === 'grid') {
      // Links originais para modo grade
      nodes.forEach(sourceNode => {
        if (sourceNode.connections) {
          sourceNode.connections.forEach(targetId => {
            const targetNode = nodes.find(n => n.id === targetId);
            if (targetNode) {
              links.push({
                source: sourceNode,
                target: targetNode,
                type: 'original'
              });
            }
          });
        }
      });
    }
    
    console.log('Links criados:', links);
    
    // Definir marcadores de seta
    svg.append("defs").selectAll("marker")
      .data(["internal", "cross-functional", "original"])
      .enter().append("marker")
      .attr("id", d => `arrow-${d}`)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 15)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", d => {
        switch(d) {
          case 'internal': return '#60A5FA'; // Azul claro para mesma área
          case 'cross-functional': return '#A78BFA'; // Roxo claro para mudança de área
          default: return '#93C5FD'; // Azul padrão
        }
      })
      .attr("opacity", 0.8);
    
    // Renderizar links com setas e estilos diferenciados
    if (links.length > 0) {
      svg.selectAll(".link")
        .data(links)
        .enter()
        .append("line")
        .attr("class", "link")
        .attr("x1", d => d.source.centerX)
        .attr("y1", d => d.source.centerY)
        .attr("x2", d => d.target.centerX)
        .attr("y2", d => d.target.centerY)
        .attr("stroke", d => {
          if (d.type === 'internal') return '#60A5FA'; // Azul claro para mesma área
          if (d.type === 'cross-functional') return '#A78BFA'; // Roxo claro para mudança de área
          return '#93C5FD'; // Azul padrão
        })
        .attr("stroke-width", d => {
          if (d.connection) {
            // Largura baseada na compatibilidade
            return Math.max(2, (d.connection.score / 100) * 4);
          }
          return 2;
        })
        .attr("opacity", d => {
          if (d.type === 'cross-functional') return 0.5; // Linhas cross-functional mais sutis
          return 0.7;
        })
        .attr("stroke-dasharray", d => {
          if (d.type === 'cross-functional') return "8,4"; // Linha tracejada para mudança de área
          return "none";
        })
        .attr("marker-end", d => `url(#arrow-${d.type})`);
    }
    
    // Renderizar nós como retângulos
    const node = svg.selectAll(".node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.x},${d.y})`)
      .style("cursor", "pointer");
    
    // Retângulos com cores distintas por área e cantos arredondados
    node.append("rect")
      .attr("width", d => d.width)
      .attr("height", d => d.height)
      .attr("rx", 10) // Cantos mais arredondados
      .attr("ry", 10)
      .attr("fill", d => {
        // Sistema de cores diferenciadas por área
        const colorMap = {
          'Tecnologia': '#1E40AF',        // Azul forte - TI
          'Produto': '#7C3AED',           // Roxo - Produto
          'Dados': '#DC2626',             // Vermelho - Dados
          'Gestão': '#059669',            // Verde - Gestão
          'Financeiro': '#D97706',        // Laranja - Financeiro
          'Recursos Humanos': '#BE185D'   // Rosa/Magenta - RH
        };
        return colorMap[d.pillar] || '#6B7280'; // Cinza como fallback
      })
      .attr("stroke", d => {
        if (d.id === selectedPositionId) return "#FBBF24"; // Dourado para selecionado
        return "#E5E7EB"; // Cinza claro para borda
      })
      .attr("stroke-width", d => {
        if (d.id === selectedPositionId) return 3;
        return 1.5;
      })
      .attr("filter", d => {
        if (d.id === selectedPositionId) return "drop-shadow(0 6px 16px rgba(251,191,36,0.4))";
        return "drop-shadow(0 3px 8px rgba(0,0,0,0.15))";
      });
    
    // Texto com melhor contraste e quebra de linha
    node.append("text")
      .attr("x", d => d.width / 2)
      .attr("y", d => d.height / 2)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", "white")
      .style("font-size", d => {
        if (d.id === selectedPositionId) return "11px";
        return "9px";
      })
      .style("font-weight", d => d.id === selectedPositionId ? "700" : "600")
      .style("pointer-events", "none")
      .each(function(d) {
        const words = d.title.split(' ');
        const textElement = d3.select(this);
        const lineHeight = 12;
        const startY = d.height / 2 - ((words.length - 1) * lineHeight) / 2;
        
        words.forEach((word, i) => {
          textElement.append("tspan")
            .attr("x", d.width / 2)
            .attr("y", startY + i * lineHeight)
            .text(word);
        });
      });
    
    // Adicionar indicador de área/pillar no canto
    node.append("text")
      .attr("x", d => d.width - 5)
      .attr("y", 12)
      .attr("text-anchor", "end")
      .attr("fill", "rgba(255,255,255,0.7)")
      .style("font-size", "8px")
      .style("font-weight", "500")
      .style("pointer-events", "none")
      .text(d => d.pillar.substring(0, 4).toUpperCase());
    
    // Adicionar indicador de salário no canto inferior
    node.append("text")
      .attr("x", 5)
      .attr("y", d => d.height - 5)
      .attr("text-anchor", "start")
      .attr("fill", "rgba(255,255,255,0.8)")
      .style("font-size", "7px")
      .style("font-weight", "500")
      .style("pointer-events", "none")
      .text(d => {
        if (d.salaryMin && d.salaryMax) {
          return `${d.salaryMin/1000}k-${d.salaryMax/1000}k`;
        }
        return d.salary.split(' ')[1] || '';
      });
    
    // Adicionar indicador de nível central para a posição atual
    if (centralNode && viewMode === 'network') {
      const centralGroup = svg.select(`g[transform="translate(${centralNode.x},${centralNode.y})"]`);
      
      centralGroup.append("text")
        .attr("x", centralNode.width / 2)
        .attr("y", centralNode.height + 20)
        .attr("text-anchor", "middle")
        .attr("fill", "#64748B")
        .style("font-size", "10px")
        .style("font-weight", "600")
        .text("POSIÇÃO ATUAL");
    }
    
    // Adicionar legenda de cores compacta (acordeon)
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", "translate(20, 20)");
    
    const legendData = [
      { pillar: 'Tecnologia', color: '#1E40AF', icon: '💻' },
      { pillar: 'Produto', color: '#7C3AED', icon: '🎯' },
      { pillar: 'Dados', color: '#DC2626', icon: '📊' },
      { pillar: 'Gestão', color: '#059669', icon: '👥' },
      { pillar: 'Financeiro', color: '#D97706', icon: '💰' },
      { pillar: 'Recursos Humanos', color: '#BE185D', icon: '👤' }
    ];
    
    // Botão toggle da legenda (sempre visível)
    const legendToggle = legend.append("g")
      .attr("class", "legend-toggle")
      .style("cursor", "pointer");
    
    // Fundo do botão toggle
    legendToggle.append("rect")
      .attr("x", -5)
      .attr("y", -5)
      .attr("width", 120)
      .attr("height", 30)
      .attr("rx", 6)
      .attr("fill", "rgba(255, 255, 255, 0.95)")
      .attr("stroke", "#E5E7EB")
      .attr("stroke-width", 1)
      .attr("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.1))");
    
    // Ícone e texto do toggle
    legendToggle.append("text")
      .attr("x", 8)
      .attr("y", 8)
      .attr("dy", "0.5em")
      .style("font-size", "12px")
      .text("🎨");
    
    legendToggle.append("text")
      .attr("x", 25)
      .attr("y", 8)
      .attr("dy", "0.5em")
      .attr("fill", "#374151")
      .style("font-size", "11px")
      .style("font-weight", "600")
      .text("Áreas");
    
    // Seta indicando se está expandido
    const toggleArrow = legendToggle.append("text")
      .attr("x", 100)
      .attr("y", 8)
      .attr("dy", "0.5em")
      .attr("fill", "#6B7280")
      .style("font-size", "10px")
      .style("font-weight", "bold")
      .text("▼");
    
    // Container dos itens da legenda (inicialmente oculto)
    const legendItems = legend.append("g")
      .attr("class", "legend-items")
      .attr("transform", "translate(0, 40)")
      .style("opacity", "0")
      .style("pointer-events", "none");
    
    // Fundo dos itens
    legendItems.append("rect")
      .attr("x", -5)
      .attr("y", -5)
      .attr("width", 140)
      .attr("height", legendData.length * 22 + 10)
      .attr("rx", 6)
      .attr("fill", "rgba(255, 255, 255, 0.95)")
      .attr("stroke", "#E5E7EB")
      .attr("stroke-width", 1)
      .attr("filter", "drop-shadow(0 2px 6px rgba(0,0,0,0.1))");
    
    // Itens individuais da legenda
    const legendItemGroups = legendItems.selectAll(".legend-item")
      .data(legendData)
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0, ${i * 22})`);
    
    // Círculos coloridos
    legendItemGroups.append("circle")
      .attr("cx", 8)
      .attr("cy", 8)
      .attr("r", 5)
      .attr("fill", d => d.color);
    
    // Ícones
    legendItemGroups.append("text")
      .attr("x", 20)
      .attr("y", 6)
      .attr("dy", "0.5em")
      .style("font-size", "11px")
      .text(d => d.icon);
    
    // Texto das áreas
    legendItemGroups.append("text")
      .attr("x", 35)
      .attr("y", 6)
      .attr("dy", "0.5em")
      .attr("fill", "#374151")
      .style("font-size", "10px")
      .style("font-weight", "500")
      .text(d => d.pillar.length > 10 ? d.pillar.substring(0, 8) + "..." : d.pillar);
    
    // Funcionalidade de toggle
    let legendExpanded = false;
    legendToggle.on("click", function() {
      legendExpanded = !legendExpanded;
      
      if (legendExpanded) {
        // Expandir
        legendItems
          .transition()
          .duration(300)
          .style("opacity", "1")
          .style("pointer-events", "auto");
        toggleArrow.text("▲");
      } else {
        // Recolher
        legendItems
          .transition()
          .duration(300)
          .style("opacity", "0")
          .style("pointer-events", "none");
        toggleArrow.text("▼");
      }
    });
    
    // Adicionar evento de clique e hover
    node.on("click", function(event, d) {
      event.stopPropagation();
      console.log('Clique detectado no nó:', d.id);
      handleNodeClick(d);
    })
    .on("mouseenter", function(event, d) {
      d3.select(this).select("rect")
        .transition()
        .duration(200)
        .attr("transform", "scale(1.05)")
        .attr("stroke-width", d.id === selectedPositionId ? 4 : 2);
    })
    .on("mouseleave", function(event, d) {
      d3.select(this).select("rect")
        .transition()
        .duration(200)
        .attr("transform", "scale(1)")
        .attr("stroke-width", d.id === selectedPositionId ? 3 : 1);
    });
      
    
  }, [visibleNodes, selectedPositionId, viewMode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mapa de Trilhas de Carreira</h1>
              <p className="text-gray-600">Sistema Interativo de Exploração de Carreiras</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Briefcase className="w-4 h-4" />
                <span>{Object.keys(positions).length} Posições</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <TrendingUp className="w-4 h-4" />
                <span>{visibleNodes.length} Visíveis</span>
              </div>
              {selectedPosition && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">💻</span>
                      <span className="text-sm font-medium text-blue-800">Tecnologia</span>
                    </div>
                    <span className="text-xs text-blue-600">{Object.values(positions).filter(p => p.pillar === 'Tecnologia').length} posições</span>
                  </div>
                  
                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">🎯</span>
                      <span className="text-sm font-medium text-purple-800">Produto</span>
                    </div>
                    <span className="text-xs text-purple-600">{Object.values(positions).filter(p => p.pillar === 'Produto').length} posições</span>
                  </div>
                  
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">📊</span>
                      <span className="text-sm font-medium text-red-800">Dados</span>
                    </div>
                    <span className="text-xs text-red-600">{Object.values(positions).filter(p => p.pillar === 'Dados').length} posições</span>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">👥</span>
                      <span className="text-sm font-medium text-green-800">Gestão</span>
                    </div>
                    <span className="text-xs text-green-600">{Object.values(positions).filter(p => p.pillar === 'Gestão').length} posições</span>
                  </div>
                  
                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">💰</span>
                      <span className="text-sm font-medium text-orange-800">Financeiro</span>
                    </div>
                    <span className="text-xs text-orange-600">{Object.values(positions).filter(p => p.pillar === 'Financeiro').length} posições</span>
                  </div>
                  
                  <div className="bg-pink-50 p-3 rounded-lg border border-pink-200">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">👤</span>
                      <span className="text-sm font-medium text-pink-800">RH</span>
                    </div>
                    <span className="text-xs text-pink-600">{Object.values(positions).filter(p => p.pillar === 'Recursos Humanos').length} posições</span>
                  </div>
                </div>
              )}
              
              {selectedPosition && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <DollarSign className="w-4 h-4" />
                  <span>{getSmartConnections(selectedPositionId).length} Conexões Inteligentes</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Sistema de Busca */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por cargo, descrição, área ou nível..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  handleSearchPositions(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setViewMode(viewMode === 'network' ? 'grid' : 'network')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {viewMode === 'network' ? '⊞ Grade' : '🧠 Mapa Mental'}
              </button>
              <button 
                onClick={handleShowAll}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                👁️ Mostrar Todos
              </button>
              <button 
                onClick={handleReset}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                ↻ Resetar
              </button>
            </div>
          </div>

          {/* Resultados da busca */}
          {showSearch && searchResults.length > 0 && (
            <div className="mt-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">
                Resultados da Busca ({searchResults.length})
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setSelectedPositionId(result.key);
                      if (!visibleNodes.includes(result.key)) {
                        setVisibleNodes([...visibleNodes, result.key]);
                      }
                      setShowSearch(false);
                      setSearchTerm('');
                    }}
                    className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer border-l-4 transition-colors"
                    style={{ borderLeftColor: result.color }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">{result.title}</h4>
                        <p className="text-xs text-gray-600">{result.pillar} • {result.level}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-green-600">{result.salary}</p>
                        {result.compatibility && (
                          <div className={`text-xs px-2 py-1 rounded-full mt-1 ${
                            result.compatibility >= 70 ? 'bg-green-100 text-green-700' :
                            result.compatibility >= 50 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {result.compatibility}% compatível
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Mapa de Rede */}
          <div className="w-full">
            <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    {viewMode === 'network' ? 'Mapa Mental de Carreira' : 'Visualização em Grade'}
                  </h2>
                  <p className="text-blue-100">
                    {viewMode === 'network' 
                      ? 'Posição central com ramificações inteligentes baseadas em compatibilidade' 
                      : 'Visualização completa de todas as posições'
                    }
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="text-sm bg-white bg-opacity-20 px-2 py-1 rounded">
                    {visibleNodes.length} nó(s) | Modo: {viewMode === 'network' ? 'Mapa Mental' : 'Grade'}
                  </span>
                  <span className="text-sm bg-white bg-opacity-20 px-2 py-1 rounded">
                    Central: {selectedPosition?.title || 'Nenhum'}
                  </span>
                </div>
              </div>
              <div className="relative overflow-hidden">
                <svg 
                  ref={svgRef} 
                  width="100%" 
                  height="600" 
                  viewBox="0 0 900 600" 
                  className="w-full" 
                  style={{ 
                    minHeight: '600px', 
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' 
                  }}
                />
                
                {/* Legenda do Mapa Mental */}
                {viewMode === 'network' && (
                  <div className="absolute top-4 right-4 bg-white bg-opacity-90 rounded-lg p-3 shadow-lg">
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Legenda do Mapa Mental</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-600 border-2 border-blue-600"></div>
                        <span>Posição Central (Atual)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-blue-400"></div>
                        <span>Mesma Área (Próximo)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-purple-400" style={{backgroundImage: 'repeating-linear-gradient(to right, #A78BFA 0, #A78BFA 3px, transparent 3px, transparent 6px)'}}></div>
                        <span>Mudança de Área (Distante)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg width="16" height="8" viewBox="0 0 16 8">
                          <line x1="0" y1="4" x2="12" y2="4" stroke="#60A5FA" strokeWidth="2"/>
                          <path d="M12,2 L16,4 L12,6" fill="#60A5FA"/>
                        </svg>
                        <span>Fluxo de Progressão</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Painel de Detalhes */}
          <div className="w-full">
            <div className="bg-white rounded-xl shadow-lg border">
              <div className="p-4 bg-gradient-to-r from-gray-800 to-gray-700 text-white rounded-t-xl">
                <h2 className="text-lg font-semibold flex items-center">
                  <Info className="w-5 h-5 mr-2" />
                  Detalhes da Posição
                </h2>
              </div>
              
              <div className="p-6">
                {selectedPosition ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Informações Básicas */}
                    <div className="space-y-4">
                      <div>
                        <div className="w-12 h-12 rounded-full mb-3 flex items-center justify-center text-white font-bold text-lg" 
                             style={{ backgroundColor: selectedPosition.color }}>
                          {selectedPosition.title.charAt(0)}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{selectedPosition.title}</h3>
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
                            <span className="font-medium">{selectedPosition.pillar}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Descrição</h4>
                        <p className="text-gray-700 text-sm leading-relaxed">{selectedPosition.description}</p>
                      </div>
                      
                      {selectedPosition.requirements && selectedPosition.requirements.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Requisitos</h4>
                          <ul className="space-y-1">
                            {selectedPosition.requirements.slice(0, 3).map((req, index) => (
                              <li key={index} className="text-sm text-gray-700 flex items-start">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                {req}
                              </li>
                            ))}
                            {selectedPosition.requirements.length > 3 && (
                              <li className="text-sm text-gray-500 italic">
                                +{selectedPosition.requirements.length - 3} requisitos adicionais
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                      
                      {/* Estatísticas Rápidas */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h4 className="font-semibold text-gray-900 mb-2">Informações Rápidas</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-white p-2 rounded text-center">
                            <div className="font-semibold text-blue-600">{selectedPosition.salaryMin ? `R$ ${selectedPosition.salaryMin.toLocaleString()}` : 'N/A'}</div>
                            <div className="text-gray-500">Salário Min</div>
                          </div>
                          <div className="bg-white p-2 rounded text-center">
                            <div className="font-semibold text-green-600">{selectedPosition.salaryMax ? `R$ ${selectedPosition.salaryMax.toLocaleString()}` : 'N/A'}</div>
                            <div className="text-gray-500">Salário Max</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Conexões Inteligentes */}
                    <div className="lg:col-span-2">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Conexões Inteligentes de Carreira</h4>
                        <p className="text-xs text-gray-600 mb-3">
                          Baseado em compatibilidade salarial e transferência de habilidades
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {getSmartConnections(selectedPositionId).slice(0, 8).map((connection, index) => {
                            const isVisible = visibleNodes.includes(connection.id);
                            
                            return (
                              <div 
                                key={connection.id} 
                                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                  isVisible ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                                }`}
                                onClick={() => handleNodeClick({ id: connection.id })}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    <div 
                                      className="w-3 h-3 rounded-full" 
                                      style={{ backgroundColor: connection.position.color }}
                                    />
                                    <span className="font-medium text-sm text-gray-900">
                                      {connection.position.title}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                                      connection.score >= 70 ? 'bg-green-100 text-green-700' :
                                      connection.score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-orange-100 text-orange-700'
                                    }`}>
                                      {connection.score}%
                                    </span>
                                    {isVisible && (
                                      <span className="text-xs text-green-600">✓</span>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="space-y-1">
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    connection.transitionType === 'internal' 
                                      ? 'bg-blue-100 text-blue-700' 
                                      : 'bg-purple-100 text-purple-700'
                                  }`}>
                                    {connection.transitionType === 'internal' ? 'Mesma Área' : 'Mudança de Área'}
                                  </span>
                                  
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-600">
                                      {connection.position.pillar} • {connection.position.level}
                                    </span>
                                    <span className={`font-medium ${
                                      connection.salaryDifference > 0 ? 'text-green-600' : 
                                      connection.salaryDifference < 0 ? 'text-red-600' : 'text-gray-600'
                                    }`}>
                                      {connection.salaryDifference > 0 ? '+' : ''}
                                      {connection.salaryDifference === 0 ? 'Mesmo nível' : 
                                       `R$ ${Math.abs(connection.salaryDifference).toLocaleString()}`}
                                    </span>
                                  </div>
                                  
                                  {connection.salaryCompatible && (
                                    <div className="flex items-center">
                                      <div className="w-1 h-1 bg-green-500 rounded-full mr-1" />
                                      <span className="text-xs text-green-600">Salário compatível</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Briefcase className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">Clique em uma posição para ver os detalhes</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerMindMapFixed;
