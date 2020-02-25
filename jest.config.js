module.exports = {
  verbose: true,
  clearMocks: true,
  collectCoverage: true,
  testEnvironment: "node",
  coverageDirectory: "coverage",
  coveragePathIgnorePatterns: ["/node_modules/"],
  moduleDirectories: ["src", "node_modules"],
  moduleFileExtensions: ["js", "json"],
};
