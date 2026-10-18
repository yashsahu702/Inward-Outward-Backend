module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  rootDir: './src', // Assuming your tests are under the 'src' folder
  testRegex: '.*\\.spec\\.ts$', // Will look for files with .spec.ts extension
}
