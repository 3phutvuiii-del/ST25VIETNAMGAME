const Pilot=require('../api/upstream-endpoints'),API=require('../api/endpoints');
module.exports=(app,context)=>{
  const service=require('../services/casino-wallet')({balance:async(sid,fresh=false)=>{const p=await context.callIslePilot(Pilot.player(sid),'GET',null,fresh);if(p?.error||p?._status||!Number.isFinite(p?.wallet?.balance)||p.wallet.balance<0)throw Error('Wallet unavailable');return p.wallet.balance;},change:async(sid,amount,reason)=>{try{return await context.callIslePilot(Pilot.playerCurrency(sid),'POST',{amount,reason});}finally{context.clearPlayerCache(sid);}}});
  const run=fn=>async(req,res)=>{try{res.json(await fn(context.getRequestSteamId(req),req.body));}catch(e){if(e.status)return res.status(e.status).json({error:e.message});throw e;}};
  app.get(API.routes.casinoWalletState,run(service.state));
  app.post(API.routes.casinoWalletPlay,run(service.play));
  app.post(API.routes.casinoWalletAction,run(service.action));
};
