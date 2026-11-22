import asyncio
from playwright.async_api import async_playwright
BASE="http://localhost:8765/index.html"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await (await b.new_context(viewport={"width":390,"height":800})).new_page(); errs=[]
        pg.on("pageerror",lambda e:errs.append("PAGEERR "+str(e))); pg.on("console",lambda m:errs.append("CONSOLE "+m.text) if m.type=="error" else None)
        await pg.goto(BASE); await pg.wait_for_selector("h1"); await pg.fill("#n","Amina"); await pg.get_by_role("button",name="Create").click(); await pg.wait_for_selector("text=Level 1")
        print("1 lessons on home:", await pg.locator("button.card.row").count(), "(expect 58 lessons + library/prompt rows not here)")
        await pg.get_by_role("button",name="✍️").first.click(); await pg.wait_for_selector("text=Copy typing round")
        print("2 writing studio prompts listed:", await pg.locator("text=Introduce your family").count(), await pg.locator("text=A short essay: my day").count())
        await pg.get_by_role("button",name="Copy typing round").nth(1).click() if await pg.get_by_role("button",name="Copy typing round").count()>1 else await pg.get_by_role("button",name="Copy typing round").click()
        await pg.wait_for_selector("#cp")
        right=0
        for i in range(6):
            exp=await pg.locator(".card.flash .ar").first.inner_text()
            # type the sentence WITHOUT vowel marks (letters-only mode) – answer wrong on the 6th on purpose
            import re
            plain=re.sub(r"[\u064B-\u065F\u0670]","",exp)
            await pg.fill("#cp", plain if i<5 else "خطأ")
            await pg.get_by_role("button",name="Check",exact=True).click(); await pg.wait_for_selector("main [role=status]")
            st=await pg.inner_text("main [role=status]"); right+= "Correct" in st
            await pg.locator("main [role=status] button").click()
        await pg.wait_for_selector("text=Test score")
        print("3 copy round result:", (await pg.inner_text("main")).replace("\n"," | ")[:120], "| correct seen:", right)
        # guided writing
        await pg.get_by_role("button",name="Learn",exact=False).first.click() if False else None
        await pg.locator("nav.tabs button",has_text="Learn").click(); await pg.get_by_role("button",name="✍️").first.click(); await pg.wait_for_selector("text=Guided writing")
        await pg.locator("button.card.row",has_text="Introduce your family").click(); await pg.wait_for_selector("textarea")
        await pg.fill("textarea","هذا ابي.")
        await pg.get_by_role("button",name="Check my writing").click(); await pg.wait_for_selector("text=Checklist")
        print("4 weak draft checklist:", (await pg.inner_text("main [role=status]")).replace("\n"," | ")[:200])
        await pg.fill("textarea","هٰذَا أَبِي. هُوَ كَبِيرٌ. هٰذِهِ أُمِّي. هِيَ جَمِيلَةٌ.")
        await pg.get_by_role("button",name="Check my writing").click(); await pg.wait_for_timeout(400)
        t=await pg.inner_text("main [role=status]"); print("5 full draft all ticked:", "⬜" not in t, "| words line:", [l for l in t.splitlines() if l.startswith("Words")])
        await pg.get_by_role("button",name="Show model answer").click(); await pg.wait_for_selector("text=Model answer")
        print("6 model shown, draft kept in textarea:", "هٰذَا أَبِي" in await pg.input_value("textarea"))
        await pg.reload(); await pg.wait_for_selector("text=Level 1"); await pg.get_by_role("button",name="✍️").first.click(); await pg.locator("button.card.row",has_text="Introduce your family").click(); await pg.wait_for_selector("textarea")
        print("7 draft persisted after reload:", "هُوَ كَبِيرٌ" in await pg.input_value("textarea"))
        # advanced lesson + passage
        await pg.locator("nav.tabs button",has_text="Learn").click()
        await pg.locator("button.card.row",has_text="The passive voice").click(); await pg.wait_for_selector("text=What you will learn")
        print("8 passive lesson opens:", "كُتِبَ" in await pg.inner_text("main"))
        await pg.locator("nav.tabs button",has_text="Learn").click(); await pg.locator("button.card",has_text="Reading library").click()
        print("9 library passages:", await pg.locator("button.card.row").count())
        await pg.locator("nav.tabs button",has_text="Settings").click(); await pg.get_by_role("button",name="العربية").click(); await pg.locator("nav.tabs button",has_text="تعلّم").click()
        await pg.get_by_role("button",name="✍️").first.click(); await pg.wait_for_selector("text=الكتابة الموجّهة")
        ov=await pg.evaluate("document.documentElement.scrollWidth-document.documentElement.clientWidth"); print("10 Arabic writing studio overflow px:", ov)
        print("ERRORS:", errs or "none"); await b.close()
asyncio.run(main())
