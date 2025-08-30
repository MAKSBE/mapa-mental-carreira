import React, { useState } from 'react';
import { positions } from '../data/positions';

const CareerMindMapSimple = () => {
  console.log('CareerMindMapSimple loading...');
  console.log('Positions:', positions);

  const [selectedPositionId, setSelectedPositionId] = useState('dev-net');
  const selectedPosition = positions[selectedPositionId];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Mapa de Carreira - Versão Simples
        </h1>
        
        {selectedPosition ? (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-blue-600 mb-4">
              {selectedPosition.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>Nível:</strong> {selectedPosition.level}</p>
                <p><strong>Salário:</strong> {selectedPosition.salary}</p>
                <p><strong>Área:</strong> {selectedPosition.pillar}</p>
              </div>
              <div>
                <p><strong>Descrição:</strong> {selectedPosition.description}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Erro: Posição não encontrada
          </div>
        )}

        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Todas as Posições:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(positions).map(([key, position]) => (
              <div 
                key={key}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  key === selectedPositionId 
                    ? 'bg-blue-100 border-blue-500' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedPositionId(key)}
              >
                <h4 className="font-medium text-gray-900">{position.title}</h4>
                <p className="text-sm text-gray-600">{position.pillar}</p>
                <p className="text-sm text-green-600">{position.salary}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerMindMapSimple;
