const assert=require('node:assert/strict'),http=require('node:http'),{randomUUID}=require('node:crypto');
process.env.SESSION_SECRET='offline-casino-http-session-secret-123456789';process.env.CASINO_WALLET_ENABLED='true';
const Auth=require('../src/core/auth'),fixture=require('./helpers/casino-fixture.cjs'),create=require('../src/services/casino-wallet'),f=fixture();
// Use real controller/adapter and real security middleware, fake persistence/upstream.
require.cache[require.resolve('../src/services/casino-wallet')].exports=bank=>create(bank,f.store);
const app=require('express')(),steam='76561198000000001',cookie='st25_session_token='+Auth.sign({kind:'session',steamId:steam,expires:Date.now()+60000});let cacheClears=0;
require('../src/middleware/security')(app,{getPortalData:()=>({marketListings:[],trades:[]})});
require('../src/controllers/casino-wallet')(app,{getRequestSteamId:Auth.getRequestSteamId,clearPlayerCache:()=>cacheClears++,callIslePilot:async(url,method,body,fresh)=>{if(method==='POST'){assert.equal(url,'/players/'+steam+'/currency');return f.bank.change(steam,body.amount,body.reason);}assert.equal(url,'/players/'+steam);return{wallet:{balance:await f.bank.balance(steam,fresh)}};}});
app.use((e,req,res,next)=>res.status(e.status||500).json({error:'Offline request failure'}));const server=app.listen(0,'127.0.0.1');
function request(route,body,headers={}){return new Promise((resolve,reject)=>{const data=body===undefined?undefined:JSON.stringify(body),req=http.request({host:'127.0.0.1',port:server.address().port,path:'/api/casino-wallet/'+route,method:data?'POST':'GET',headers:{...(data?{'Content-Type':'application/json'}:{}),...headers}},res=>{let raw='';res.on('data',c=>raw+=c);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,data:JSON.parse(raw)}));});req.on('error',reject);req.end(data);});}
(async()=>{await new Promise(r=>server.once('listening',r));const play={id:randomUUID(),game:'roulette',amount:10,choice:'red'};
for(const headers of [{},{'x-steam-id':steam},{cookie:'st25_steam_id='+steam},{cookie:cookie+'corrupt'}])assert.equal((await request('play',play,headers)).status,401);assert.equal(f.calls.length,0);
assert.equal((await request('play',play,{cookie,origin:'https://evil.invalid'})).status,403);assert.equal((await request('play',{...play,steamId:'76561198000000002'},{cookie})).status,403);assert.equal(f.calls.length,0);
const state=await request('state',undefined,{cookie});assert.equal(state.status,200);assert.equal(state.data.authenticated,true);assert.equal(state.headers['cache-control'],'no-store');
assert.equal((await request('play',{...play,amount:'10'},{cookie})).status,400);assert.equal((await request('action',{id:'bad',move:'hit'},{cookie})).status,400);
const r=await request('play',play,{cookie});assert.equal(r.status,200);assert.equal(r.data.status,'settled');const calls=f.calls.length;assert.equal((await request('play',play,{cookie})).status,200);assert.equal(f.calls.length,calls);assert.equal(cacheClears,calls);
f.fail('debit');assert.equal((await request('play',{...play,id:randomUUID()},{cookie})).status,503);assert.equal(cacheClears,f.calls.length,'Cache must clear on failed wallet calls');assert((await request('state',undefined,{cookie})).data.blocked);
console.log('PASS casino HTTP: real routes/security/upstream adapter, signed sessions, spoof/CSRF rejection, no-store, malformed requests, replay without duplicate debit, failed debit blocking/cache invalidation; offline only.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
