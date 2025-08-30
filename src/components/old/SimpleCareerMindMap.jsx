import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { positions } from '../data/positions';

const SimpleCareerMindMap = () => {
  const svgRef = useRef();

  useEffect(() => {
    console.log('SimpleCareerMindMap iniciado');
    console.log('Positions data:', positions);
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    
    // Teste simples: adicionar um círculo
    svg.append("circle")
       .attr("cx", 100)
       .attr("cy", 100)
       .attr("r", 50)
       .attr("fill", "blue");
       
    // Teste: adicionar texto
    svg.append("text")
       .attr("x", 100)
       .attr("y", 100)
       .attr("text-anchor", "middle")
       .attr("fill", "white")
       .text("Teste");
       
    console.log('D3 executado com sucesso');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Diagnóstico - Mapa Mental de Carreira
        </h1>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-blue-600 mb-4">
            Teste D3.js
          </h2>
          <div style={{ border: '1px solid #ccc', borderRadius: '8px' }}>
            <svg 
              ref={svgRef} 
              width="400" 
              height="300" 
              style={{ background: '#f8f9fa' }}
            />
          </div>
          <p className="text-gray-600 mt-4">
            Se você vê um círculo azul acima, o D3 está funcionando.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimpleCareerMindMap;
