// Full runtime smoke test — renders every route in jsdom and captures console errors (spec §74)
const { JSDOM } = require('jsdom')
const fs = require('fs')
const code = fs.readFileSync('/tmp/app.iife.js', 'utf8')

const AUTH = JSON.stringify({
  user: { id: 'usr_1', name: 'Odiljon Nazarov', email: 'odiljon@osiyosavdo.uz', role: 'OWNER', phone: '+998 90 111-22-33', position: 'Bosh direktor' },
  onboarded: true,
})

const ROUTES = [
  ['/', null, 'BALANS AI', 'Landing'],
  ['/login', null, 'Platformaga kirish', 'Login'],
  ['/register', null, '30 kun bepul boshlang', 'Register'],
  ['/forgot-password', null, 'Parolni tiklash', 'Forgot'],
  ['/reset-password', null, 'Yangi parol', 'Reset'],
  ['/onboarding', AUTH, 'BALANS AI kompaniyangiz uchun tayyor|Qadam', 'Onboarding'],
  ['/dashboard', AUTH, 'Salom', 'Dashboard'],
  ['/ai-cfo', AUTH, 'AI CFO', 'AI CFO'],
  ['/sales', AUTH, 'Savdo', 'Sales'],
  ['/customers', AUTH, 'Mijozlar', 'Customers'],
  ['/warehouse', AUTH, 'Ombor', 'Warehouse'],
  ['/purchases', AUTH, 'Xaridlar', 'Purchases'],
  ['/production', AUTH, 'Ishlab chiqarish', 'Production'],
  ['/accounting', AUTH, 'Buxgalteriya', 'Accounting'],
  ['/finance', AUTH, 'Moliya', 'Finance'],
  ['/debts', AUTH, 'Qarzdorlik', 'Debts'],
  ['/hr', AUTH, 'HR', 'HR'],
  ['/reports', AUTH, 'Hisobotlar', 'Reports'],
  ['/analytics', AUTH, 'Analitika', 'Analytics'],
  ['/settings', AUTH, 'Sozlamalar', 'Settings'],
  ['/profile', AUTH, 'Profil', 'Profile'],
  ['/billing', AUTH, 'To‘lovlar va tarif', 'Billing'],
  ['/ne-bu-sahifa', null, '404|Sahifa topilmadi', '404'],
]

// unprotected app route without auth → should redirect to login
async function renderRoute(path, auth) {
  const errors = []
  const warnings = []
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
      window.matchMedia = window.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }))
      if (auth) window.localStorage.setItem('balans_ai_auth_v1', auth)
      window.localStorage.setItem('balans_theme', 'dark')
      const ce = window.console.error.bind(window.console)
      window.console.error = (...a) => { errors.push(a.map((x) => String(x?.stack || x)).join(' ')) }
      const cw = window.console.warn.bind(window.console)
      window.console.warn = (...a) => { warnings.push(a.map(String).join(' ')) }
    },
  })
  try {
    dom.window.eval(code)
  } catch (e) {
    errors.push('EVAL: ' + e.message)
  }
  await new Promise((r) => setTimeout(r, 1400))
  const html = dom.window.document.getElementById('root')?.innerHTML ?? ''
  dom.window.close()
  return { errors, warnings, html }
}

;(async () => {
  let pass = 0, fail = 0
  const t0 = Date.now()
  for (const [path, auth, marker, name] of ROUTES) {
    const { errors, warnings, html } = await renderRoute(path, auth)
    const found = new RegExp(marker).test(html)
    const blank = html.length < 300
    // filter benign warnings (React DevTools suggestion in jsdom)
    const realErrors = errors.filter((e) => !e.includes('Download the React DevTools'))
    const realWarnings = warnings.filter((w) => !w.includes('Download the React DevTools'))
    const ok = found && !blank && realErrors.length === 0
    if (ok) { pass++; console.log(`  ✅ ${name.padEnd(11)} ${path.padEnd(16)} html:${String(html.length).padStart(7)}`) }
    else {
      fail++
      console.log(`  ❌ ${name} ${path} found:${found} blank:${blank} errors:${realErrors.length}`)
      realErrors.slice(0, 2).forEach((e) => console.log('      ERR:', e.split('\n').slice(0, 4).join('\n      ')))
    }
    if (realWarnings.length > 0) console.log(`      ⚠ ${realWarnings.length} warnings:`, realWarnings[0].slice(0, 140))
  }

  // redirect test: /dashboard without auth
  const r = await renderRoute('/dashboard', null)
  const redirected = r.html.includes('Platformaga kirish') || r.html.includes('Kirish')
  if (redirected) { pass++; console.log('  ✅ Protected redirect   /dashboard → login') }
  else { fail++; console.log('  ❌ Protected redirect failed. html:', r.html.slice(0, 200)) }

  console.log(`\n═══════ SMOKE: ${pass} passed, ${fail} failed (${((Date.now() - t0) / 1000).toFixed(1)}s) ═══════`)
  process.exit(fail > 0 ? 1 : 0)
})()
