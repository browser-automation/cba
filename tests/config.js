const tests = [
  {file:"play.js", name: "Testing actions"},
  {file:"record.js", name: "Testing recording"},
  {file:"generic.js", name: "Running generic Tests"},
  {file:"popup.js", name: "Testing popup"},
  {file:"options.js", name: "Testing options page generic functionality"},
  {file:"import-export.js", name: "Testing Import and Export in options page"},
  {file:"functions.js", name: "Testing functions tab in options page"},
  {file:"migrate.js", name: "Testing data migration"},
];

const server = "http://127.0.0.1:3001";
const closeBrowser = true;

module.exports = {server, tests, closeBrowser};
