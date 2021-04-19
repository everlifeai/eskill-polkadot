'use strict'
const cote = require('cote')
const u = require('@elife/utils')

function main() {
  startMicroservice()
  .then(registerWithCommMgr)
  .catch(e => u.showErr(e))
}

const msKey = 'everlife-polkadot-svc'

async function startMicroservice() {
  const svc = new cote.Responder({
    name: 'Everlife Polkadot Integration Skill',
    key: msKey,
  })

  svc.on('msg', (req, cb) => {
    if(!req.msg) return cb()
    if(!req.msg.startsWith("/polkadot")) return cb()
    cb(null, true)
    sendReply("POLKADOT RULES!", req)
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
  u.showErr('REGISTERING')
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
