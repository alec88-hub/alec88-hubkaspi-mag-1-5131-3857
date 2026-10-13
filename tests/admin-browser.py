import asyncio,os
from playwright.async_api import async_playwright
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']);pg=await b.new_page(viewport={'width':1440,'height':1000});errors=[];pg.on('pageerror',lambda e:errors.append(str(e)))
  await pg.goto('http://localhost:4200/admin');await pg.wait_for_selector('.login-box');await pg.get_by_label('Email',exact=True).fill(os.environ['TEST_ADMIN_EMAIL']);await pg.get_by_label('Пароль',exact=True).fill(os.environ['TEST_ADMIN_PASSWORD']);await pg.get_by_role('button',name='Войти',exact=True).click();await pg.wait_for_selector('.stats',timeout=20000);print('ADMIN login + dashboard verified');await pg.screenshot(path='/home/user/infinie/data/admin-desktop.png',full_page=True)
  await pg.get_by_role('button',name='Товары',exact=True).click();await pg.locator('tbody tr').first.get_by_role('button',name='Изменить').click();await pg.wait_for_selector('.edit-modal');await pg.get_by_label('Название',exact=True).fill('INFINIE SP Футболка оверсайз женская');await pg.get_by_role('button',name='Сохранить товар',exact=True).click();await pg.wait_for_selector('.notice');print('ADMIN UI edit saved')
  await pg.get_by_role('button',name='Импорт и экспорт',exact=True).click();await pg.locator('.upload-zone input').set_input_files('/home/user/infinie/data/source/products.csv');await pg.wait_for_selector('.import-preview',timeout=30000);assert '7' in await pg.locator('.import-preview').inner_text();print('ADMIN direct browser S3 upload + CSV preview verified');assert not errors;await b.close()
asyncio.run(main())
