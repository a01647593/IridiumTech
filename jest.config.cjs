module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true }]
  },
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.server.json'
    }
  }
  
};
