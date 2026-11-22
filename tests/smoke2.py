import asyncio, json
from playwright.async_api import async_playwright
BASE="http://localhost:8765/index.html"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={"width":390,"height":800},accept_downloads=True); pg=await ctx.new_page(); errs=[]
        pg.on("pageerror",lambda e:errs.append("PAGEERR "+str(e))); pg.on("console",lambda m:errs.append("CONSOLE "+m.text) if m.type=="error" else None)
        await pg.goto(BASE); await pg.wait_for_selector("h1")
        for name in ["Amina","Yusuf"]:
            if name!="Amina":
                await pg.locator("nav.tabs button",has_text="Settings").click(); await pg.get_by_role("button",name="Switch learner").click(); await pg.wait_for_selector("text=Who is learning?")
                await pg.get_by_role("button",name="+ New learner").click()
            await pg.fill("#n",name); await pg.get_by_role("button",name="Create").click(); await pg.wait_for_selector("text=Level 1")
        # Yusuf is current. Open centre from profile screen (no learner selected)
        await pg.locator("nav.tabs button",has_text="Settings").click(); await pg.get_by_role("button",name="Switch learner").click(); await pg.wait_for_selector("text=Who is learning?")
        await pg.get_by_role("button",name="Parent & teacher centre").click(); await pg.wait_for_selector("text=Learners on this device")
        print("1 centre lists learners:", await pg.locator(".card strong").all_inner_texts(), "| no-password note:", "no password" in (await pg.inner_text("main")))
        await pg.locator(".card",has_text="Amina").get_by_role("button",name="Open").click(); await pg.wait_for_selector("text=New assignment")
        await pg.select_option("#at","lesson"); await pg.select_option("#ag",index=1); await pg.fill("#an","Do this by Friday"); await pg.fill("#ad","2020-01-01")
        await pg.get_by_role("button",name="Assign",exact=True).click(); await pg.wait_for_selector("text=Overdue")
        print("2 assignment created, shows Overdue:", "Overdue" in await pg.inner_text("main"))
        await pg.get_by_role("button",name="Learner report").click(); await pg.wait_for_selector("table")
        async with pg.expect_download() as dl: await pg.get_by_role("button",name="Export CSV").click()
        d=await dl.value; txt=open(await d.path(),encoding="utf8").read()
        print("3 report ok; CSV header+rows:", txt.splitlines()[0], "| assignment row:", any(l.startswith('"assignment"') for l in txt.splitlines()))
        # learner side: Amina sees it, Yusuf does not
        for _ in range(3):
            await pg.get_by_role("button",name="← Back").click(); await pg.wait_for_timeout(250)
        await pg.wait_for_selector("text=Who is learning?")
        await pg.get_by_role("button",name="Yusuf").click(); await pg.wait_for_selector("text=Level 1")
        print("4 Yusuf sees assignment (should be False):", "Assigned to you" in await pg.inner_text("main"))
        await pg.locator("nav.tabs button",has_text="Settings").click(); await pg.get_by_role("button",name="Switch learner").click(); await pg.get_by_role("button",name="Amina").click(); await pg.wait_for_selector("text=Level 1")
        print("5 Amina sees assignment + note:", "Assigned to you" in await pg.inner_text("main"), "Do this by Friday" in await pg.inner_text("main"))
        # dashboard: challenges + certificates
        await pg.locator("nav.tabs button",has_text="Progress").click(); await pg.wait_for_selector("text=This week")
        print("6 dashboard challenges:", await pg.locator("h2:has-text('challenges') ~ .card").count(), "| certificates button:", await pg.get_by_role("button",name="🎓 Certificates").count())
        await pg.get_by_role("button",name="🎓 Certificates").click(); await pg.wait_for_selector("text=Not earned yet")
        print("7 certificates locked:", await pg.locator("text=Not earned yet").count())
        # inject progress: complete all 'verbs' module lessons with best 90 for Amina, then trigger save by learning a word
        await pg.evaluate("""async()=>{const idx=await (await fetch('content/index.json')).json();const ls=[];for(const f of idx.lessons){ls.push(...(await (await fetch('content/'+f)).json()).lessons)}
          const ids=ls.filter(l=>l.module==='verbs').map(l=>l.id);
          await new Promise(res=>{const r=indexedDB.open('kalimati');r.onsuccess=()=>{const db=r.result,tx=db.transaction('profiles','readwrite'),st=tx.objectStore('profiles');st.getAll().onsuccess=e=>{const a=e.target.result.find(p=>p.name==='Amina');a.progress.lessons=a.progress.lessons||{};ids.forEach(i=>a.progress.lessons[i]={completed:true,completedAt:Date.now(),best:90});st.put(a)};tx.oncomplete=res}})}""")
        await pg.reload(); await pg.wait_for_selector("text=Level 1")
        await pg.get_by_role("button",name="Animals").or_(pg.locator("button.card.tile",has_text="Animals")).first.click(); await pg.wait_for_selector("text=I learned this")
        await pg.get_by_role("button",name="⭐ I learned this").click(); await pg.wait_for_selector("#status:not([hidden])")
        banner=await pg.inner_text("#status"); print("8 banner after save:", banner)
        await pg.locator("nav.tabs button",has_text="Progress").click(); await pg.get_by_role("button",name="🎓 Certificates").click(); await pg.wait_for_selector("text=Earned")
        await pg.get_by_role("button",name="View certificate").click(); await pg.wait_for_selector("text=Certificate of Completion")
        print("9 certificate page:", (await pg.inner_text("main")).replace("\n"," | ")[:230])
        await pg.emulate_media(media="print"); vis=await pg.evaluate("[...document.querySelectorAll('button,nav.tabs')].every(e=>getComputedStyle(e).display==='none')")
        print("10 print hides buttons/nav:", vis); await pg.emulate_media(media="screen")
        await pg.reload(); await pg.locator("nav.tabs button",has_text="Progress").click(); await pg.get_by_role("button",name="🎓 Certificates").click()
        print("11 earned once after reload (Earned count):", await pg.locator("text=Earned").count())
        # Arabic
        await pg.locator("nav.tabs button",has_text="Settings").click(); await pg.get_by_role("button",name="العربية").click(); await pg.locator("nav.tabs button",has_text="التقدّم").click(); await pg.wait_for_selector("text=تحدّيات هذا الأسبوع")
        ov=await pg.evaluate("document.documentElement.scrollWidth-document.documentElement.clientWidth"); print("12 Arabic progress ok, overflow px:", ov)
        print("ERRORS:", errs or "none"); await b.close()
asyncio.run(main())
