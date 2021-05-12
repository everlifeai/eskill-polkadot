'use strict'
const cote = require('cote')
const u = require('@elife/utils')

const { ApiPromise, WsProvider } = require("@polkadot/api")

function main() {
  if(!process.env.ENABLE_POLKADOT) return
  startMicroservice()
  .then(registerWithCommMgr)
  .catch(e => u.showErr(e))
}

const msKey = 'everlife-polkadot-svc'

async function startMicroservice() {
  const wsProvider = new WsProvider('ws://127.0.0.1:9944')
  const api = await ApiPromise.create({ provider: wsProvider })

  const genesis = api.genesisHash.toHex()
  const chainInfo = await api.registry.getChainProperties()
  const ADDR = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
  const { nonce, data: balance } = await api.query.system.account(ADDR);
  const lastHeader = await api.rpc.chain.getHeader();

  const svc = new cote.Responder({
    name: 'Everlife Polkadot Integration Skill',
    key: msKey,
  })

  svc.on('msg', (req, cb) => {
    if(!req.msg) return cb()
    if(!req.msg.startsWith("/polkadot")) return cb()
    cb(null, true)
    const reply = `YOUR CHAIN INFO:
Account Balance: ${balance.free}
Genesis Block: ${genesis}
Chain Info: ${JSON.stringify(chainInfo)}
Last Block: ${lastHeader.number}`
    sendReply(reply, req)
  })
}

const commMgrClient = new cote.Requester({
  name: 'Polkadot Skill -> CommMgr',
  key: 'everlife-communication-svc',
})

function sendReply(msg, req) {
  req.type = 'reply'
  req.msg = String(msg)
  commMgrClient.send(req, err => {
    if(err) u.showErr(err)
  })
}

function registerWithCommMgr() {
  commMgrClient.send({
    type: 'register-msg-handler',
    mskey: msKey,
    mstype: 'msg',
    mshelp: [ { cmd: '/polkadot', txt: 'integrate with polkadot' } ],
  }, err => {
    if(err) u.showErr(err)
  })
}

main()
