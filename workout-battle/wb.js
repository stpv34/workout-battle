(function(){
var C=window.WB_CONFIG||{},sb=null,uid=null,done,lis=[];
var ready=new Promise(function(r){done=r});
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function el(h){var d=document.createElement("div");d.innerHTML=h;return d.firstElementChild}
function $(r,s){return r.querySelector(s)}
var st=document.createElement("style");st.textContent=".wbo{position:fixed;inset:0;z-index:50;background:var(--bg);overflow:auto;padding:max(16px,env(safe-area-inset-top)) 16px 90px}.wbo .in{max-width:560px;margin:0 auto}.wbo h1{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:40px;margin:8px 0}.wbo h2{font-family:'Barlow Condensed',sans-serif;font-size:24px;margin:22px 0 8px}.wbo input{display:block;width:100%;margin:6px 0 12px;padding:12px;border-radius:10px;border:1px solid var(--line);background:var(--surface);font-size:17px}.wbo label{display:block;font-size:14px;color:var(--muted)}.wbb{border:0;border-radius:12px;padding:12px 18px;background:var(--push);color:#fff;font-weight:600;font-size:16px;margin:2px 6px 2px 0}.wbb.alt{background:var(--surface);color:var(--ink)}.wbc{border:2px solid var(--line);background:var(--surface);border-radius:999px;padding:8px 14px;margin:0 8px 8px 0}.wbc.on{border-color:var(--pull)}.wbr{display:grid;grid-template-columns:28px 1fr auto;gap:10px;align-items:center;padding:10px 12px;background:var(--surface);border-radius:12px;margin-bottom:8px}.wbr.me{outline:2px solid var(--pull)}.wbr b{font-size:20px}.wbfab{position:fixed;right:16px;bottom:max(16px,env(safe-area-inset-bottom));z-index:20;border:0;border-radius:999px;padding:14px 20px;background:var(--ink);color:var(--bg);font-weight:700;box-shadow:0 4px 16px rgba(0,0,0,.3)}";st.textContent+=".wbrt{position:fixed;top:max(10px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);z-index:60;background:var(--ink);color:var(--bg);border-radius:999px;padding:10px 16px;display:flex;gap:12px;align-items:center;font-weight:700;box-shadow:0 4px 16px rgba(0,0,0,.35)}.wbrt button{border:0;border-radius:999px;padding:4px 12px}.wbrt.done{background:var(--ok);color:#fff}.rtp{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:10px 0}.rtp button{border:2px solid var(--line);background:var(--surface);border-radius:999px;padding:6px 12px}.rtp button[aria-pressed=true]{border-color:var(--pull);font-weight:700}";document.head.appendChild(st);
if("serviceWorker" in navigator)navigator.serviceWorker.register("/sw.js").catch(function(){});
var jc=new URLSearchParams(location.search).get("join");
if(jc){try{localStorage.setItem("wbJoin",jc)}catch(e){}history.replaceState(null,"",location.pathname)}
function chk(r){if(r.error)throw r.error;return r}
function pushSessions(){hc.t=0;sb.from("sessions").select("id,date,day,saved_at,entries").eq("user_id",uid).order("saved_at",{ascending:false}).limit(300).then(function(r){if(r.error)return;
 var docs=r.data.map(function(x){return{id:x.id,data:function(){return{date:x.date,day:x.day,savedAt:x.saved_at,entries:x.entries}}}});
 lis.forEach(function(f){f({docs:docs,metadata:{fromCache:false}})})})}
var DB={doc:function(){return{
 set:function(v){return sb.from("profiles").update({exercises:v.exercises}).eq("id",uid).then(chk)},
 onSnapshot:function(ok,bad){sb.from("profiles").select("exercises").eq("id",uid).single().then(function(r){if(r.error){bad&&bad(r.error);return}
  ok({exists:true,data:function(){return{exercises:r.data.exercises}},metadata:{fromCache:false}})})},
 collection:function(){var q={doc:function(id){return{update:function(v){return sb.from("sessions").update(v).eq("id",id).eq("user_id",uid).then(chk).then(pushSessions)},delete:function(){return sb.from("sessions").delete().eq("id",id).eq("user_id",uid).then(chk).then(pushSessions)},set:function(b){return sb.from("sessions").insert({id:id,user_id:uid,date:b.date,day:b.day,saved_at:b.savedAt,entries:b.entries}).then(chk).then(pushSessions)}}},
  orderBy:function(){return q},limit:function(){return q},onSnapshot:function(ok){lis.push(ok);pushSessions()}};return q}}}};
window.claude={use:function(k){
 if(k==="db")return ready.then(function(){return DB});
 if(k==="user")return ready.then(function(){return{id:function(){return Promise.resolve(uid)}}});
 return Promise.reject(new Error("n/a"))}};
var hc={t:0,html:null};
function wire(n){n.querySelectorAll("[data-o]").forEach(function(b){b.onclick=function(){var v=b.getAttribute("data-o");openPanel(v==="1"?undefined:v)}})}
function homeCard(){var n=document.getElementById("wbhome");if(!n||!uid)return;
 if(hc.html&&Date.now()-hc.t<30000){n.innerHTML=hc.html;wire(n);return}
 sb.from("circle_members").select("circles(id,name)").eq("user_id",uid).limit(1).then(function(r){var c=r.data&&r.data[0]&&r.data[0].circles,m=document.getElementById("wbhome");if(!m)return;
  if(!c){m.innerHTML='<div class="lbc"><b>Leaderboard</b><p class="small muted">Create or join a circle to compete with friends.</p><button class="wbb alt" data-o="1">Circles</button></div>';wire(m);return}
  sb.rpc("circle_leaderboard",{cid:c.id}).then(function(x){var t='<div class="lbc"><b>'+esc(c.name)+' this week</b>';
   (x.data||[]).slice(0,3).forEach(function(p,i){t+='<div class="r"><span>'+(i+1)+'. '+esc(p.name)+'</span><b>'+p.score+'</b></div>'});
   t+='<button class="wbb alt" data-o="'+c.id+'">Full leaderboard</button></div>';hc={t:Date.now(),html:t};var m2=document.getElementById("wbhome");if(m2){m2.innerHTML=t;wire(m2)}})})}
window.WB={home:homeCard};
var rt={end:0,iv:null,ctx:null,pill:null};
function rsecs(){try{var v=localStorage.getItem("wb-rest");return v==null?60:parseInt(v,10)}catch(e){return 60}}
function beep(){try{var c=rt.ctx;var o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=880;g.gain.value=.15;o.start();o.stop(c.currentTime+.35)}catch(e){}}
function stopRest(){clearInterval(rt.iv);if(rt.pill){rt.pill.remove();rt.pill=null}}
function tick(){if(!rt.pill)return;var left=Math.ceil((rt.end-Date.now())/1000);
 if(left>0){rt.pill.firstChild.textContent="Rest "+Math.floor(left/60)+":"+String(left%60).padStart(2,"0");return}
 clearInterval(rt.iv);rt.pill.firstChild.textContent="Rest over, go!";rt.pill.classList.add("done");beep();try{navigator.vibrate&&navigator.vibrate([200,100,200])}catch(e){}setTimeout(stopRest,4000)}
function startRest(){var s=rsecs();if(!s)return;stopRest();
 try{rt.ctx=rt.ctx||new (window.AudioContext||window.webkitAudioContext)();if(rt.ctx.state==="suspended")rt.ctx.resume()}catch(e){}
 rt.end=Date.now()+s*1000;rt.pill=el('<div class="wbrt"><span></span><button>Skip</button></div>');rt.pill.lastChild.onclick=stopRest;document.body.appendChild(rt.pill);tick();rt.iv=setInterval(tick,250)}
function restPicker(){var box=el('<div class="rtp"><span class="small muted">Rest timer</span></div>');var cur=rsecs();
 [[0,"Off"],[15,"15s"],[30,"30s"],[60,"60s"],[90,"90s"],[120,"120s"]].forEach(function(o){var b=document.createElement("button");b.textContent=o[1];b.setAttribute("aria-pressed",o[0]===cur?"true":"false");
  b.onclick=function(){try{localStorage.setItem("wb-rest",o[0])}catch(e){}box.querySelectorAll("button").forEach(function(x){x.setAttribute("aria-pressed","false")});b.setAttribute("aria-pressed","true")};box.appendChild(b)});return box}
window.WBT={start:startRest,picker:restPicker};
function msg(t){var m=document.getElementById("wbm");if(m)m.textContent=t}
function login(){
 var o=el('<div class="wbo" id="wblogin"><div class="in"><h1>Workout Battle</h1><p class="muted">Sign in with your email. We email you a link and a 6-digit code (use the code if you installed the app to your home screen).</p><input id="wbe" type="email" placeholder="you@email.com" autocomplete="email"><button class="wbb" id="wbs">Send link</button><div id="wbcw" hidden><input id="wbt" inputmode="numeric" placeholder="6-digit code"><button class="wbb" id="wbv">Sign in with code</button></div><p id="wbm" class="small muted"></p></div></div>');
 document.body.appendChild(o);
 $(o,"#wbs").onclick=function(){var e=$(o,"#wbe").value.trim();if(!e)return;msg("Sending...");
  sb.auth.signInWithOtp({email:e,options:{emailRedirectTo:location.origin+"/"}}).then(function(r){if(r.error)msg(r.error.message);else{msg("Sent. Check your email.");$(o,"#wbcw").hidden=false}})};
 $(o,"#wbv").onclick=function(){sb.auth.verifyOtp({email:$(o,"#wbe").value.trim(),token:$(o,"#wbt").value.trim(),type:"email"}).then(function(r){if(r.error)msg(r.error.message)})}}
function start(s){if(uid)return;uid=s.user.id;var l=document.getElementById("wblogin");if(l)l.remove();done();
 var b=el('<button class="wbfab">Circles</button>');b.onclick=function(){openPanel()};document.body.appendChild(b);
 var c=null;try{c=localStorage.getItem("wbJoin");localStorage.removeItem("wbJoin")}catch(e){}
 if(c)sb.rpc("join_circle",{code:c}).then(function(r){if(r.error)alert(r.error.message);else openPanel(r.data)})}
function openPanel(cid){var o=el('<div class="wbo"><div class="in">Loading...</div></div>');document.body.appendChild(o);paint(o,cid)}
async function paint(o,cid){
 var q=await Promise.all([sb.from("profiles").select("name,bodyweight").eq("id",uid).single(),sb.from("circle_members").select("circles(id,name,invite_code)").eq("user_id",uid)]);
 var p=q[0].data||{},cs=(q[1].data||[]).map(function(x){return x.circles}).filter(Boolean);
 cid=cid||(cs[0]&&cs[0].id);var cur=cs.filter(function(c){return c.id===cid})[0];
 var lb=cur?((await sb.rpc("circle_leaderboard",{cid:cid})).data||[]):[];
 var h='<div class="in"><button class="wbb alt" id="wbx">Close</button><h1>Circles</h1><h2>You</h2><label>Display name<input id="wbn" value="'+esc(p.name)+'"></label><label>Bodyweight (lb). Private: only you can see it.<input id="wbw" inputmode="decimal" value="'+esc(p.bodyweight)+'"></label><button class="wbb" id="wbsv">Save</button><h2>Your circles</h2>';
 cs.forEach(function(c){h+='<button class="wbc'+(c.id===cid?' on':'')+'" data-c="'+c.id+'">'+esc(c.name)+'</button>'});
 if(!cs.length)h+='<p class="muted">None yet. Create one or join with a code below.</p>';
 if(cur){var link=location.origin+"/?join="+cur.invite_code;
  h+='<p class="small muted">Invite link: <b>'+esc(link)+'</b></p><button class="wbb alt" id="wbcp">Copy invite link</button><h2>This week (resets Monday)</h2><p class="small muted">Score = 50 per workout (max 5) + 10 per streak week + improvement over your recent bests + small bodyweight bonus.</p>';
  lb.forEach(function(r,i){h+='<div class="wbr'+(r.user_id===uid?' me':'')+'"><b>'+(i+1)+'</b><div><div>'+esc(r.name)+' <span class="muted">Lv '+r.level+'</span></div><div class="small muted">'+r.workouts+' workouts, '+r.streak+'-wk streak, +'+r.improvement+' improvement, '+r.xp+' XP</div></div><b>'+r.score+'</b></div>'})}
 h+='<h2>New circle</h2><input id="wbcn" placeholder="Circle name"><button class="wbb" id="wbnc">Create</button><h2>Join a circle</h2><input id="wbjc" placeholder="Invite code"><button class="wbb" id="wbjn">Join</button><h2></h2><button class="wbb alt" id="wbso">Sign out</button></div>';
 o.innerHTML=h;
 $(o,"#wbx").onclick=function(){o.remove()};
 $(o,"#wbsv").onclick=function(){var w=parseFloat($(o,"#wbw").value);sb.from("profiles").update({name:$(o,"#wbn").value.trim()||"Lifter",bodyweight:isFinite(w)?w:null}).eq("id",uid).then(function(r){if(r.error)alert(r.error.message);else paint(o,cid)})};
 o.querySelectorAll("[data-c]").forEach(function(b){b.onclick=function(){paint(o,b.getAttribute("data-c"))}});
 var cp=$(o,"#wbcp");if(cp)cp.onclick=function(){navigator.clipboard.writeText(location.origin+"/?join="+cur.invite_code).then(function(){cp.textContent="Copied"})};
 $(o,"#wbnc").onclick=function(){sb.rpc("create_circle",{cname:$(o,"#wbcn").value}).then(function(r){if(r.error)alert(r.error.message);else paint(o,r.data.id)})};
 $(o,"#wbjn").onclick=function(){sb.rpc("join_circle",{code:$(o,"#wbjc").value}).then(function(r){if(r.error)alert(r.error.message);else paint(o,r.data)})};
 $(o,"#wbso").onclick=function(){sb.auth.signOut().then(function(){location.reload()})}}
if(!C.url||C.url.indexOf("PASTE")===0){document.body.appendChild(el('<div class="wbo"><div class="in"><h1>Almost there</h1><p>Open config.js and paste in your Supabase URL and key.</p></div></div>'))}
else{sb=supabase.createClient(C.url,C.key,{auth:{persistSession:true,detectSessionInUrl:true}});
 sb.auth.getSession().then(function(r){if(r.data.session)start(r.data.session);else login()});
 sb.auth.onAuthStateChange(function(e,s){if(s)start(s)})}
})();
