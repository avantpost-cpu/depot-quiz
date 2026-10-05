import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};
const esc=(v:unknown)=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!));
Deno.serve(async(req)=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
  try{
    const auth=req.headers.get("Authorization");
    if(!auth) return new Response(JSON.stringify({error:"Non autorisé"}),{status:401,headers:cors});
    const url=Deno.env.get("SUPABASE_URL")!, anon=Deno.env.get("SUPABASE_ANON_KEY")!;
    const db=createClient(url,anon,{global:{headers:{Authorization:auth}}});
    const {data:{user},error:userError}=await db.auth.getUser();
    if(userError||!user) return new Response(JSON.stringify({error:"Non autorisé"}),{status:401,headers:cors});
    const {session_id,to}=await req.json();
    if(!session_id||!to) throw new Error("Session ou destinataire manquant");
    const {data:sess,error:se}=await db.from("satisfaction_sessions").select("*").eq("id",session_id).single();
    const {data:rows,error:re}=await db.from("satisfaction_responses").select("*").eq("session_id",session_id);
    if(se||re||!sess) throw se||re||new Error("Session introuvable");
    const n=rows?.length||0;
    const avg=n?(rows!.reduce((a:number,x:any)=>a+Number(x.satisfaction||0),0)/n).toFixed(1):"—";
    const equipped=n?Math.round(rows!.filter((x:any)=>String(x.equipped).startsWith("Oui")).length*100/n):0;
    const newsletter=rows?.filter((x:any)=>x.newsletter==="Oui").length||0;
    const date=new Date(sess.event_date+"T12:00:00").toLocaleDateString("fr-FR");
    const html=`<div style="font-family:Arial,sans-serif;color:#063e54;max-width:680px;margin:auto">
      <h1 style="color:#e65013">Bilan de la sensibilisation</h1>
      <h2>${esc(sess.event_name)}</h2>
      <p><b>Date :</b> ${date}${sess.event_place?` &nbsp; <b>Lieu :</b> ${esc(sess.event_place)}`:""}</p>
      <div style="background:#f3efe9;padding:18px;border-radius:16px">
        <p><b>Participants :</b> ${n}</p><p><b>Satisfaction moyenne :</b> ${avg}/5</p>
        <p><b>Se sentent mieux outillés :</b> ${equipped}%</p><p><b>Souhaitent la newsletter :</b> ${newsletter}</p>
      </div>
      <h3 style="color:#e65013">Éléments marquants / appris</h3>
      ${rows?.filter((x:any)=>x.learned).map((x:any)=>`<p>• ${esc(x.learned)}</p>`).join("")||"<p>—</p>"}
      <h3 style="color:#e65013">Aspects les plus utiles</h3>
      ${rows?.filter((x:any)=>x.useful).map((x:any)=>`<p>• ${esc(x.useful)}</p>`).join("")||"<p>—</p>"}
      <h3 style="color:#e65013">Pistes d'amélioration</h3>
      ${rows?.filter((x:any)=>x.improve).map((x:any)=>`<p>• ${esc(x.improve)}</p>`).join("")||"<p>—</p>"}
      <p style="margin-top:28px;font-size:12px;color:#667">Récapitulatif généré depuis l’administration Rebond.</p>
    </div>`;
    const rr=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":`Bearer ${Deno.env.get("RESEND_SATISFACTION_API_KEY")}`,"Content-Type":"application/json"},body:JSON.stringify({
      from:Deno.env.get("RESEND_FROM")||"Rebond <onboarding@resend.dev>",to:[to],
      subject:`Rebond — Bilan de la sensibilisation du ${date}`,html
    })});
    const data=await rr.json();
    if(!rr.ok) return new Response(JSON.stringify(data),{status:rr.status,headers:cors});
    return new Response(JSON.stringify(data),{headers:cors});
  }catch(e){return new Response(JSON.stringify({error:e instanceof Error?e.message:String(e)}),{status:500,headers:cors})}
});