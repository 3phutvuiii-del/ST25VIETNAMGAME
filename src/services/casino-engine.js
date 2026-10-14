const {randomInt}=require('node:crypto');
const red=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const fail=message=>{throw Object.assign(Error(message),{status:400});};
function validate(game,amount,choice){
  if(!['slots','roulette','blackjack','dice'].includes(game))fail('Trò chơi không hợp lệ.');
  if(!Number.isInteger(amount)||amount<1||amount>500)fail('Chọn từ 1 đến 500 Lúa.');
  if(game==='roulette'&&!['red','black','even','odd',...Array.from({length:37},(_,n)=>String(n))].includes(choice))fail('Cửa roulette không hợp lệ.');
  if(game==='dice'&&!/^(under|over):([5-9]|[1-8][0-9]|9[0-5])$/.test(choice))fail('Chọn hướng và mốc nguyên từ 5 đến 95.');
}
function score(cards){let total=0,aces=0;for(const c of cards){const rank=c%13;total+=rank===0?11:Math.min(rank+1,10);if(rank===0)aces++;}while(total>21&&aces-- >0)total-=10;return total;}
function settle(p){const a=score(p.player),b=score(p.dealer);p.payout=a>21?0:b>21||a>b?p.amount*2:a===b?p.amount:0;p.outcome=p.payout>p.amount?'win':p.payout===p.amount?'push':'lose';return p;}
function start(game,amount,choice,rng=randomInt){
  validate(game,amount,choice);const p={game,amount,choice,payout:0};
  if(game==='slots'){p.reels=Array.from({length:3},()=>rng(6));p.multiplier=p.reels.every(x=>x===p.reels[0])?[8,10,12,16,24,40][p.reels[0]]:0;p.payout=amount*p.multiplier;}
  if(game==='dice'){
    const [direction,target]=choice.split(':');p.direction=direction;p.target=Number(target);
    p.roll=rng(10000);p.chance=direction==='under'?p.target:100-p.target;
    p.won=direction==='under'?p.roll<p.target*100:p.roll>=p.target*100;
    p.multiplier=97/p.chance;p.payout=p.won?Math.floor(amount*97/p.chance):0;
    p.outcome=p.won?'win':'lose';return p;
  }
  if(game==='roulette'){p.number=rng(37);p.color=p.number===0?'green':red.has(p.number)?'red':'black';const wins=choice===p.color||p.number>0&&(choice==='even'&&p.number%2===0||choice==='odd'&&p.number%2===1)||choice===String(p.number);p.payout=wins?amount*(/^\d+$/.test(choice)?36:2):0;}
  if(game==='blackjack'){
    p.deck=Array.from({length:52},(_,i)=>i);for(let i=51;i>0;i--){const j=rng(i+1);[p.deck[i],p.deck[j]]=[p.deck[j],p.deck[i]];}
    p.player=[p.deck.pop(),p.deck.pop()];p.dealer=[p.deck.pop(),p.deck.pop()];
    if(score(p.player)===21||score(p.dealer)===21){settle(p);if(score(p.player)===21&&score(p.dealer)!==21)p.payout=Math.floor(amount*2.5);return p;}
    p.active=true;return p;
  }
  p.outcome=p.payout>amount?'win':'lose';return p;
}
function action(p,move){if(!p.active||!['hit','stand'].includes(move))fail('Thao tác không hợp lệ.');if(move==='hit'){p.player.push(p.deck.pop());if(score(p.player)<21)return p;}while(score(p.dealer)<17)p.dealer.push(p.deck.pop());p.active=false;return settle(p);}
function publicRound(row){const p={...row.payload};delete p.deck;if(p.active&&row.status!=='settled'){p.dealer=[p.dealer[0],null];delete p.payout;}return{id:row.id,status:row.status,...p};}
module.exports={validate,start,action,score,publicRound};
