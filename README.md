# 📊 Mapa Mental de Carreira

Uma aplicação React interativa que utiliza D3.js para visualizar conexões inteligentes entre posições profissionais. O sistema analisa compatibilidade salarial, áreas profissionais e níveis hierárquicos para sugerir transições de carreira realistas.

## 🚀 Funcionalidades

- **🧠 Algoritmo Inteligente**: Sistema de score baseado em salário, área e nível hierárquico
- **🎨 Visualização Interativa**: Mapa mental com D3.js e SVG responsivo
- **📊 Conexões Realistas**: Apenas transições com compatibilidade ≥20%
- **🔍 Busca Avançada**: Pesquisa em tempo real com score de compatibilidade
- **📱 Interface Responsiva**: Design moderno com Tailwind CSS
- **⚡ Performance Otimizada**: Renderização eficiente e anti-colisão

## 🛠️ Stack Tecnológico

- **Frontend**: React 18.2.0 + Vite 5.0.0
- **Visualização**: D3.js 7.8.5
- **UI**: Tailwind CSS 3.3.6
- **Ícones**: Lucide React
- **Linguagem**: JavaScript/JSX

## 🏗️ Estrutura do Projeto

```
src/
├── components/
│   └── CareerMindMapWorking.jsx  # Componente principal
├── data/
│   └── positions.js              # Base de dados das posições
└── assets/                       # Recursos estáticos
```

## 🔧 Instalação e Execução

### Pré-requisitos
- Node.js (versão 16 ou superior)
- npm ou yarn

### Comandos

```bash
# Instalar dependências
npm install

# Executar em modo de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build de produção
npm run preview
```

## 🎯 Como Usar

1. **Exploração**: Clique nos nós do mapa para navegar entre posições
2. **Busca**: Use a barra de pesquisa para encontrar posições específicas
3. **Histórico**: Visualize posições visitadas no painel acima do mapa
4. **Detalhes**: Analise compatibilidade e requisitos no painel lateral
5. **Legenda**: Consulte a legenda para entender cores e conexões

## 📊 Algoritmo de Compatibilidade

O sistema calcula compatibilidade baseado em três pilares:

- **💰 Score Salarial** (35-45 pontos): Faixa salarial compatível
- **🎯 Score por Área** (5-30 pontos): Mesma área ou relacionada
- **📈 Score Hierárquico** (15-25 pontos): Progressão natural

**Filtro**: Apenas conexões com score ≥20% são exibidas

## 🎨 Áreas Profissionais

- 💻 **Tecnologia** - Azul
- 🎯 **Produto** - Roxo  
- 📊 **Dados** - Vermelho
- 👥 **Gestão** - Verde
- 💰 **Financeiro** - Laranja
- 👤 **Recursos Humanos** - Rosa

## 📚 Documentação

Para documentação técnica completa, consulte: [DOCUMENTACAO_FUNCIONAMENTO.md](./DOCUMENTACAO_FUNCIONAMENTO.md)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](./LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Gilson Moreira**
- LinkedIn: [Seu LinkedIn]
- Email: gilson.moreira@email.com

---

*Desenvolvido com ❤️ em React + D3.js*
