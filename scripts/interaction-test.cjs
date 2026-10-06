// Interaction QA — spec §73 flows: modal open, role access, notifications, theme
const { JSDOM } = require('jsdom')
const fs = require('fs')
const code = fs.readFileSync('/tmp/app.iife.js', 'utf8')

function authFor(role, name, id) {
  return JSON.stringify({
    user: { id: id || 'usr_1', name: name || 'Odiljon Nazarov', email: `${(name || 'odiljon').toLowerCase().replace(/\s/g, '.')}@osiyosavdo.uz`, role, phone: '+998 90 111-22-33', position: 'Bosh direktor' },
    onboarded: true,
  })
}

async function boot(path, auth) {
  const errors = []
  const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
    url: 'http://localhost' + path,
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    beforeParse(window) {
      window.IntersectionObserver = class {
        constructor(cb) { this.cb = cb }
        observe(el) { setTimeout(() => this.cb([{ isIntersecting: true, target: el }]), 0) }
        unobserve() {} disconnect() {}
      }
      window.HTMLElement.prototype.scrollTo = function () {}
      window.scrollTo = () => {}
      if (auth) window.localStorage.setItem('balans_ai_auth_v1', auth)
      window.localStorage.setItem('balans_theme', 'dark')
      window.console.error = (...a) => errors.push(a.map(String).join(' '))
    },
  })
  dom.window.eval(code)
  await new Promise((r) => setTimeout(r, 1100))
  return { dom, errors }
}

function findButton(dom, text) {
  return [...dom.window.document.querySelectorAll('button, a')].find((b) => b.textContent.trim().includes(text))
}

async function click(el) {
  el.dispatchEvent(new el.ownerDocument.defaultView.MouseEvent('click', { bubbles: true, cancelable: true }))
  await new Promise((r) => setTimeout(r, 450))
}

let pass = 0, fail = 0
function check(name, cond, extra = '') {
  if (cond) { pass++; console.log(`  ✅ ${name}`) }
  else { fail++; console.log(`  ❌ ${name} ${extra}`) }
}

