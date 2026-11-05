// Loaded before the fixed offline test list. Never load live API/auth probes here.
const block = () => { throw new Error('Offline tests block network and child processes'); };

globalThis.fetch = block;
for (const protocol of ['node:http', 'node:https']) {
  const transport = require(protocol);
  transport.request = block;
  transport.get = block;
}
const net = require('node:net');
net.connect = block;
net.createConnection = block;
net.Socket.prototype.connect = block;
net.Server.prototype.listen = block;
require('node:tls').connect = block;
require('node:http2').connect = block;
for (const method of ['send', 'connect', 'bind']) {
  require('node:dgram').Socket.prototype[method] = block;
}
const dns = require('node:dns');
for (const resolver of [dns, dns.promises, dns.Resolver.prototype, dns.promises.Resolver.prototype]) {
  for (const method of Object.getOwnPropertyNames(resolver)) {
    if (/^(lookup|resolve|reverse)/.test(method)) resolver[method] = block;
  }
}
const childProcess = require('node:child_process');
for (const method of ['exec', 'execSync', 'execFile', 'execFileSync', 'spawn', 'spawnSync', 'fork']) {
  childProcess[method] = block;
}
require('node:module').syncBuiltinESMExports();
globalThis[Symbol.for('zerocoder.offline')] = true;
