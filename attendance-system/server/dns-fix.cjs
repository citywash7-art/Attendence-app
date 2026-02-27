// dns-fix.cjs
const dns = require("dns");

// Force resolvers that correctly answer SRV for mongodb+srv
dns.setServers(["1.1.1.1", "8.8.8.8"]);