// Local simulation: runs scripted parent-style conversations through the bot
// and prints the transcripts. Run: node test/simulate.js

const { handleMessage } = require('../src/bot');

const scripts = [
  { user: 'papa', turns: ['namaste', 'mujhe kal subah gaya station ke liye cab chahiye'] },
  { user: 'mummy', turns: ['ek biryani order kar do'] },
  { user: 'papa2', turns: ['kal movie ke 2 ticket chahiye'] },
  { user: 'mummy2', turns: ['doctor ka token le do', 'City Clinic Gaya'] },
  { user: 'lost', turns: ['kuch samajh nahi', 'help'] },
];

let fail = 0;
for (const s of scripts) {
  console.log(`\n===== ${s.user} =====`);
  for (const turn of s.turns) {
    const reply = handleMessage(s.user, turn);
    console.log(`👤 ${turn}`);
    console.log(`🤖 ${reply}`);
    if (!reply || reply.length < 10) { console.log('❌ EMPTY/WEAK REPLY'); fail++; }
    if (/undefined|NaN|\[object/.test(reply)) { console.log('❌ BROKEN REPLY'); fail++; }
  }
}
console.log(fail === 0 ? '\n✅ ALL SIMULATIONS PASSED' : `\n❌ ${fail} FAILURES`);
process.exit(fail ? 1 : 0);
