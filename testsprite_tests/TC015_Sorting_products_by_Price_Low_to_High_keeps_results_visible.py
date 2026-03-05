import asyncio
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> Navigate to http://localhost:4173
        await page.goto("http://localhost:4173", wait_until="commit", timeout=10000)
        
        # -> Click on a visible category link from the home page (click 'Anillos' link).
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/header/div/nav[2]/ul/li/a').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # -> Open the sort dropdown and select the 'Precio: menor a mayor' (Price: Low to High) option.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/main/div/div/section/div[2]/select').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # --> Assertions to verify final state
        frame = context.pages[-1]
        # Assert that the sort dropdown contains the "Precio: menor a mayor" option and is visible
        elem = frame.locator('xpath=/html/body/div/div/main/div/div/section/div[2]/select')
        assert await elem.is_visible()
        text = await elem.inner_text()
        assert "Precio: menor a mayor" in text
        
        # Assert that a product from the product list is visible (first product title link)
        prod = frame.locator('xpath=/html/body/div/div/main/div/div/section/div[3]/div/article[1]/h3/a')
        assert await prod.is_visible()
        
        # Assert that the pagination control (page 2 button) is visible
        pag = frame.locator('xpath=/html/body/div/div/main/div/div/section/div[4]/button[2]')
        assert await pag.is_visible()
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    