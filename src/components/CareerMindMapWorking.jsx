import React, { useState, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { Search, Info, Briefcase, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { positions } from '../data/positions';

const CareerMindMapWorking = () => {
  const [selectedPositionId, setSelectedPositionId] = useState('dev-net');
  const [visibleNodes, setVisibleNodes] = useState(['dev-net']);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [visitedPositions, setVisitedPositions] = useState(['dev-net']);
  const svgRef = useRef();
  
  const selectedPosition = selectedPositionId ? positions[selectedPositionId] : null;

  // Função para alterar posição e gerenciar histórico
  const changePosition = (newPositionId) => {
    if (newPositionId !== selectedPositionId) {
      setSelectedPositionId(newPositionId);
      
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
      
      // Calcular e aplicar conexões imediatamente
      const smartConnections = getSmartConnections(newPositionId);
      const validConnectionIds = smartConnections.map(c => c.id);
      
      // Incluir apenas conexões válidas, sem adicionar todo o histórico automaticamente
      const newVisibleNodes = [newPositionId, ...validConnectionIds];
      const uniqueNodes = [...new Set(newVisibleNodes)];
      setVisibleNodes(uniqueNodes);
    } else {
      // Mesmo quando clicamos na mesma posição, garantir que todas as conexões estejam visíveis
      const smartConnections = getSmartConnections(newPositionId);
      
      if (smartConnections.length > 0) {
        const validConnectionIds = smartConnections.map(c => c.id);
        setVisibleNodes(prev => {
          const newNodes = [newPositionId, ...validConnectionIds];
          const uniqueNodes = [...new Set(newNodes)];
          return uniqueNodes;
        });
      }
    }
  };

  // Função para calcular conexões inteligentes
  const getSmartConnections = (positionId) => {
    const currentPos = positions[positionId];
    if (!currentPos) return [];

    const connections = [];
    const currentSalaryMin = currentPos.salaryMin || 0;
    const currentSalaryMax = currentPos.salaryMax || 0;
    const currentSalaryAvg = (currentSalaryMin + currentSalaryMax) / 2;

    const salaryFlexibility = 0.3;
    const minAcceptableSalary = currentSalaryAvg * (1 - salaryFlexibility);
    const maxAcceptableSalary = currentSalaryAvg * (1 + salaryFlexibility * 1.5);

    Object.entries(positions).forEach(([targetId, targetPos]) => {
      if (targetId === positionId) return;

      const targetSalaryMin = targetPos.salaryMin || 0;
      const targetSalaryMax = targetPos.salaryMax || 0;
      const targetSalaryAvg = (targetSalaryMin + targetSalaryMax) / 2;

      let compatibilityScore = 0;
      let reasons = [];

      // Score salarial
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
        compatibilityScore += 10;
        reasons.push('Potencial de crescimento');
      }

      // Score por área
      if (currentPos.pillar === targetPos.pillar) {
        compatibilityScore += 30;
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
        
        if (relatedAreas[currentPos.pillar]?.includes(targetPos.pillar)) {
          compatibilityScore += 18;
          reasons.push('Área relacionada');
        } else {
          compatibilityScore += 5;
          reasons.push('Nova área');
        }
      }

      // Score por nível
      const levelScore = {
        'Júnior': 1, 'Pleno': 2, 'Sênior': 3, 'Especialista': 3,
        'Coordenador': 4, 'Gerente': 5, 'Diretor': 6, 'VP': 7, 'C-Level': 8
      };
      
      const currentLevel = levelScore[currentPos.level] || 2;
      const targetLevel = levelScore[targetPos.level] || 2;
      const levelDiff = targetLevel - currentLevel;
      
      if (levelDiff === 0) {
        compatibilityScore += 20;
        reasons.push('Mesmo nível');
      } else if (levelDiff === 1) {
        compatibilityScore += 25;
        reasons.push('Progressão natural');
      } else if (levelDiff === 2) {
        compatibilityScore += 15;
        reasons.push('Grande crescimento');
      }

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

    return connections.sort((a, b) => b.score - a.score).slice(0, 12);
  };

  const handleNodeClick = (nodeData) => {
    // Garantir que o nó esteja visível antes de mudar posição
    if (!visibleNodes.includes(nodeData.id)) {
      setVisibleNodes(prev => [...prev, nodeData.id]);
    }
    changePosition(nodeData.id);
  };

  const handleReset = () => {
    setSelectedPositionId('dev-net');
    setVisibleNodes(['dev-net']);
    setSearchTerm('');
    setSearchResults([]);
    setShowSearch(false);
    setVisitedPositions(['dev-net']);
  };

  const handleShowAll = () => {
    // Mostrar apenas posições com conexões válidas
    const allValidConnections = new Set();
    
    // Obter todas as conexões válidas de todas as posições
    Object.keys(positions).forEach(positionId => {
      const connections = getSmartConnections(positionId);
      connections.forEach(conn => {
        allValidConnections.add(conn.id);
        allValidConnections.add(positionId); // Incluir a posição que tem conexões
      });
    });
    
    // Garantir que a posição atual esteja incluída
    allValidConnections.add(selectedPositionId);
    
    setVisibleNodes(Array.from(allValidConnections));
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

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    
    const width = 1000;
    const height = 700;
    const mapAreaWidth = width; // Usar toda a largura agora
    
    // Criar dados para os nós visíveis com layout inteligente
    const nodes = visibleNodes.map((nodeId, index) => {
      const position = positions[nodeId];
      
      if (!position) {
        return null;
      }
      
      // Layout baseado em mapa mental com nó central
      let x, y;
      
      if (nodeId === selectedPositionId) {
        x = (mapAreaWidth - 160) / 2;
        y = (height - 80) / 2;
      } else {
        // Verificar se este nó tem conexão inteligente com o central
        const connections = getSmartConnections(selectedPositionId);
        const connectionData = connections.find(c => c.id === nodeId);
        
        if (connectionData) {
          const pillarAngles = {
            'Tecnologia': { startAngle: 0, endAngle: Math.PI * 0.33 },
            'Produto': { startAngle: Math.PI * 0.33, endAngle: Math.PI * 0.66 },
            'Dados': { startAngle: Math.PI * 0.66, endAngle: Math.PI },
            'Gestão': { startAngle: Math.PI, endAngle: Math.PI * 1.33 },
            'Financeiro': { startAngle: Math.PI * 1.33, endAngle: Math.PI * 1.66 },
            'Recursos Humanos': { startAngle: Math.PI * 1.66, endAngle: Math.PI * 2 }
          };
          
          const pillarConfig = pillarAngles[position.pillar] || pillarAngles['Tecnologia'];
          
          const sameAreaNodes = connections.filter(c => positions[c.id].pillar === position.pillar);
          const indexInArea = sameAreaNodes.findIndex(c => c.id === nodeId);
          
          const angleRange = pillarConfig.endAngle - pillarConfig.startAngle;
          const angleStep = angleRange / Math.max(sameAreaNodes.length, 1);
          let angle = pillarConfig.startAngle + (angleStep * indexInArea) + (angleStep / 2);
          
          // Remover variação aleatória para posicionamento determinístico
          // const angleVariation = (Math.random() - 0.5) * 0.2;
          // angle += angleVariation;
          
          let radius = 240;
          if (connectionData.transitionType === 'internal') {
            radius = 200;
          } else {
            radius = 280;
          }
          
          radius += (connectionData.score / 100) * 40;
          
          const areaOffset = indexInArea * 25;
          radius += areaOffset;
          
          x = mapAreaWidth / 2 + radius * Math.cos(angle) - 70;
          y = height / 2 + radius * Math.sin(angle) - 35;
        } else {
          const unconnectedIndex = index - 1;
          const totalUnconnected = visibleNodes.length - 1;
          const angle = (unconnectedIndex * 2 * Math.PI) / Math.max(totalUnconnected, 1);
          const radius = 320;
          
          // Remover variação aleatória para posicionamento determinístico
          // const radiusVariation = (Math.random() - 0.5) * 40;
          // const finalRadius = radius + radiusVariation;
          const finalRadius = radius;
          
          x = mapAreaWidth / 2 + finalRadius * Math.cos(angle) - 70;
          y = height / 2 + finalRadius * Math.sin(angle) - 35;
        }
      }
      
      return {
        id: nodeId,
        x: Math.max(10, Math.min(mapAreaWidth - 150, x)),
        y: Math.max(10, Math.min(height - 80, y)),
        width: nodeId === selectedPositionId ? 160 : 140, 
        height: nodeId === selectedPositionId ? 80 : 70,
        ...position
      };
    }).filter(Boolean);

    // Função para detectar colisões entre nós
    const detectCollision = (node1, node2) => {
      const margin = 25; // Aumentar margem para evitar sobreposições
      return (
        node1.x < node2.x + node2.width + margin &&
        node1.x + node1.width + margin > node2.x &&
        node1.y < node2.y + node2.height + margin &&
        node1.y + node1.height + margin > node2.y
      );
    };

    // Resolver colisões ajustando posições
    const resolveCollisions = (nodes) => {
      const maxIterations = 100; // Aumentar iterações
      let iteration = 0;
      
      while (iteration < maxIterations) {
        let hasCollision = false;
        
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const node1 = nodes[i];
            const node2 = nodes[j];
            
            if (detectCollision(node1, node2)) {
              hasCollision = true;
              
              if (node1.id === selectedPositionId) {
                // Nó central - empurrar o outro para longe
                const angle = Math.atan2(node2.y - node1.y, node2.x - node1.x);
                const distance = 220; // Distância mínima do centro
                node2.x = node1.x + node1.width/2 + distance * Math.cos(angle) - node2.width/2;
                node2.y = node1.y + node1.height/2 + distance * Math.sin(angle) - node2.height/2;
              } else if (node2.id === selectedPositionId) {
                // Nó central - empurrar o outro para longe
                const angle = Math.atan2(node1.y - node2.y, node1.x - node2.x);
                const distance = 220; // Distância mínima do centro
                node1.x = node2.x + node2.width/2 + distance * Math.cos(angle) - node1.width/2;
                node1.y = node2.y + node2.height/2 + distance * Math.sin(angle) - node1.height/2;
              } else {
                // Ambos são nós periféricos - empurrar para direções opostas
                const centerX = (node1.x + node2.x + node1.width + node2.width) / 2;
                const centerY = (node1.y + node2.y + node1.height + node2.height) / 2;
                
                const angle1 = Math.atan2(node1.y + node1.height/2 - centerY, node1.x + node1.width/2 - centerX);
                const angle2 = Math.atan2(node2.y + node2.height/2 - centerY, node2.x + node2.width/2 - centerX);
                
                const pushDistance = 60; // Aumentar distância de empurrão
                node1.x += pushDistance * Math.cos(angle1);
                node1.y += pushDistance * Math.sin(angle1);
                node2.x += pushDistance * Math.cos(angle2);
                node2.y += pushDistance * Math.sin(angle2);
              }
              
              // Manter dentro dos limites com margens maiores
              const minX = 15;
              const maxX = width - 165;
              const minY = 15; 
              const maxY = height - 95;
              
              node1.x = Math.max(minX, Math.min(maxX, node1.x));
              node1.y = Math.max(minY, Math.min(maxY, node1.y));
              node2.x = Math.max(minX, Math.min(maxX, node2.x));
              node2.y = Math.max(minY, Math.min(maxY, node2.y));
            }
          }
        }
        
        if (!hasCollision) break;
        iteration++;
      }
      
      // Verificação final para garantir que nenhum nó ficou na mesma posição
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const node1 = nodes[i];
          const node2 = nodes[j];
          
          // Se ainda estão muito próximos, fazer ajuste manual
          if (Math.abs(node1.x - node2.x) < 50 && Math.abs(node1.y - node2.y) < 50) {
            const offset = 80;
            if (j % 2 === 0) {
              node2.x += offset;
            } else {
              node2.y += offset;
            }
            
            // Revalidar limites
            node2.x = Math.max(15, Math.min(width - 165, node2.x));
            node2.y = Math.max(15, Math.min(height - 95, node2.y));
          }
        }
      }
      
      return nodes;
    };

    // Aplicar resolução de colisões
    const adjustedNodes = resolveCollisions([...nodes]);
    
    // Criar links baseados nas conexões inteligentes
    const links = [];
    const centralNode = adjustedNodes.find(n => n.id === selectedPositionId);
    
    if (centralNode) {
      const connections = getSmartConnections(selectedPositionId);
      
      connections.forEach(connection => {
        const targetNode = adjustedNodes.find(n => n.id === connection.id);
        if (targetNode) {
          links.push({
            source: centralNode,
            target: targetNode,
            connection: connection,
            type: connection.transitionType
          });
        }
      });
    }
    
    // Definir marcadores de seta para as conexões
    svg.append("defs").selectAll("marker")
      .data(["internal", "cross-functional"])
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
          default: return '#93C5FD';
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
        .attr("x1", d => d.source.x + d.source.width / 2)
        .attr("y1", d => d.source.y + d.source.height / 2)
        .attr("x2", d => d.target.x + d.target.width / 2)
        .attr("y2", d => d.target.y + d.target.height / 2)
        .attr("stroke", d => {
          if (d.type === 'internal') return '#60A5FA'; // Azul claro para mesma área
          if (d.type === 'cross-functional') return '#A78BFA'; // Roxo claro para mudança de área
          return '#93C5FD';
        })
        .attr("stroke-width", d => {
          if (d.connection) {
            // Largura baseada na compatibilidade (score)
            return Math.max(2, (d.connection.score / 100) * 5);
          }
          return 2;
        })
        .attr("opacity", d => {
          if (d.type === 'cross-functional') return 0.6; // Linhas cross-functional mais sutis
          return 0.8;
        })
        .attr("stroke-dasharray", d => {
          if (d.type === 'cross-functional') return "8,4"; // Linha tracejada para mudança de área
          return "none";
        })
        .attr("marker-end", d => `url(#arrow-${d.type})`);
    }
    
    // Cores por área
    const colorMap = {
      'Tecnologia': '#1E40AF',
      'Produto': '#7C3AED', 
      'Dados': '#DC2626',
      'Gestão': '#059669',
      'Financeiro': '#D97706',
      'Recursos Humanos': '#BE185D'
    };
    
    // Renderizar nós como retângulos
    const node = svg.selectAll(".node")
      .data(adjustedNodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.x},${d.y})`)
      .on("mouseover", function(event, d) {
        // Destacar conexões do nó
        svg.selectAll(".link")
          .transition()
          .duration(200)
          .style("opacity", link => 
            link.source.id === d.id || link.target.id === d.id ? 1 : 0.2
          );
        
        // Destacar outros nós conectados
        const connectedIds = links
          .filter(link => link.source.id === d.id || link.target.id === d.id)
          .map(link => link.source.id === d.id ? link.target.id : link.source.id);
        
        svg.selectAll(".node rect")
          .transition()
          .duration(200)
          .style("opacity", node => 
            node.id === d.id || connectedIds.includes(node.id) ? 1 : 0.4
          );
      })
      .on("mouseout", function() {
        // Restaurar opacidade normal
        svg.selectAll(".link")
          .transition()
          .duration(300)
          .style("opacity", 0.8);
        svg.selectAll(".node rect")
          .transition()
          .duration(300)
          .style("opacity", 1);
      });
    
    // Retângulos com área de clique expandida
    node.append("rect")
      .attr("width", d => d.width)
      .attr("height", d => d.height)
      .attr("rx", 10)
      .attr("ry", 10)
      .attr("fill", d => {
        return colorMap[d.pillar] || '#6B7280';
      })
      .attr("stroke", d => {
        if (d.id === selectedPositionId) return "#FBBF24";
        return "#E5E7EB";
      })
      .attr("stroke-width", d => {
        if (d.id === selectedPositionId) return 3;
        return 1.5;
      })
      .attr("filter", d => {
        if (d.id === selectedPositionId) return "drop-shadow(0 4px 8px rgba(251,191,36,0.3))";
        return "drop-shadow(0 2px 4px rgba(0,0,0,0.1))";
      })
      .style("cursor", "pointer")
      .on("click", function(event, d) {
        event.stopPropagation();
        changePosition(d.id);
      });
    
    // Texto principal
    node.append("text")
      .attr("x", d => d.width / 2)
      .attr("y", d => d.height / 2 - 5)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", "white")
      .style("font-size", "11px")
      .style("font-weight", "600")
      .style("pointer-events", "none")
      .text(d => {
        // Truncar título se muito longo
        return d.title.length > 20 ? d.title.substring(0, 18) + "..." : d.title;
      });
    
    // Área no canto
    node.append("text")
      .attr("x", d => d.width - 5)
      .attr("y", 12)
      .attr("text-anchor", "end")
      .attr("fill", "rgba(255,255,255,0.7)")
      .style("font-size", "8px")
      .style("font-weight", "500")
      .text(d => d.pillar.substring(0, 4).toUpperCase());
    
    // Salário no canto inferior
    node.append("text")
      .attr("x", 5)
      .attr("y", d => d.height - 5)
      .attr("text-anchor", "start")
      .attr("fill", "rgba(255,255,255,0.8)")
      .style("font-size", "7px")
      .style("font-weight", "500")
      .text(d => {
        if (d.salaryMin && d.salaryMax) {
          return `${d.salaryMin/1000}k-${d.salaryMax/1000}k`;
        }
        const salaryParts = d.salary.split(' ');
        return salaryParts[1] || d.salary;
      });
    
    // Adicionar área invisível de clique maior para facilitar interação
    node.append("rect")
      .attr("x", -5)
      .attr("y", -5)
      .attr("width", d => d.width + 10)
      .attr("height", d => d.height + 10)
      .attr("fill", "transparent")
      .style("cursor", "pointer")
      .on("click", function(event, d) {
        event.preventDefault();
        event.stopPropagation();
        changePosition(d.id);
      });
    
    // Eventos de hover - restaurados
    node.on("mouseenter", function(event, d) {
      d3.select(this).selectAll("rect")
        .filter(function() { return this.getAttribute("fill") !== "transparent"; })
        .transition()
        .duration(200)
        .attr("stroke-width", d.id === selectedPositionId ? 4 : 3);
    })
    .on("mouseleave", function(event, d) {
      d3.select(this).selectAll("rect")
        .filter(function() { return this.getAttribute("fill") !== "transparent"; })
        .transition()
        .duration(200)
        .attr("stroke-width", d.id === selectedPositionId ? 3 : 1.5);
    });
    
    // Adicionar texto central do nó selecionado
    if (visibleNodes.length > 1) {
      const centralNode = adjustedNodes.find(n => n.id === selectedPositionId);
      if (centralNode) {
        svg.append("text")
          .attr("x", centralNode.x + centralNode.width / 2)
          .attr("y", centralNode.y + centralNode.height + 25)
          .attr("text-anchor", "middle")
          .attr("fill", "#64748B")
          .style("font-size", "10px")
          .style("font-weight", "600")
          .text("POSIÇÃO ATUAL");
      }
    }
    
  }, [visibleNodes, selectedPositionId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pb-20">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mapa de Carreiras</h1>
              <p className="text-gray-600">Versão Funcional - Sistema Interativo</p>
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
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <DollarSign className="w-4 h-4" />
                  <span>{getSmartConnections(selectedPositionId).length} Conexões Inteligentes</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-purple-600">
                <TrendingUp className="w-4 h-4" />
                <span>Histórico: {visitedPositions.length} posições</span>
              </div>
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
                onClick={handleShowAll}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                👁️ Mostrar Válidos
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
                      changePosition(result.key);
                      // Adicionar apenas se tem conexão válida ou está no histórico
                      const hasValidConnection = getSmartConnections(selectedPositionId).some(c => c.id === result.key);
                      const isInHistory = visitedPositions.includes(result.key);
                      
                      if (hasValidConnection || isInHistory || result.key === selectedPositionId) {
                        if (!visibleNodes.includes(result.key)) {
                          setVisibleNodes([...visibleNodes, result.key]);
                        }
                      }
                      setShowSearch(false);
                      setSearchTerm('');
                    }}
                    className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer border-l-4 transition-colors border-blue-400"
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

          {/* Debug do Histórico removido */}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Histórico de Posições Visitadas */}
          {visitedPositions.length > 1 && (
            <div className="w-full">
              <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white">
                  <h2 className="text-lg font-semibold flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Histórico de Carreira
                  </h2>
                  <p className="text-gray-200 text-sm">Posições visitadas anteriormente</p>
                </div>
                <div className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {visitedPositions.slice(0, -1).map((positionId, index) => {
                      const position = positions[positionId];
                      if (!position) return null;
                      
                      const colorMap = {
                        'Tecnologia': '#1E40AF',
                        'Produto': '#7C3AED', 
                        'Dados': '#DC2626',
                        'Gestão': '#059669',
                        'Financeiro': '#D97706',
                        'Recursos Humanos': '#BE185D'
                      };
                      
                      return (
                        <div 
                          key={positionId}
                          onClick={() => changePosition(positionId)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                        >
                          <div 
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: colorMap[position.pillar] || '#6B7280' }}
                          ></div>
                          <span className="text-sm font-medium text-gray-700">
                            {position.title}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({position.pillar})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mapa SVG */}
          <div className="w-full">
            <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <h2 className="text-xl font-semibold">Mapa Mental de Carreira</h2>
                <p className="text-blue-100">Clique nos nós para explorar conexões</p>
              </div>
              <div className="relative">
                <svg 
                  ref={svgRef} 
                  width="100%" 
                  height="700" 
                  viewBox="0 0 1000 700" 
                  className="w-full" 
                  style={{ 
                    minHeight: '700px', 
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' 
                  }}
                />
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
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{selectedPosition.title}</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-gray-600">
                          <TrendingUp className="w-4 h-4 mr-2" />
                          <span>{selectedPosition.level}</span>
                        </div>
                        <div className="flex items-center text-green-600">
                          <DollarSign className="w-4 h-4 mr-2" />
                          <span>{selectedPosition.salary}</span>
                        </div>
                        <div className="flex items-center text-blue-600">
                          <Briefcase className="w-4 h-4 mr-2" />
                          <span>{selectedPosition.pillar}</span>
                        </div>
                      </div>
                      <div className="mt-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Descrição</h4>
                        <p className="text-gray-700 text-sm">{selectedPosition.description}</p>
                      </div>
                      
                      {selectedPosition.requirements && (
                        <div className="mt-4">
                          <h4 className="font-semibold text-gray-900 mb-2">Requisitos</h4>
                          <ul className="space-y-1">
                            {selectedPosition.requirements.slice(0, 5).map((req, index) => (
                              <li key={index} className="text-sm text-gray-700 flex items-start">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Conexões Inteligentes de Carreira</h4>
                      <p className="text-xs text-gray-600 mb-3">
                        Baseado em compatibilidade salarial e transferência de habilidades (todas as {getSmartConnections(selectedPositionId).length} conexões)
                      </p>
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {getSmartConnections(selectedPositionId).map((connection, index) => {
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
                                <span className="font-medium text-sm text-gray-900">
                                  {connection.position.title}
                                </span>
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
                                
                                <div className="text-xs text-gray-500">
                                  {connection.reasons.join(', ')}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Clique em uma posição para ver os detalhes</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Acordeão da Legenda */}
      {visibleNodes.length > 1 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
          <div className="max-w-7xl mx-auto px-6">
            <button
              onClick={() => setIsLegendOpen(!isLegendOpen)}
              className="w-full py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                <span className="font-medium text-gray-900">Legenda das Conexões</span>
                <span className="text-sm text-gray-500">
                  ({getSmartConnections(selectedPositionId).length} conexões ativas)
                </span>
              </div>
              <div className={`transform transition-transform ${isLegendOpen ? 'rotate-180' : ''}`}>
                ↓
              </div>
            </button>
            
            {isLegendOpen && (
              <div className="pb-4 border-t border-gray-100">
                <div className="py-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Tipos de Conexão */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Tipos de Conexão</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-0.5 bg-blue-500"></div>
                        <span className="text-sm text-gray-700">Mesma Área Profissional</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-0.5 bg-purple-500 border-dashed border border-purple-300"></div>
                        <span className="text-sm text-gray-700">Mudança de Área</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Indicadores Visuais */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Indicadores</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 border-2 border-yellow-500 rounded bg-yellow-50"></div>
                        <span className="text-sm text-gray-700">Posição Atual</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 border border-gray-300 rounded bg-gray-100 opacity-60"></div>
                        <span className="text-sm text-gray-700">Histórico (canto direito)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-0.5 bg-gray-400"></div>
                        <div className="w-4 h-0.5 bg-gray-600"></div>
                        <div className="w-5 h-0.5 bg-gray-800"></div>
                        <span className="text-sm text-gray-700">Espessura = Compatibilidade</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Áreas Profissionais */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Áreas Profissionais</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{backgroundColor: '#1E40AF'}}></div>
                        <span>💻</span>
                        <span>Tecnologia</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{backgroundColor: '#7C3AED'}}></div>
                        <span>🎯</span>
                        <span>Produto</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{backgroundColor: '#DC2626'}}></div>
                        <span>📊</span>
                        <span>Dados</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{backgroundColor: '#059669'}}></div>
                        <span>👥</span>
                        <span>Gestão</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{backgroundColor: '#D97706'}}></div>
                        <span>💰</span>
                        <span>Financeiro</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{backgroundColor: '#BE185D'}}></div>
                        <span>👤</span>
                        <span>RH</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 border-t border-gray-100 pt-3">
                  💡 <strong>Sistema Inteligente:</strong> Apenas posições com compatibilidade de carreira ≥20% são exibidas.
                  O sistema analisa salário, área profissional e nível hierárquico para mostrar transições realistas.
                  Posições visitadas anteriormente ficam organizadas no Histórico de Carreira na parte superior.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CareerMindMapWorking;
