import React from 'react';

const TestComponent = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Teste - Projeto Funcionando!
        </h1>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-blue-600 mb-4">
            Mapa Mental de Carreira
          </h2>
          <p className="text-gray-700 mb-4">
            Se você está vendo esta mensagem, o React está funcionando corretamente.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-100 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800">Tecnologia</h3>
              <p className="text-blue-600">Desenvolvedor .NET</p>
            </div>
            <div className="bg-green-100 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800">Financeiro</h3>
              <p className="text-green-600">Analista Financeiro</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestComponent;
