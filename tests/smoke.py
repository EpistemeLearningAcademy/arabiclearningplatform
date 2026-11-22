import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={"width":390,"height":800}, has_touch=True)
        pg = await ctx.new_page(); errs=[]
        pg.on("pageerror", lambda e: errs.append("PAGEERR "+str(e)))
        pg.on("console", lambda m: errs.append("CONSOLE "+m.text) if m.type=="error" else None)
        await pg.goto("http://localhost:8765/index.html"); await pg.wait_for_selector("h1")
        print("1 profile screen:", await pg.inner_text("h1"))
        await pg.fill("#n","Amina"); await pg.click("text=Create")
        await pg.wait_for_selector("text=Level 1")
        print("2 home ok, lessons rows:", await pg.locator("button.card.row").count())
        # lesson flow
        await pg.click("text=Short vowel: fatḥa"); await pg.wait_for_selector("text=What you will learn")
        await pg.get_by_role("button", name="Practice", exact=True).click()
        for i in range(6):
            pass
            await pg.wait_for_selector(".opts button")
            btns = pg.locator(".opts button")
            await btns.nth(0).click()
            await pg.wait_for_selector("main [role=status]")
            await pg.click("button.primary")
        await pg.wait_for_selector("text=Test score")
        print("3 lesson quiz result:", (await pg.inner_text("main")).replace("\n"," | ")[:140])
        # double-answer prevention: answered buttons disabled
        # vocab quiz
        await pg.locator("nav.tabs button", has_text="Progress").click(); await pg.wait_for_selector("text=Badges")
        print("4 dashboard badges tiles:", await pg.locator(".grid .card.tile").count())
        # alphabet + tracing
        await pg.locator("nav.tabs button", has_text="Learn").click(); await pg.click("text=Arabic alphabet"); await pg.click(".grid button >> nth=1")
        await pg.get_by_role("button", name="✍️ Trace").click(); await pg.wait_for_selector("canvas")
        box = await pg.locator("canvas").bounding_box()
        await pg.mouse.move(box["x"]+box["width"]*0.3, box["y"]+box["height"]*0.5); await pg.mouse.down()
        for k in range(20): await pg.mouse.move(box["x"]+box["width"]*(0.3+0.02*k), box["y"]+box["height"]*0.5)
        await pg.mouse.up(); await pg.click("text=Check my tracing"); await pg.wait_for_selector("text=Letter covered")
        print("5 tracing:", (await pg.inner_text("main [role=status]")).replace("\n"," | "))
        # arabic UI + RTL
        await pg.locator("nav.tabs button", has_text="Settings").click(); await pg.get_by_role("button", name="العربية").click(); await pg.wait_for_timeout(300)
        print("6 dir/lang:", await pg.evaluate("document.documentElement.dir+' '+document.documentElement.lang"))
        await pg.locator("nav.tabs button", has_text="تعلّم").click(); await pg.wait_for_selector("text=المستوى")
        # overflow check
        ov = await pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
        print("7 horizontal overflow px (Arabic home):", ov)
        # persistence after reload
        await pg.reload(); await pg.wait_for_selector("text=المستوى")
        xp = await pg.evaluate("""async()=>{const r=indexedDB.open('kalimati');return await new Promise(res=>{r.onsuccess=()=>{const t=r.result.transaction('profiles').objectStore('profiles').getAll();t.onsuccess=()=>res(t.result.map(p=>[p.name,p.progress.xp,Object.keys(p.progress.lessons||{}).length]))}})}""")
        print("8 persisted after reload (name,xp,lessons):", xp)
        # builder + listening screens render
        await pg.click("text=🧩"); 
        await pg.wait_for_selector("text=بناء الجمل")
        print("9 builder screen ok")
        sw = await pg.evaluate("navigator.serviceWorker.getRegistration().then(r=>!!r)")
        print("10 service worker registered:", sw)
        print("ERRORS:", errs or "none")
        await b.close()
asyncio.run(main())
