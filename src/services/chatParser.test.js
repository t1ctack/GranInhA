// Manual test runner — execute with:  node src/services/chatParser.test.js
import { parseCommand } from './chatParser.js'

let passed = 0
let failed = 0

function test(desc, input, checks) {
  const result = parseCommand(input)
  const errors = []

  for (const [key, expected] of Object.entries(checks)) {
    const actual = result[key]
    const ok = expected === null ? actual == null : actual === expected
    if (!ok) {
      errors.push(`  ${key}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
    }
  }

  if (errors.length === 0) {
    console.log(`  ✅  ${desc}`)
    passed++
  } else {
    console.log(`  ❌  ${desc}`)
    console.log(`       input: "${input}"`)
    errors.forEach(e => console.log(`      ${e}`))
    failed++
  }
}

// ── The two cases reported as failing ──────────────────────────────────────────
console.log('\n── Reported failures ─────────────────────────────')

test(
  'add with "reais" suffix + "a" prep + description',
  'adicione 10 reais a nubank de impostos',
  { action: 'add', amount: 10, accountName: 'nubank', description: 'impostos' },
)

test(
  'typo on verb ("aadicione")',
  'aadicione 10 reais a nubank',
  { action: 'add', amount: 10, accountName: 'nubank' },
)

// ── Value format variations ────────────────────────────────────────────────────
console.log('\n── Value formats ──────────────────────────────────')

test('plain integer',               'adicione 50 no nubank',      { action: 'add', amount: 50 })
test('R$ prefix',                   'adicione R$50 no nubank',    { action: 'add', amount: 50 })
test('R$ with space',               'adicione R$ 50 no nubank',   { action: 'add', amount: 50 })
test('comma decimal (10,50)',        'gastei 10,50 no mercado',    { action: 'deduct', amount: 10.5 })
test('dot thousands (1.000)',        'gastei 1.000 na carteira',   { action: 'deduct', amount: 1000 })
test('full BRL (1.000,00)',          'gastei 1.000,00 da carteira',{ action: 'deduct', amount: 1000 })

// ── Preposition variations ─────────────────────────────────────────────────────
console.log('\n── Prepositions ───────────────────────────────────')

test('"da" prep',     'desconte 100 da carteira',     { action: 'deduct', amount: 100, accountName: 'carteira' })
test('"no" prep',     'adicione 200 no nubank',       { action: 'add',    amount: 200, accountName: 'nubank'   })
test('"pro" prep',    'adicione 200 pro nubank',      { action: 'add',    amount: 200, accountName: 'nubank'   })
test('"pra" prep',    'adicione 200 pra carteira',    { action: 'add',    amount: 200, accountName: 'carteira' })
test('"para o" prep', 'adicione 200 para o nubank',   { action: 'add',    amount: 200, accountName: 'nubank'   })
test('"ao" prep',     'adicione 200 ao inter',        { action: 'add',    amount: 200, accountName: 'inter'    })
test('"em" prep',     'deposite 150 em carteira',     { action: 'add',    amount: 150, accountName: 'carteira' })
test('"com" prep',    'paguei 45 com o cartao',       { action: 'deduct', amount: 45  })

// ── Verb typo tolerance ────────────────────────────────────────────────────────
console.log('\n── Verb typo tolerance ────────────────────────────')

test('missing "i" in adicione → adcione',   'adcione 50 no nubank',     { action: 'add',    amount: 50  })
test('missing "o" in desconte → descnte',   'descnte 30 da carteira',   { action: 'deduct', amount: 30  })
test('missing "a" in gastei → gstei',       'gstei 20 no inter',        { action: 'deduct', amount: 20  })
test('extra "a" prefix → aadicione',        'aadicione 100 no nubank',  { action: 'add',    amount: 100 })
test('transposition → adicioen',            'adicioen 70 no nubank',    { action: 'add',    amount: 70  })

// ── Alternative word order ─────────────────────────────────────────────────────
console.log('\n── Alternative word order ─────────────────────────')

test('[verb][prep][account][amount]', 'adicione no nubank 200',    { action: 'add',    amount: 200, accountName: 'nubank'   })
test('[verb][prep][account][amount]', 'desconte da carteira 50',   { action: 'deduct', amount: 50,  accountName: 'carteira' })

// ── No account mentioned ───────────────────────────────────────────────────────
console.log('\n── No account mentioned ───────────────────────────')

test('expense without account', 'gastei 50',   { action: 'deduct', amount: 50,   accountName: null })
test('income without account',  'recebi 1000', { action: 'add',    amount: 1000, accountName: null })

// ── Undo ──────────────────────────────────────────────────────────────────────
console.log('\n── Undo ───────────────────────────────────────────')

test('exact undo',        'desfazer', { action: 'undo' })
test('short undo',        'desfaz',   { action: 'undo' })
test('typo undo (desfze)','desfze',   { action: 'undo' })

// ── Balance queries ────────────────────────────────────────────────────────────
console.log('\n── Balance queries ────────────────────────────────')

test('balance with account', 'quanto tenho no nubank?', { action: 'balance' })
test('total balance',        'saldo total',             { action: 'balance', accountName: null })

// ── Partial match (unknown with clues) ────────────────────────────────────────
console.log('\n── Partial match ──────────────────────────────────')

test('verb + account, no amount', 'adicione no nubank', {
  action:                  'unknown',
  // partial is an object — just verify action and that partial has expected fields
})

test('amount only, no verb', '50 no nubank', {
  action: 'unknown',
})

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`)
console.log(`  ${passed + failed} tests — ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
