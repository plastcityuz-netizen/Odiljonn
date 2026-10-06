// Full E2E flows — spec §73: REGISTER→ONBOARDING→DASHBOARD, CRUD, cross-module updates
const { JSDOM } = require('jsdom')
const fs = require('fs')
const code = fs.readFileSync('/tmp/app.iife.js', 'utf8')

function makeDom(path, setup) {
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
      window.console.error = (...a) => errors.push(a.map(String).join(' '))
      if (setup) setup(window)
    },
  })
  return { dom, errors }
}

async function click(el) {
  el.dispatchEvent(new el.ownerDocument.defaultView.MouseEvent('click', { bubbles: true, cancelable: true }))
  await new Promise((r) => setTimeout(r, 500))
}

function setInput(window, input, value) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
  setter.call(input, value)
  input.dispatchEvent(new window.Event('input', { bubbles: true }))
}

function setSelect(window, select, value) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set
  setter.call(select, value)
  select.dispatchEvent(new window.Event('change', { bubbles: true }))
}

let pass = 0, fail = 0
function check(name, cond, extra = '') {
  if (cond) { pass++; console.log(`  ✅ ${name}`) }
  else { fail++; console.log(`  ❌ ${name} ${extra}`) }
}

;(async () => {
  // ============ FLOW 1: REGISTER → ONBOARDING → DASHBOARD ============
  console.log('\n── FLOW: REGISTER → ONBOARDING → DASHBOARD ──')
  {
    const { dom, errors } = makeDom('/register')
    dom.window.eval(code)
    await new Promise((r) => setTimeout(r, 900))

    const inputs = [...dom.window.document.querySelectorAll('input')]
    check('Register form: 4 input mavjud', inputs.length >= 4)
    setInput(dom.window, inputs[0], 'Anvar Toshmatov')
    setInput(dom.window, inputs[1], 'anvar@yangibiznes.uz')
    setInput(dom.window, inputs[2], 'parol123')
    setInput(dom.window, inputs[3], 'parol123')
    const submit = [...dom.window.document.querySelectorAll('button')].find((b) => b.textContent.includes('Bepul boshlash'))
    await click(submit)
    await new Promise((r) => setTimeout(r, 900))

    check('Onboarding ochildi', dom.window.document.body.textContent.includes('Qadam 1 / 5'))
    const oInput = dom.window.document.querySelector('input')
    setInput(dom.window, oInput, 'Yangi Biznes MChJ')
    let next = [...dom.window.document.querySelectorAll('button')].find((b) => b.textContent.includes('Davom etish'))
    await click(next)
    check('Step 2: Biznes turi', dom.window.document.body.textContent.includes('Qadam 2 / 5'))
    await click([...dom.window.document.querySelectorAll('.chip')][1])
    await click([...dom.window.document.querySelectorAll('button')].find((b) => b.textContent.includes('Davom etish')))
    check('Step 3: Xodimlar soni', dom.window.document.body.textContent.includes('Qadam 3 / 5'))
    await click([...dom.window.document.querySelectorAll('.chip')][1])
    await click([...dom.window.document.querySelectorAll('button')].find((b) => b.textContent.includes('Davom etish')))
    check('Step 4: Faoliyat', dom.window.document.body.textContent.includes('Qadam 4 / 5'))
    await click([...dom.window.document.querySelectorAll('.chip')][0])
    await click([...dom.window.document.querySelectorAll('button')].find((b) => b.textContent.includes('Davom etish')))
    check('Step 5: Modullar', dom.window.document.body.textContent.includes('Qadam 5 / 5'))
    await click([...dom.window.document.querySelectorAll('button')].find((b) => b.textContent.includes('Tayyor')))
    await new Promise((r) => setTimeout(r, 2200))
    check('Dashboardga o‘tdi', dom.window.document.body.textContent.includes('Salom, Anvar'), 'got: ' + dom.window.document.body.textContent.slice(0, 120))
    check('No console errors in register flow', errors.length === 0, errors[0]?.slice(0, 150))
    dom.window.close()
  }

  // ============ FLOW 2: NEW SALE → cross-module ============
  console.log('\n── FLOW: NEW SALE → stock/finance/customer yangilanadi ──')
  {
    const auth = JSON.stringify({ user: { id: 'usr_1', name: 'Odiljon Nazarov', email: 'odiljon@osiyosavdo.uz', role: 'OWNER' }, onboarded: true })
    const { dom, errors } = makeDom('/sales?new=1', (w) => w.localStorage.setItem('balans_ai_auth_v1', auth))
    dom.window.eval(code)
    await new Promise((r) => setTimeout(r, 1000))

    // read stock of first product before
    const dataBefore = JSON.parse(dom.window.localStorage.getItem('balans_ai_data_v1') || '{}')
    const finished = dataBefore.products.find((p) => p.type === 'finished')
    const stockBefore = finished.stock
    const ordersBefore = dataBefore.orders.length

    // add item to order
    const addItem = [...dom.window.document.querySelectorAll('.modal button')].find((b) => b.textContent.includes('Mahsulot qo‘shish'))
    check('Add item button topildi', !!addItem)
    await click(addItem)
    const qtyInput = dom.window.document.querySelector('.modal input[type="number"]')
    setInput(dom.window, qtyInput, '7')
    // submit
    const createBtn = [...dom.window.document.querySelectorAll('.modal button')].find((b) => b.textContent.includes('Savdoni yaratish'))
    await click(createBtn)
    await new Promise((r) => setTimeout(r, 900))

    check('Success toast chiqdi', dom.window.document.body.textContent.includes('Yangi savdo yaratildi'))
    check('Modal yopildi', !dom.window.document.querySelector('.modal'))

    // verify persisted state
    const dataAfter = JSON.parse(dom.window.localStorage.getItem('balans_ai_data_v1'))
    check('Order persisted (count +1)', dataAfter.orders.length === ordersBefore + 1)
    const prodAfter = dataAfter.products.find((p) => p.id === finished.id)
    check('Stock persisted (-7)', prodAfter.stock === stockBefore - 7, `before ${stockBefore} after ${prodAfter.stock}`)
    const newOrder = dataAfter.orders[0]
    check('New order has transaction ref', dataAfter.transactions.some((t) => t.ref?.id === newOrder.id))
    check('Notification added', dataAfter.notifications[0].title.includes('savdo'))
    check('CRUD flow: no console errors', errors.length === 0, errors[0]?.slice(0, 150))
    dom.window.close()
  }

  // ============ FLOW 3: LOGOUT ============
  console.log('\n── FLOW: LOGOUT → protected route redirect ──')
  {
    const auth = JSON.stringify({ user: { id: 'usr_1', name: 'Odiljon Nazarov', email: 'odiljon@osiyosavdo.uz', role: 'OWNER' }, onboarded: true })
    const { dom } = makeDom('/dashboard', (w) => w.localStorage.setItem('balans_ai_auth_v1', auth))
    dom.window.eval(code)
    await new Promise((r) => setTimeout(r, 900))
    const avatar = dom.window.document.querySelector('.topbar button[aria-label="Profil"]')
    check('Profile button mavjud', !!avatar)
    await click(avatar)
    const logoutBtn = [...dom.window.document.querySelectorAll('button')].find((b) => b.textContent.includes('Chiqish'))
    check('Logout button ochiladi', !!logoutBtn)
    if (logoutBtn) {
      await click(logoutBtn)
      await new Promise((r) => setTimeout(r, 700))
      check('Logout → landing sahifa', dom.window.document.body.textContent.includes('30 kun bepul') || dom.window.document.body.textContent.includes('Platformaga kirish'))
      check('Auth cleared', !dom.window.localStorage.getItem('balans_ai_auth_v1') || JSON.parse(dom.window.localStorage.getItem('balans_ai_auth_v1')).user === null)
    }
    dom.window.close()
  }

  // ============ FLOW 4: BILLING upgrade ============
  console.log('\n── FLOW: BILLING upgrade → plan o‘zgaradi ──')
  {
    const auth = JSON.stringify({ user: { id: 'usr_1', name: 'Odiljon Nazarov', email: 'odiljon@osiyosavdo.uz', role: 'OWNER' }, onboarded: true })
    const { dom, errors } = makeDom('/billing', (w) => w.localStorage.setItem('balans_ai_auth_v1', auth))
    dom.window.eval(code)
    await new Promise((r) => setTimeout(r, 900))
    const dataBefore = JSON.parse(dom.window.localStorage.getItem('balans_ai_data_v1'))
    check('Trial holatda', dom.window.document.body.textContent.includes('TRIAL'))
    // choose BIZNES via plan card button
    const biznesBtn = [...dom.window.document.querySelectorAll('button')].find((b) => b.textContent.includes('Bu tarifni tanlash'))
    check('Tarif tanlash tugmasi mavjud', !!biznesBtn)
    if (biznesBtn) {
      await click(biznesBtn)
      const confirmBtn = [...dom.window.document.querySelectorAll('.modal button')].find((b) => b.textContent.includes('Tasdiqlash'))
      check('Confirm modal ochiladi', !!confirmBtn)
      await click(confirmBtn)
      await new Promise((r) => setTimeout(r, 1300))
      const dataAfter = JSON.parse(dom.window.localStorage.getItem('balans_ai_data_v1'))
      check('Plan BIZNES’ga o‘zgartirildi', dataAfter.plan.name !== 'TRIAL', 'plan: ' + dataAfter.plan.name)
      check('Invoice qo‘shildi', dataAfter.plan.invoices.length > dataBefore.plan.invoices.length)
      check('Billing flow: no console errors', errors.length === 0, errors[0]?.slice(0, 150))
    }
    dom.window.close()
  }

  console.log(`\n═══════ FLOW QA: ${pass} passed, ${fail} failed ═══════`)
  process.exit(fail > 0 ? 1 : 0)
})()
