import asyncio,json
from pathlib import Path
from playwright.async_api import async_playwright
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,executable_path='/usr/bin/google-chrome',args=['--no-sandbox']);page=await browser.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  await page.goto('http://localhost:4200');await page.wait_for_selector('.product-card');await page.screenshot(path='/home/user/infinie/data/home-desktop.png',full_page=True)
  print('HOME',await page.locator('h1').inner_text(),'cards',await page.locator('.product-card').count())
  await page.goto('http://localhost:4200/catalog?q=песочная');await page.wait_for_selector('.product-card');print('SEARCH',await page.locator('.product-card').count());assert await page.locator('.product-card').count()==1
  await page.goto('http://localhost:4200/category/zhenskie');await page.wait_for_selector('.product-card');print('WOMEN',await page.locator('.product-card').count());assert await page.locator('.product-card').count()==3
  await page.goto('http://localhost:4200/product/infinie-sp-oversize-tshirt');await page.wait_for_selector('.kaspi-button');print('BLACK',await page.locator('.kaspi-button').get_attribute('href'));await page.get_by_role('button',name='Белый',exact=True).click();print('WHITE',await page.locator('.kaspi-button').get_attribute('href'));assert '147729121' in await page.locator('.kaspi-button').get_attribute('href');assert 'M004' in await page.locator('.main-image img').get_attribute('src');await page.wait_for_selector('.review');print('REVIEWS',await page.locator('.review').count());await page.screenshot(path='/home/user/infinie/data/product-desktop.png',full_page=True)
  await page.get_by_role('button',name='Увеличить фотографию').click();assert await page.locator('.lightbox').count()==1;await page.keyboard.press('Escape');assert await page.locator('.lightbox').count()==0
  await page.goto('http://localhost:4200/admin');await page.wait_for_selector('.login-box');print('ADMIN protected',await page.locator('.login-box h1').inner_text())
  await page.set_viewport_size({'width':390,'height':844});await page.goto('http://localhost:4200');await page.wait_for_selector('.product-card');await page.screenshot(path='/home/user/infinie/data/home-mobile.png',full_page=True);assert await page.evaluate('document.documentElement.scrollWidth<=window.innerWidth');await page.get_by_role('button',name='Открыть меню').click();assert await page.locator('.nav.open').count()==1
  await page.goto('http://localhost:4200/product/infinie-sp-oversize-tshirt');await page.wait_for_selector('.kaspi-button');assert await page.evaluate('document.documentElement.scrollWidth<=window.innerWidth');await page.screenshot(path='/home/user/infinie/data/product-mobile.png',full_page=True)
  print('JS ERRORS',errors);assert not errors
  await browser.close()
asyncio.run(main())