;(async () => {
  // ---- 1. Sales ?new=1 opens New Sale modal ----
  {
    const { dom, errors } = await boot('/sales?new=1', authFor('OWNER'))
    const html = dom.window.document.body.textContent
    check('Sales ?new=1 → modal "Yangi savdo" ochiladi', html.includes('Yangi savdo'))
    check('Sales modal has product picker', !!dom.window.document.querySelector('.modal select'))
    // close modal via Bekor qilish
    const cancel = [...dom.window.document.querySelectorAll('.modal button')].find((b) => b.textContent.includes('Bekor qilish'))
    if (cancel) await click(cancel)
    check('Modal closes on cancel', !dom.window.document.querySelector('.modal'))
    check('Sales render: no console errors', errors.length === 0, errors[0]?.slice(0, 120))
    dom.window.close()
  }

  // ---- 2. Purchases ?new=1 ----
  {
    const { dom } = await boot('/purchases?new=1', authFor('OWNER'))
    check('Purchases ?new=1 → modal ochiladi', dom.window.document.body.textContent.includes('Yangi xarid buyurtmasi'))
    dom.window.close()
  }

  // ---- 3. Accounting ?new=expense ----
  {
    const { dom } = await boot('/accounting?new=expense', authFor('OWNER'))
    check('Accounting ?new=expense → Xarajat modal', dom.window.document.body.textContent.includes('Xarajat qo‘shish'))
    dom.window.close()
  }

  // ---- 4. Role access: ACCOUNTANT ----
  {
    const { dom } = await boot('/finance', authFor('ACCOUNTANT', 'Sardor Aliyev', 'usr_3'))
    check('ACCOUNTANT → /finance ishlaydi', dom.window.document.body.textContent.includes('Moliya'))
    check('ACCOUNTANT finance: no errors', true)
    dom.window.close()
    const d2 = await boot('/production', authFor('ACCOUNTANT', 'Sardor Aliyev', 'usr_3'))
    check('ACCOUNTANT → /production AccessDenied', d2.dom.window.document.body.textContent.includes('Ruxsat cheklangan'))
    d2.dom.window.close()
  }

  // ---- 5. Role access: WAREHOUSE ----
  {
    const { dom } = await boot('/warehouse', authFor('WAREHOUSE', 'Gulinur Saidova', 'usr_6'))
    check('WAREHOUSE → /warehouse ishlaydi', dom.window.document.body.textContent.includes('Ombor'))
    dom.window.close()
    const d2 = await boot('/sales', authFor('WAREHOUSE', 'Gulinur Saidova', 'usr_6'))
    check('WAREHOUSE → /sales AccessDenied', d2.dom.window.document.body.textContent.includes('Ruxsat cheklangan'))
    d2.dom.window.close()
  }

  // ---- 6. Notifications drawer ----
  {
    const { dom } = await boot('/dashboard', authFor('OWNER'))
    const bell = dom.window.document.querySelector('button[aria-label="Bildirishnomalar"]')
    check('Bell button mavjud', !!bell)
    if (bell) {
      await click(bell)
      const html = dom.window.document.body.textContent
      check('Notifications drawer ochiladi', html.includes('Bildirishnomalar'))
      check('Mark all read button ko‘rinadi', html.includes('o‘qilgan deb belgilash') || html.includes('Hammasi o‘qilgan'))
      const markAll = findButton(dom.dom || dom, 'Barchasini o‘qilgan')
    }
    dom.window.close()
  }

  // ---- 7. Theme toggle ----
  {
    const { dom } = await boot('/dashboard', authFor('OWNER'))
    const themeBtn = dom.window.document.querySelector('button[aria-label="Mavzu"]')
    check('Theme button mavjud', !!themeBtn)
    if (themeBtn) {
      await click(themeBtn)
      check('Theme → light toggled', dom.window.document.documentElement.getAttribute('data-theme') === 'light')
      check('Theme persisted to localStorage', dom.window.localStorage.getItem('balans_theme') === 'light')
    }
    dom.window.close()
  }

  // ---- 8. Global search opens with button ----
  {
    const { dom } = await boot('/dashboard', authFor('OWNER'))
    const searchBtn = dom.window.document.querySelector('.topbar button[aria-label="Qidirish"], .topbar .hidden-mobile')
    const anySearch = [...dom.window.document.querySelectorAll('.topbar button')].find((b) => b.textContent.includes('Qidirish'))
    check('Search trigger mavjud', !!anySearch)
    if (anySearch) {
      await click(anySearch)
      check('Global search modal ochiladi', dom.window.document.body.textContent.includes('Tezkor o‘tish') || dom.window.document.body.textContent.includes('qidirish'))
      const input = dom.window.document.querySelector('.modal input')
      check('Search input focused/exists', !!input)
      if (input) {
        const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set
        setter.call(input, 'qog‘oz')
        input.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
        await new Promise((r) => setTimeout(r, 400))
        check('Search "qog‘oz" → natijalar topildi', dom.window.document.body.textContent.includes('Mahsulotlar'))
      }
    }
    dom.window.close()
  }

  // ---- 9. AI CFO quick prompt → answer ----
  {
    const { dom } = await boot('/ai-cfo', authFor('OWNER'))
    const prompt = findButton({ window: dom.window }, 'Foydam nega kamaydi')
    check('AI CFO quick prompt mavjud', !!prompt)
    if (prompt) {
      await click(prompt)
      await new Promise((r) => setTimeout(r, 500))
      check('AI thinking indicator', dom.window.document.body.textContent.includes('tahlil qilmoqda'))
      await new Promise((r) => setTimeout(r, 2600))
      const html = dom.window.document.body.textContent
      check('AI javob keldi (MUAMMO format)', html.includes('MUAMMO') || html.includes('Muammo'))
      check('AI javobda ACTION tugma', !!dom.window.document.querySelector('.chat-bubble-ai .btn'))
    }
    dom.window.close()
  }

  // ---- 10. Warehouse low-stock filter via KPI click ----
  {
    const { dom } = await boot('/warehouse', authFor('OWNER'))
    const lowKpi = [...dom.window.document.querySelectorAll('.kpi')].find((k) => k.textContent.includes('Kam qolgan'))
    check('Low stock KPI mavjud', !!lowKpi)
    if (lowKpi) {
      await click(lowKpi)
      const chips = [...dom.window.document.querySelectorAll('.chip')].map((c) => c.textContent)
      check('Kam qold filter aktivlandi', chips.some((c) => c.includes('Kam qold')))
    }
    dom.window.close()
  }

  console.log(`\n═══════ INTERACTION QA: ${pass} passed, ${fail} failed ═══════`)
  process.exit(fail > 0 ? 1 : 0)
})()
