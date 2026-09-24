import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  addScoop, adjustCharge, bowlPrice, bowlWeight, buyPack, buyUpgrade, checkoutBowlPrice, clearBowl,
  confirmCharge, createNewGame, generateOrder, removeScoop, scoreBowl, servePot, setPrice, setSpice,
  startCooking, startDay, tick, toCheckoutBowl, unlockIngredient,
} from '../../src/js/logic.js'
import { DAY_LENGTH_SEC, PACK_SIZE, PRICE, START_STOCK } from '../../src/js/data.js'

const seq = (...values) => { let i = 0; return () => values[i++ % values.length] }

function dayWithCustomer(order) {
  const s = startDay(createNewGame())
  const customer = { id: 1, face: '🧑', order, patience: 40, maxPatience: 40, status: 'waiting' }
  return { ...s, customers: [customer], selectedCustomerId: 1, nextCustomerId: 2 }
}

test('bowl weight and price follow grams per 100g pricing', () => {
  const bowl = { items: { noodle: 2, bokchoy: 1 }, spice: 2 } // 160 + 40 = 200g
  assert.equal(bowlWeight(bowl), 200)
  assert.equal(bowlPrice(bowl, 2200), 4400)
})

test('scoreBowl gives full accuracy for an exact match', () => {
  const order = { items: { noodle: 1, enoki: 2 }, spice: 3 }
  assert.equal(scoreBowl(order, { items: { noodle: 1, enoki: 2 }, spice: 3 }).accuracy, 1)
})

test('scoreBowl penalises missing items, extra items and wrong spice', () => {
  const order = { items: { noodle: 1, enoki: 1 }, spice: 2 }
  assert.equal(scoreBowl(order, { items: { noodle: 1 }, spice: 2 }).accuracy, 0.5)
  assert.ok(Math.abs(scoreBowl(order, { items: { noodle: 1, enoki: 1, beef: 2 }, spice: 2 }).accuracy - 0.8) < 1e-9)
  assert.equal(scoreBowl(order, { items: { noodle: 1, enoki: 1 }, spice: 4 }).accuracy, 0.65)
})

test('generateOrder picks distinct unlocked ingredients with valid quantities', () => {
  const unlocked = ['bokchoy', 'sprout', 'enoki', 'noodle']
  const order = generateOrder(unlocked, seq(0.99, 0.1, 0.5, 0.9, 0.3, 0.7, 0.2, 0.6, 0.4))
  const ids = Object.keys(order.items)
  assert.ok(ids.length >= 3 && ids.length <= 4)
  assert.ok(ids.every((id) => unlocked.includes(id)))
  assert.ok(Object.values(order.items).every((q) => q >= 1 && q <= 2))
  assert.ok(order.spice >= 0 && order.spice <= 4)
})

test('addScoop consumes stock and removeScoop / clearBowl return it', () => {
  const s = startDay(createNewGame())
  const added = addScoop(addScoop(s, 'noodle'), 'noodle')
  assert.equal(added.stock.noodle, START_STOCK - 2)
  assert.equal(added.bowl.items.noodle, 2)
  assert.equal(removeScoop(added, 'noodle').stock.noodle, START_STOCK - 1)
  const cleared = clearBowl(added)
  assert.equal(cleared.stock.noodle, START_STOCK)
  assert.deepEqual(cleared.bowl.items, {})
  assert.equal(s.stock.noodle, START_STOCK, 'original state is not mutated')
})

test('addScoop refuses locked ingredients and empty stock', () => {
  const s = startDay(createNewGame())
  assert.equal(addScoop(s, 'beef').bowl.items.beef, undefined)
  const empty = { ...s, stock: { ...s.stock, noodle: 0 } }
  const after = addScoop(empty, 'noodle')
  assert.equal(after.bowl.items.noodle, undefined)
  assert.equal(after.toasts.at(-1).kind, 'bad')
})

test('cooking, serving and charging the exact price pays price plus tip', () => {
  const order = { items: { noodle: 1, enoki: 1 }, spice: 1 }
  let s = dayWithCustomer(order)
  s = setSpice(addScoop(addScoop(s, 'noodle'), 'enoki'), 1)
  s = startCooking(s)
  assert.equal(s.customers[0].status, 'cooking')
  assert.equal(s.pots[0].customerId, 1)
  assert.equal(servePot(s, 0), s, 'cannot serve before cooking finishes')
  s = tick({ ...s, spawnTimer: 999 }, 10, () => 0.5)
  const before = s.money
  s = servePot(s, 0)
  assert.equal(s.customers.length, 0)
  assert.equal(s.stats.served, 1)
  const price = checkoutBowlPrice(toCheckoutBowl({ items: { noodle: 1, enoki: 1 } }))
  assert.equal(s.pendingCheckout.correctPrice, price)
  s = confirmCharge(s) // no meat: the prefilled weight price is already correct
  assert.equal(s.stats.revenue, price)
  assert.ok(s.stats.tips > 0)
  assert.equal(s.money, before + s.stats.revenue + s.stats.tips)
})

test('a badly wrong bowl is refused and lowers rating', () => {
  let s = dayWithCustomer({ items: { noodle: 2, enoki: 2 }, spice: 0 })
  s = setSpice(addScoop(s, 'bokchoy'), 4)
  s = tick({ ...startCooking(s), spawnTimer: 999 }, 10, () => 0.5)
  const rating = s.rating
  s = servePot(s, 0)
  assert.equal(s.stats.refused, 1)
  assert.equal(s.stats.revenue, 0)
  assert.ok(s.rating < rating)
})

test('customers leave when patience runs out', () => {
  const s = tick({ ...dayWithCustomer({ items: { noodle: 1 }, spice: 0 }), spawnTimer: 999 }, 41, () => 0.5)
  assert.equal(s.stats.left, 1)
  assert.equal(s.selectedCustomerId, null)
})

test('day ends only after closing time once all customers are gone', () => {
  const s = startDay(createNewGame())
  assert.equal(tick({ ...s, spawnTimer: 999 }, DAY_LENGTH_SEC - 1).phase, 'day')
  assert.equal(tick({ ...s, spawnTimer: 999 }, DAY_LENGTH_SEC + 1).phase, 'summary')
})

test('shop actions spend money and respect limits', () => {
  const s = createNewGame()
  const bought = buyPack(s, 'noodle')
  assert.equal(bought.stock.noodle, START_STOCK + PACK_SIZE)
  assert.ok(bought.money < s.money)
  const unlocked = unlockIngredient(s, 'bunmoja')
  assert.ok(unlocked.unlocked.includes('bunmoja'))
  assert.equal(unlocked.stock.bunmoja, PACK_SIZE)
  assert.equal(buyUpgrade(s, 'pots').upgrades.pots, 2)
  assert.equal(buyUpgrade({ ...s, money: 0 }, 'pots').upgrades.pots, 1)
  assert.equal(setPrice(s, 99999).pricePer100g, PRICE.max)
  assert.equal(setPrice(s, 2249).pricePer100g, 2200)
})
