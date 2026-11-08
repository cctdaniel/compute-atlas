import {expect,test} from '@playwright/test';

test('attention: causal future values cannot alter the first output; cross attention has separate query/key axes',async({page})=>{
 await page.goto('/ai-ml/l20');
 const scene=page.locator('[data-current-scene]:visible');
 for(let i=0;i<5;i++)await page.getByRole('button',{name:'Next step',exact:true}).click();
 await expect(scene.locator('.training-readouts > div').first().locator('dd')).toHaveText('[2, 0]');
 await page.getByRole('combobox').selectOption('future-value');
 for(let i=0;i<5;i++)await page.getByRole('button',{name:'Next step',exact:true}).click();
 await expect(scene.locator('.training-readouts > div').first().locator('dd')).toHaveText('[2, 0]');
 await page.getByRole('combobox').selectOption('cross');
 await expect(scene.locator('.attention-grid').first().locator('tbody tr')).toHaveCount(2);
 await expect(scene.locator('.attention-grid').first().locator('thead th')).toHaveCount(4);
});

test('tokenizer: visible literal role text and trusted role IDs remain distinct',async({page})=>{
 await page.goto('/ai-ml/l22');
 const next=page.getByRole('button',{name:'Next step',exact:true}),scene=page.locator('[data-current-scene]:visible');
 for(let i=0;i<6;i++)await next.click();
 await expect(scene.locator('.training-readouts dd').last()).toHaveText('[96, 101, 103, 99, 98]');
 await page.getByRole('combobox').selectOption('system-role');
 for(let i=0;i<6;i++)await next.click();
 await expect(scene.locator('.training-readouts dd').last()).toHaveText('[97, 101, 103, 99, 98]');
 await page.getByRole('combobox').selectOption('literal-role');
 for(let i=0;i<6;i++)await next.click();
 await expect(scene.getByRole('heading',{name:'Encode the body: <system>lower',exact:true})).toBeVisible();
 await expect(scene.locator('.training-readouts dd').first()).toHaveText('user');
});

test('language modeling: generation stops and known targets have a separate scoring view',async({page})=>{
 await page.goto('/ai-ml/l23');
 const next=page.getByRole('button',{name:'Next step',exact:true}),scene=page.locator('[data-current-scene]:visible');
 while(await next.isEnabled())await next.click();
 await expect(scene.locator('.lm-stop')).toHaveText('Status: End token');
 await expect(scene.locator('.lm-prefix')).toContainText('tea');
 await page.getByRole('combobox').selectOption('loop');
 while(await next.isEnabled())await next.click();
 await expect(scene.locator('.lm-stop')).toHaveText('Status: Token limit');
 await page.getByRole('combobox').selectOption('training-tea');
 while(await next.isEnabled())await next.click();
 await expect(scene.locator('.teacher-rows li')).toHaveCount(4);
 await expect(scene.locator('.teacher-rows li').first()).toContainText('Allowed prefix: <bos>');
});
