const lndClient = require('./api/connect');
const {listPeersSync} = require('./lnd-api/utils');
const {classifyPeersSync} = require('./lnd-api/utils');
const {listFeesSync} = require('./lnd-api/utils');

var IN_PEERS = {};
var OUT_PEERS = {};
var BALANCED_PEERS = {};
var SKIPPED_PEERS = {};

let classified = classifyPeersSync(lndClient);
classified.inbound.forEach(c => {
  IN_PEERS[c.peer] = { p: c.p };
})
classified.outbound.forEach(c => {
  OUT_PEERS[c.peer] = { p: c.p };
})
classified.balanced.forEach(c => {
  BALANCED_PEERS[c.peer] = { p: c.p };
})
classified.skipped.forEach(c => {
  SKIPPED_PEERS[c.peer] = { p: c.p };
})

let peers = listPeersSync(lndClient);
let feeMap = {};
listFeesSync(lndClient).forEach(f => {
  feeMap[f.id] = f;
})

let allPeers = [];
peers.forEach(p => allPeers.push(convertPeer(p)) );

allPeers.sort(function(a, b) {
  return a.in - b.in;
})
allPeers.forEach(p => { p.in = numberWithCommas(p.in); p.out = numberWithCommas(p.out); });

let inPeers = [];
peers.forEach(p => {
  if (IN_PEERS[p.id]) {
    let peer = convertPeer(p, IN_PEERS[p.id], true);
    peer.ppm = parseInt(feeMap[p.id].local.rate);
    inPeers.push(peer);
  }
})
inPeers.sort(function(a, b) {
  return b.p - a.p;
})
inPeers.forEach(p => { p.in = numberWithCommas(p.in); p.out = numberWithCommas(p.out); });

let outPeers = [];
peers.forEach(p => {
  if (OUT_PEERS[p.id]) {
    let peer = convertPeer(p, OUT_PEERS[p.id]);
    peer.ppm = parseInt(feeMap[p.id].local.rate);
    outPeers.push(peer);
  }
})
outPeers.sort(function(a, b) {
  return b.p - a.p;
})
outPeers.forEach(p => { p.in = numberWithCommas(p.in); p.out = numberWithCommas(p.out); });

let balancedPeers = [];
peers.forEach(p => {
  if (BALANCED_PEERS[p.id]) {
    let peer = convertPeer(p, BALANCED_PEERS[p.id]);
    peer.ppm = parseInt(feeMap[p.id].local.rate);
    balancedPeers.push(peer);
  }
})
balancedPeers.sort(function(a, b) {
  return a.out - b.out;
})
balancedPeers.forEach(p => { p.in = numberWithCommas(p.in); p.out = numberWithCommas(p.out); });

let skippedPeers = [];
peers.forEach(p => {
  if (SKIPPED_PEERS[p.id]) skippedPeers.push(convertPeer(p, SKIPPED_PEERS[p.id]));
})
skippedPeers.sort(function(a, b) {
  return a.out - b.out;
})
skippedPeers.forEach(p => { p.in = numberWithCommas(p.in); p.out = numberWithCommas(p.out); });

console.table(allPeers);
console.log('inbound peers:');
console.table(inPeers);
console.log('outbound peers:');
console.table(outPeers);
console.log('balanced peers:');
console.table(balancedPeers);
if (skippedPeers.length > 0) {
  console.log('skipped peers:');
  console.table(skippedPeers);  
}

function convertPeer(p, pp = undefined, inbound = false) {
  let s = (inbound) ? { name: p.name, in: p.in, out: p.out } : { name: p.name, out: p.out, in: p.in };
  if (pp && pp.p) s.p = pp.p; else s.p = 0;
  if (!p.active) s.name = '💀 ' + s.name;
  return s;
}

function numberWithCommas(x) {
  return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}
