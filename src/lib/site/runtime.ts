import { site } from "@/config/site";

/** The runtime injected into every published page: analytics, forms, optional badge. */
export function siteRuntimeJs() {
  const badgeHref = `${site.url}/?utm_source=badge&utm_medium=site`;
  return `(function(){
var s=document.currentScript,start=Date.now();
try{var src="",r=document.referrer;if(r){var h=new URL(r).hostname;if(h&&h!==location.hostname)src=h.replace(/^www\\./,"")}
var u=new URLSearchParams(location.search).get("utm_source");if(u)src=u.slice(0,60);
if(!/bot|crawl|spider|slurp|lighthouse|headless|preview/i.test(navigator.userAgent)&&navigator.sendBeacon)navigator.sendBeacon("/__sl/a",JSON.stringify({p:location.pathname,s:src}))}catch(e){}
function prep(f){if(f.querySelector("[name=_hp]"))return;var i=document.createElement("input");i.type="text";i.name="_hp";i.tabIndex=-1;i.autocomplete="off";i.setAttribute("aria-hidden","true");i.style.cssText="position:absolute;left:-9999px;width:1px;height:1px;opacity:0";f.appendChild(i)}
document.querySelectorAll("form[data-sl-form]").forEach(prep);
document.addEventListener("submit",function(e){var f=e.target;if(!f||!f.matches||!f.matches("form[data-sl-form]"))return;e.preventDefault();
var b=f.querySelector("[type=submit]");if(b)b.disabled=true;var d={},hp="";
new FormData(f).forEach(function(v,k){if(typeof v!=="string")return;if(k==="_hp"){hp=v;return}d[k]=d[k]?d[k]+", "+v:v});
fetch("/__sl/form",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({form:f.getAttribute("data-sl-form")||"Form",page:location.pathname,data:d,hp:hp,t:Date.now()-start})})
.then(function(r){return r.json().catch(function(){return{}}).then(function(j){if(!r.ok)throw new Error(j.error||"Something went wrong");
var ok=f.querySelector("[data-sl-success]");f.reset();if(ok){ok.hidden=false;ok.style.display="";ok.setAttribute("role","status")}else{alert("Thanks! Your message was sent.")}})})
.catch(function(err){alert(err.message||"Could not send. Please try again.")}).finally(function(){if(b)b.disabled=false})},true);
if(s&&s.getAttribute("data-badge")==="1"){var a=document.createElement("a");a.href=${JSON.stringify(badgeHref)};a.target="_blank";a.rel="noopener";
a.textContent="Made with ${site.name}";a.style.cssText="position:fixed;right:12px;bottom:12px;z-index:2147483000;font:600 12px/1 system-ui,sans-serif;background:#1c1917;color:#fff;padding:8px 12px;border-radius:999px;text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,.18);opacity:.92";
document.body.appendChild(a)}
})();`;
}
