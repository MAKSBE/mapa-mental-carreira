import React, { useState, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { Search, Info, Briefcase, DollarSign, TrendingUp, ArrowRight } from 'lucide-react';
import { positions } from '../data/positions';

const CareerMindMap = () => {
  const [selectedPositionId, setSelectedPositionId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredPositionId, setHoveredPositionId] = useState(null);
  const [visibleNodeIds, setVisibleNodeIds] = useState(['dev-net']);
  const [animatingNodeIds, setAnimatingNodeIds] = useState([]);
  const [history, setHistory] = useState([['dev-net']]);
  const svgRef = useRef();

  // Verificar se o nó inicial existe
  useEffect(() => {
    if (!positions['dev-net']) {
      console.error('Nó inicial "dev-net" não encontrado nos dados');
      // Usar o primeiro nó disponível como fallback
      const firstNodeId = Object.keys(positions)[0];
      if (firstNodeId) {
        setVisibleNodeIds([firstNodeId]);
        setHistory([[firstNodeId]]);
      }
    }
  }, []);
  
  const canConnectBySalary = (source, target) => {
    if (!source || !target || !source.salaryMax || !target.salaryMin) {
      return false;
    }
    return source.salaryMax >= target.salaryMin;
  };

  const selectedPosition = selectedPositionId ? positions[selectedPositionId] : null;

  // Lógica principal com o D3-Force para o layout do mapa mental
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const width = 900;
    const height = 600;

    // Limpar SVG anterior
    svg.selectAll("*").remove();

    // Prepara os dados de nós e links para o D3
    const currentNodes = visibleNodeIds.map(id => {
      const position = positions[id];
      if (!position) {
        console.warn(`Position not found for id: ${id}`);
        return null;
      }
      return { ...position };
    }).filter(Boolean);
    
    const currentLinks = [];

    console.log('Current nodes:', currentNodes);

    if (currentNodes.length === 0) {
      console.warn('No valid nodes found');
      return;
    }

    currentNodes.forEach(sourceNode => {
      if (!sourceNode || !sourceNode.connections) {
        console.warn('Invalid source node:', sourceNode);
        return;
      }
      
      // Conexões diretas
      sourceNode.connections.forEach(targetId => {
        if (visibleNodeIds.includes(targetId)) {
          const targetNode = positions[targetId];
          if (targetNode && canConnectBySalary(sourceNode, targetNode)) {
            currentLinks.push({ source: sourceNode.id, target: targetId, type: 'direct' });
          }
        }
      });

      // Conexões cruzadas (entre pilares) - simplificado
      /* Desabilitando temporariamente para debug
      Object.values(positions).forEach(targetNode => {
        if (targetNode.id !== sourceNode.id && visibleNodeIds.includes(targetNode.id)) {
          if (!sourceNode.connections.includes(targetNode.id) &&
              !targetNode.connections.includes(sourceNode.id) &&
              canConnectBySalary(sourceNode, targetNode) &&
              sourceNode.pillar !== targetNode.pillar) {
            currentLinks.push({ source: sourceNode.id, target: targetNode.id, type: 'cross' });
          }
        }
      });
      */
    });

    console.log('Current links:', currentLinks);

    // Configuração da simulação D3 simplificada
    const simulation = d3.forceSimulation(currentNodes)
      .force("link", d3.forceLink(currentLinks).id(d => d.id).distance(150).strength(0.5))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(60));

    console.log('Simulation created successfully');

    console.log('Simulation created successfully');

    // Renderiza as linhas (links)
    try {
      const link = svg.selectAll(".link-path")
        .data(currentLinks, d => `${d.source.id || d.source}-${d.target.id || d.target}`);
      
      link.enter()
        .append("path")
        .attr("class", d => `link-path ${d.type}`)
        .attr("stroke", d => d.type === 'cross' ? '#6EE7B7' : '#93C5FD')
        .attr("stroke-width", d => d.type === 'cross' ? 2 : 4)
        .attr("stroke-dasharray", d => d.type === 'cross' ? "5,5" : "0,0")
        .attr("fill", "none");
      
      link.exit().remove();
      
      console.log('Links rendered successfully');
    } catch (error) {
      console.error('Error rendering links:', error);
    }

    // Renderiza os nós (grupos de círculo e texto)
    try {
      const node = svg.selectAll(".node-group")
        .data(currentNodes, d => d.id);
        
      const nodeEnter = node.enter()
        .append("g")
        .attr("class", "node-group")
        .attr("cursor", "pointer")
        .style("opacity", 0)
        .transition()
        .duration(500)
        .style("opacity", 1);
        
      nodeEnter.append("circle")
        .attr("r", 50)
        .attr("fill", d => d.color || '#1E3A8A');
        
      nodeEnter.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "-0.1em")
        .attr("fill", "white")
        .style("font-size", "11px")
        .style("font-weight", "600")
        .style("pointer-events", "none")
        .style("user-select", "none")
        .style("text-shadow", "1px 1px 2px rgba(0,0,0,0.5)")
        .each(function(d) {
          if (d && d.title) {
            const words = d.title.split(' ');
            d3.select(this).selectAll("tspan")
              .data(words)
              .enter()
              .append("tspan")
              .attr("x", 0)
              .attr("dy", (word, i) => i === 0 ? "0em" : "1.2em")
              .text(word);
          }
        });
      
      console.log('Nodes rendered successfully');
    } catch (error) {
      console.error('Error rendering nodes:', error);
    }
    
    // Atualiza o estilo dos nós e links
    try {
      const node = svg.selectAll(".node-group");
      
      node.merge(node.enter())
        .select("circle")
        .attr("stroke", d => d.id === selectedPositionId ? '#1D4ED8' : d.id === hoveredPositionId ? '#3B82F6' : 'white')
        .attr("stroke-width", d => d.id === selectedPositionId ? 4 : d.id === hoveredPositionId ? 3 : 2);

      node.exit().remove();
      
      console.log('Node styles updated successfully');
    } catch (error) {
      console.error('Error updating node styles:', error);
    }

    // Atualiza as posições a cada 'tick' da simulação
    simulation.on("tick", () => {
      try {
        const links = svg.selectAll(".link-path");
        const nodes = svg.selectAll(".node-group");
        
        links.attr("d", d => {
          const source = d.source;
          const target = d.target;
          if (!source || !target) return "";
          
          // Gerador de caminho curvo para o visual de mapa mental
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dr = Math.sqrt(dx * dx + dy * dy);
          return `M${source.x},${source.y}A${dr},${dr} 0 0,1 ${target.x},${target.y}`;
        });
          
        nodes.attr("transform", d => d ? `translate(${d.x || 0},${d.y || 0})` : "translate(0,0)");
      } catch (error) {
        console.error('Error in simulation tick:', error);
      }
    });

    // Lógica para arrastar os nós
    try {
      const drag = d3.drag()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        });

      const nodes = svg.selectAll(".node-group");
      
      nodes.call(drag)
        .on("click", (event, d) => {
          event.stopPropagation();
          if (d && d.id) {
            toggleCareerPath(d);
          }
        })
        .on("mouseenter", (event, d) => {
          if (d && d.id) {
            setHoveredPositionId(d.id);
          }
        })
        .on("mouseleave", () => setHoveredPositionId(null));
        
      console.log('Drag and events added successfully');
    } catch (error) {
      console.error('Error setting up drag and events:', error);
    }

    return () => {
      try {
        simulation.stop();
      } catch (error) {
        console.error('Error stopping simulation:', error);
      }
    };

  }, [visibleNodeIds, selectedPositionId, hoveredPositionId]);

  const toggleCareerPath = (position) => {
    const isExpanding = !selectedPositionId || selectedPositionId !== position.id;
    if (isExpanding) {
      const newVisibleIds = new Set(visibleNodeIds);
      const newAnimating = [];
      
      const addConnections = (sourcePos) => {
        sourcePos.connections.forEach(connId => {
          const connectedPos = positions[connId];
          if (connectedPos && canConnectBySalary(sourcePos, connectedPos) && !newVisibleIds.has(connId)) {
            newVisibleIds.add(connId);
            newAnimating.push(connId);
          }
        });
        
        Object.values(positions).forEach(pos => {
          if (pos.connections.includes(sourcePos.id) && !newVisibleIds.has(pos.id)) {
            if (canConnectBySalary(pos, sourcePos)) {
              newVisibleIds.add(pos.id);
              newAnimating.push(pos.id);
            }
          }
        });
      };
      
      addConnections(position);
      
      Object.values(positions).forEach(pos => {
        if (!newVisibleIds.has(pos.id) && pos.id !== position.id) {
          if (canConnectBySalary(position, pos) &&
              !position.connections.includes(pos.id) &&
              !pos.connections.includes(position.id) &&
              position.pillar !== pos.pillar) {
            newVisibleIds.add(pos.id);
            newAnimating.push(pos.id);
          }
        }
      });
      
      if (newAnimating.length > 0) {
        setHistory(prev => [...prev, [...newVisibleIds]]);
        setVisibleNodeIds(Array.from(newVisibleIds));
        setAnimatingNodeIds(newAnimating);
        setSelectedPositionId(position.id);
        setTimeout(() => setAnimatingNodeIds([]), 500);
      } else {
        setSelectedPositionId(position.id);
      }
    } else {
      if (history.length > 1) {
        const newHistory = [...history];
        newHistory.pop();
        const previousState = newHistory[newHistory.length - 1];
        setHistory(newHistory);
        setVisibleNodeIds(previousState);
        setSelectedPositionId(null);
      } else {
        setSelectedPositionId(null);
      }
    }
  };

  const handleReset = () => {
    setHistory([['dev-net']]);
    setVisibleNodeIds(['dev-net']);
    setSelectedPositionId(null);
    setAnimatingNodeIds([]);
  };

  const filteredPositions = Object.values(positions).filter(pos =>
    visibleNodeIds.includes(pos.id) && (
      searchTerm === '' || pos.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mapa de Trilhas de Carreira</h1>
              <p className="text-gray-600">Explore conexões e oportunidades de crescimento profissional</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar posições..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Mapa de Rede */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Rede de Conexões</h2>
                  <p className="text-blue-100">Clique nos nós para expandir ou retrair conexões</p>
                </div>
                {history.length > 1 && (
                  <button onClick={handleReset} className="px-3 py-1 bg-white bg-opacity-20 rounded-lg text-sm hover:bg-opacity-30 transition-colors">
                    ↻ Resetar
                  </button>
                )}
              </div>
              <div className="relative overflow-hidden">
                <svg ref={svgRef} width="100%" height="600" viewBox="0 0 900 600" className="w-full" style={{ minHeight: '600px', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}></svg>
              </div>
            </div>
          </div>

          {/* Painel de Detalhes */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border sticky top-4">
              <div className="p-4 bg-gradient-to-r from-gray-800 to-gray-700 text-white rounded-t-xl">
                <h2 className="text-lg font-semibold flex items-center">
                  <Info className="w-5 h-5 mr-2" />
                  Detalhes da Posição
                </h2>
              </div>
              
              <div className="p-6">
                {selectedPosition ? (
                  <div className="space-y-6">
                    <div>
                      <div className="w-12 h-12 rounded-full mb-3 flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: selectedPosition.color }}>
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
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Requisitos</h4>
                      <ul className="space-y-2">
                        {selectedPosition.requirements.map((req, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Caminhos Possíveis</h4>
                      <div className="space-y-2">
                        {selectedPosition.connections
                          .filter(connId => {
                            const connectedPos = positions[connId];
                            return connectedPos && canConnectBySalary(selectedPosition, connectedPos);
                          })
                          .map(connId => {
                            const connectedPos = positions[connId];
                            return (
                              <div key={connId} className="p-3 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => toggleCareerPath(connectedPos)}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: connectedPos.color }}></div>
                                    <span className="font-medium text-sm text-gray-900">{connectedPos.title}</span>
                                  </div>
                                  <ArrowRight className="w-4 h-4 text-blue-500" />
                                </div>
                                <div className="text-xs text-gray-600 mt-1">{connectedPos.salary}</div>
                                <div className="text-xs text-blue-600 mt-1">
                                  ↗ Progressão na área de {connectedPos.pillar}
                                </div>
                              </div>
                            );
                          })}

                        {Object.values(positions)
                          .filter(pos =>
                            pos.id !== selectedPosition.id &&
                            !selectedPosition.connections.includes(pos.id) &&
                            !pos.connections.includes(selectedPosition.id) &&
                            canConnectBySalary(selectedPosition, pos) &&
                            selectedPosition.pillar !== pos.pillar
                          )
                          .map(crossPos => (
                            <div key={crossPos.id} className="p-3 bg-green-50 rounded-lg border border-green-200 cursor-pointer hover:bg-green-100 transition-colors" onClick={() => toggleCareerPath(crossPos)}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <div className="w-3 h-3 rounded-full border-2 border-dashed" style={{ borderColor: crossPos.color, backgroundColor: 'transparent' }}></div>
                                  <span className="font-medium text-sm text-gray-900">{crossPos.title}</span>
                                </div>
                                <ArrowRight className="w-4 h-4 text-green-500" />
                              </div>
                              <div className="text-xs text-gray-600 mt-1">{crossPos.salary}</div>
                              <div className="text-xs text-green-600 mt-1">
                                ⚡ Transição para {crossPos.pillar}
                              </div>
                            </div>
                          ))}
                        
                        {(selectedPosition.connections.filter(connId => positions[connId] && canConnectBySalary(selectedPosition, positions[connId])).length === 0 &&
                          Object.values(positions).filter(pos => pos.id !== selectedPosition.id && !selectedPosition.connections.includes(pos.id) && !pos.connections.includes(selectedPosition.id) && canConnectBySalary(selectedPosition, pos) && selectedPosition.pillar !== pos.pillar).length === 0) && (
                            <div className="text-center py-4 text-gray-500 text-sm">
                              <p>Esta é uma posição final na trilha atual.</p>
                              <p className="text-xs mt-1">Explore outras áreas para continuar crescendo!</p>
                            </div>
                          )}
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

export default CareerMindMap;