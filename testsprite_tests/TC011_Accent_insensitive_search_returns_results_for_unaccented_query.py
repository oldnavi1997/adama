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
        
        # -> Click the search icon in the header (element [6]) to open the search input.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/header/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # -> Type 'café' (with accent) into the search input and check whether any product results appear (to determine if search is accent-sensitive).
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=/html/body/div/div/aside[3]/div[2]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('café')
        
        # -> Clear the search input, type 'cafe' (no accent) into the search input, wait for results to update, then check the search panel for visible results and capture the first product if present.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/aside[3]/div[2]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=/html/body/div/div/aside[3]/div[2]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('cafe')
        
        # --> Assertions to verify final state
        frame = context.pages[-1]
        frame = context.pages[-1]
        # Verify the search results panel is visible
        search_panel = frame.locator('xpath=/html/body/div/div/aside[3]')
        assert await search_panel.is_visible(), "Search results panel (aside[3]) is not visible"
        
        # Check if the page shows the 'No se encontraron productos' message for the search
        no_results = frame.locator('xpath=/html/body/div/div/aside[3]/div[2]/div[2]/div')
        if await no_results.is_visible():
            raise AssertionError("Search returned 'No se encontraron productos' for query 'cafe'. Search may be accent-sensitive or the search feature returned no matches.")
        
        # Verify at least one product result is visible (use the first product link on the page as an available product)
        first_product = frame.locator('xpath=/html/body/div/div/main/div/div/section/section[5]/div[2]/div/article[1]/a')
        assert await first_product.is_visible(), "Expected at least one product result to be visible."
        
        # Verify the first product link points to a product page (href contains '/producto/')
        href = await first_product.get_attribute('href')
        assert href and '/producto/' in href, f"First product href does not contain '/producto/': {href}"
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    