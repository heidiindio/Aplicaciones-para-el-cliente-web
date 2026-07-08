const fs = require("fs");
const path = require("path");

let handler;
if (fs.existsSync(path.join(__dirname, "../uleam-sistema/server.js"))) {
  handler = require("../uleam-sistema/server.js");
} else if (fs.existsSync(path.join(__dirname, "../vue-project/uleam-sistema/server.js"))) {
  handler = require("../vue-project/uleam-sistema/server.js");
} else {
  handler = (req, res) => {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "No se pudo encontrar server.js en el despliegue." }));
  };
}

module.exports = handler;
