const plinko=require('./plinko-store');
let initialization;
async function database(){const pool=await plinko.database();if(!initialization)initialization=pool.query(`CREATE TABLE IF NOT EXISTS st25_casino_rounds(id uuid PRIMARY KEY,steam_id varchar(17) NOT NULL,status text NOT NULL,payload jsonb NOT NULL,created_at bigint NOT NULL); CREATE INDEX IF NOT EXISTS st25_casino_player ON st25_casino_rounds(steam_id,created_at DESC)`).catch(e=>{initialization=null;throw e;});await initialization;return pool;}
async function withPlayer(sid,fn){await database();return plinko.withPlayer(sid,fn);}
const get=async(c,id,sid)=>(await c.query('SELECT * FROM st25_casino_rounds WHERE id=$1 AND steam_id=$2',[id,sid])).rows[0];
const history=async sid=>(await(await database()).query('SELECT * FROM st25_casino_rounds WHERE steam_id=$1 ORDER BY created_at DESC LIMIT 30',[sid])).rows;
const pending=async(c,sid)=>(await c.query("SELECT * FROM st25_casino_rounds WHERE steam_id=$1 AND status!='settled' ORDER BY created_at DESC",[sid])).rows;
const blocked=async sid=>(await(await database()).query("SELECT 1 FROM st25_casino_rounds WHERE steam_id=$1 AND status IN ('debit_pending','credit_pending','review') UNION ALL SELECT 1 FROM st25_plinko_games WHERE steam_id=$1 AND status IN ('debit_pending','credit_pending','review') LIMIT 1",[sid])).rows.length>0;
const insert=async(c,id,sid,p)=>(await c.query("INSERT INTO st25_casino_rounds VALUES($1,$2,'debit_pending',$3,$4) RETURNING *",[id,sid,JSON.stringify(p),Date.now()])).rows[0];
const update=async(c,r,status,p=r.payload)=>(await c.query('UPDATE st25_casino_rounds SET status=$2,payload=$3 WHERE id=$1 RETURNING *',[r.id,status,JSON.stringify(p)])).rows[0];
module.exports={database,withPlayer,get,history,pending,blocked,insert,update,plinkoPending:plinko.unresolved};
