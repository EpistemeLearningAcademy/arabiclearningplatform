import asyncio, zlib, struct, json, sys
from playwright.async_api import async_playwright
BASE=sys.argv[1] if len(sys.argv)>1 else "http://localhost:8765/index.html"
def png(path,rgb):
    w=h=40; raw=b"".join(b"\x00"+bytes(rgb)*w for _ in range(h))
    def ch(t,d): c=struct.pack(">I",len(d))+t+d; return c+struct.pack(">I",zlib.crc32(t+d)&0xffffffff)
    open(path,"wb").write(b"\x89PNG\r\n\x1a\n"+ch(b"IHDR",struct.pack(">IIBBBBB",w,h,8,2,0,0,0))+ch(b"IDAT",zlib.compress(raw))+ch(b"IEND",b""))
png("/tmp/logo.png",(11,61,46)); png("/tmp/sig.png",(30,30,120)); png("/tmp/stamp.png",(180,40,40)); png("/tmp/photo.png",(230,120,60))
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={"width":390,"height":844},accept_downloads=True); pg=await ctx.new_page(); errs=[]
        pg.on("pageerror",lambda e:errs.append("PAGEERR "+str(e))); pg.on("console",lambda m:errs.append("CONSOLE "+m.text) if m.type=="error" else None)
        await pg.add_init_script("window.__played=[];const A=window.Audio;window.Audio=function(...a){const x=new A(...a);x.addEventListener('playing',()=>window.__played.push(x.src));return x}")
        await pg.goto(BASE); await pg.wait_for_selector(".hero"); await pg.screenshot(path="/tmp/shots/1_welcome.png")
        print("1 welcome hero:", (await pg.inner_text(".hero")).replace("\n"," | ")[:80])
        await pg.fill("#n","Amina"); await pg.get_by_role("button",name="Create").click(); await pg.wait_for_selector(".hero-home")
        await pg.screenshot(path="/tmp/shots/2_home.png"); print("2 home hero + ring:", await pg.locator(".ring").count(), "| tiles:", await pg.locator("[data-mod]").count())
        # admin without PIN, set PIN
        await pg.locator("nav.tabs button",has_text="Settings").click(); await pg.get_by_role("button",name="🛠 Admin").click(); await pg.wait_for_selector("text=Admin PIN")
        await pg.locator("details:has-text('Admin PIN') summary").click(); await pg.fill("#np","1234"); await pg.get_by_role("button",name="Save PIN").click(); await pg.wait_for_selector("text=A PIN is set")
        print("3 PIN set")
        await pg.get_by_role("button",name="← Back").click(); await pg.get_by_role("button",name="🛠 Admin").click(); await pg.wait_for_selector("text=Enter PIN")
        await pg.fill("#pin","9999"); await pg.get_by_role("button",name="Unlock").click(); wrong=await pg.locator("text=not correct").count()
        await pg.fill("#pin","1234"); await pg.get_by_role("button",name="Unlock").click(); await pg.wait_for_selector("text=Certificate and branding")
        print("4 wrong PIN rejected:", wrong==1, "| right PIN opens admin: True")
        # centre also gated
        await pg.get_by_role("button",name="← Back").click(); await pg.get_by_role("button",name="Parent & teacher centre").click(); print("5 centre gated by PIN:", await pg.locator("text=Enter PIN").count()==1)
        await pg.fill("#pin","1234"); await pg.get_by_role("button",name="Unlock").click(); await pg.wait_for_selector("text=Learners on this device")
        # branding
        await pg.get_by_role("button",name="← Back").click(); await pg.get_by_role("button",name="🛠 Admin").click(); await pg.fill("#pin","1234"); await pg.get_by_role("button",name="Unlock").click()
        await pg.locator("details:has-text('Certificate and branding') summary").click()
        await pg.fill("#b-org-en","Episteme Learning Academy (ELA)"); await pg.fill("#b-sn","Dr. A. Teacher"); await pg.fill("#b-st-en","Director")
        await pg.get_by_role("button",name="Save",exact=True).click(); await pg.wait_for_timeout(300)
        for kind,f in [("Logo","/tmp/logo.png"),("Signature","/tmp/sig.png"),("Stamp","/tmp/stamp.png")]:
            await pg.locator("details[open] .card",has_text=kind).locator("input[type=file]").set_input_files(f); await pg.wait_for_timeout(500)
            await pg.locator("details:has-text('Certificate and branding') summary").click() if await pg.locator("details[open]:has-text('Certificate and branding')").count()==0 else None
        await pg.get_by_role("button",name="Preview certificate").click(); await pg.wait_for_selector(".cert")
        await pg.screenshot(path="/tmp/shots/3_cert.png",full_page=True)
        c=await pg.evaluate("({imgs:[...document.querySelectorAll('.cert img')].map(i=>i.className+':'+(i.src.startsWith('data:')?'device':'repo')),txt:document.querySelector('.cert').innerText.replace(/\\n+/g,' | ')})")
        print("6 certificate preview images:", c["imgs"]); print("   text:", c["txt"][:260])
        await pg.get_by_role("button",name="← Back").click(); await pg.wait_for_selector("text=Certificate and branding")
        await pg.reload(); await pg.wait_for_selector(".hero-home"); await pg.locator("nav.tabs button",has_text="Settings").click(); await pg.get_by_role("button",name="🛠 Admin").click()
        print("6b after reload PIN still required:", await pg.locator("text=Enter PIN").count()==1)
        await pg.fill("#pin","1234"); await pg.get_by_role("button",name="Unlock").click(); await pg.locator("details:has-text('Certificate and branding') summary").click()
        print("6c branding text persisted:", await pg.input_value("#b-org-en"), "| device images persisted:", await pg.locator("details[open] img.thumb").count())
        # modules toggle
        await pg.locator("details:has-text('Activities learners can see') summary").click(); await pg.locator("label:has-text('Listening lab') input").uncheck(); await pg.wait_for_timeout(300)
        await pg.get_by_role("button",name="← Back").click(); await pg.locator("nav.tabs button",has_text="Learn").click()
        print("7 Listening tile hidden:", await pg.locator("[data-mod=listening]").count()==0, "| others still there:", await pg.locator("[data-mod]").count())
        # pictures
        await pg.locator("nav.tabs button",has_text="Settings").click(); await pg.get_by_role("button",name="🛠 Admin").click(); await pg.fill("#pin","1234"); await pg.get_by_role("button",name="Unlock").click()
        await pg.locator("details:has-text('Vocabulary pictures') summary").click(); await pg.locator("details[open] .card.tile").first.locator("input[type=file]").set_input_files("/tmp/photo.png"); await pg.wait_for_timeout(600)
        await pg.get_by_role("button",name="← Back").click(); await pg.locator("nav.tabs button",has_text="Learn").click(); await pg.locator("button.card.tile",has_text="Animals").click(); await pg.wait_for_selector(".flash")
        print("8 photo shown instead of emoji on flashcard:", await pg.locator(".flash .pic img").count()==1); await pg.screenshot(path="/tmp/shots/4_flash.png")
        # audio
        await pg.get_by_role("button",name="🔊 Listen (device voice)").click() if await pg.get_by_role("button",name="🔊 Listen (device voice)").count() else await pg.locator("button:has-text('🔊')").first.click()
        await pg.wait_for_timeout(800); pl=await pg.evaluate("window.__played"); bn=await pg.inner_text("#status") if await pg.locator("#status:not([hidden])").count() else ""
        print("9 audio: playing events:", [x.split('/')[-1] for x in pl], "| banner:", bn)
        # next word has no audio file -> device voice / honest message
        await pg.get_by_role("button",name="Next →").click(); await pg.locator("button:has-text('🔊')").first.click(); await pg.wait_for_timeout(500)
        print("   word without audio -> message:", (await pg.inner_text("#status")) if await pg.locator("#status:not([hidden])").count() else "(no banner)")
        # listening pool w/o voice: only 1 audio word -> disabled message
        # dashboard + archive round trip
        await pg.evaluate("""async()=>{await new Promise(res=>{const r=indexedDB.open('kalimati');r.onsuccess=()=>{const db=r.result,tx=db.transaction('profiles','readwrite'),st=tx.objectStore('profiles');st.getAll().onsuccess=e=>{const a=e.target.result.find(p=>p.name==='Amina');a.progress.lessons={'b-les-letters-01':{completed:true,completedAt:Date.now(),best:90}};a.progress.certificates={'cert-intermediate-verbs':Date.now()};a.progress.writing={'w-family-01':{text:'x',ok:true}};a.progress.xp=77;st.put(a)};tx.oncomplete=res}})}""")
        await pg.reload(); await pg.wait_for_selector(".hero-home"); await pg.locator("nav.tabs button",has_text="Progress").click(); await pg.wait_for_selector("text=This week"); await pg.screenshot(path="/tmp/shots/5_dashboard.png",full_page=True)
        await pg.locator("nav.tabs button",has_text="Settings").click()
        async with pg.expect_download() as dl: await pg.get_by_role("button",name="Export learner data").click()
        d=await dl.value; data=json.load(open(await d.path(),encoding="utf8")); print("10 export has lessons/certs/writing:", list(data["progress"]["lessons"]), list(data["progress"]["certificates"]), list(data["progress"]["writing"]))
        await pg.set_input_files("input[type=file][accept='application/json']", await d.path()); await pg.wait_for_selector("text=Level 1")
        got=await pg.evaluate("""()=>new Promise(res=>{const r=indexedDB.open('kalimati');r.onsuccess=()=>{const t=r.result.transaction('profiles').objectStore('profiles').getAll();t.onsuccess=()=>res(t.result.map(p=>[p.name,p.progress.xp,Object.keys(p.progress.lessons||{}).length,Object.keys(p.progress.certificates||{}).length,Object.keys(p.progress.writing||{}).length]))}})""")
        print("11 after import (name,xp,lessons,certs,writing):", got)
        # backup all + register
        await pg.locator("nav.tabs button",has_text="Settings").click(); await pg.get_by_role("button",name="🛠 Admin").click(); await pg.fill("#pin","1234"); await pg.get_by_role("button",name="Unlock").click(); await pg.locator("summary").filter(has_text="Data").first.click()
        async with pg.expect_download() as d1: await pg.get_by_role("button",name="Back up all learners").click()
        bk=json.load(open(await (await d1.value).path(),encoding="utf8")); print("12 backup-all learners:", len(bk["profiles"]))
        async with pg.expect_download() as d2: await pg.get_by_role("button",name="Certificate register (CSV)").click()
        print("   register:", open(await (await d2.value).path(),encoding="utf8").read().splitlines()[:3])
        await pg.locator("summary").filter(has_text="Content check").first.click(); await pg.get_by_role("button",name="Check lesson content").click(); await pg.wait_for_selector("text=Content check passed"); print("13 content check passes in admin")
        # Arabic + overflow on key screens
        await pg.get_by_role("button",name="← Back").click(); await pg.get_by_role("button",name="العربية").click(); await pg.locator("nav.tabs button",has_text="تعلّم").click(); await pg.wait_for_selector(".hero-home")
        await pg.screenshot(path="/tmp/shots/6_home_ar.png")
        res={}
        for n,sel in [("home","تعلّم"),("dash","التقدّم"),("settings","الإعدادات")]:
            await pg.locator("nav.tabs button",has_text=sel).click(); await pg.wait_for_timeout(300); res[n]=await pg.evaluate("document.documentElement.scrollWidth-document.documentElement.clientWidth")
        print("14 Arabic overflow px:", res)
        print("ERRORS:", errs or "none"); await b.close()
asyncio.run(main())
