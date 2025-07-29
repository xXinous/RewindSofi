module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {
      // Configurações modernas do Autoprefixer
      flexbox: 'no-2009',
      grid: 'autoplace',
      // Desabilitar propriedades depreciadas
      overrideBrowserslist: [
        'last 2 versions',
        '> 1%',
        'not dead',
        'not ie 11'
      ],
      // Configurações de acessibilidade
      cascade: true,
      add: true,
      remove: true,
    },
  },
}; 