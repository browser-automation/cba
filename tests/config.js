const tests = [
  {file:"play.js", name: "Testing actions"},
  {file:"record.js", name: "Testing recording"},
  {file:"generic.js", name: "Running generic Tests"},
  {file:"popup.js", name: "Testing popup"},
  {file:"migrate.js", name: "Testing data migration"},
];

const server = "http://127.0.0.1:3001";
const closeBrowser = true;

module.exports = {server, tests, closeBrowser};
