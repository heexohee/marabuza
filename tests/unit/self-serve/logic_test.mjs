import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buyPack, buyUpgrade, createNewGame, generateWish, hiddenItems, setPrice, startDay, tick, unlockIngredient,
} from '../../../src/js/self-serve/logic.js'
import { DAY_LENGTH_SEC, PACK_SIZE, PRICE } from '../../../src/js/data.js'
import { START_WAREHOUSE_STOCK } from '../../../src/js/self-serve/data.js'

const seq = (...values) => { let i = 0; return () => values[i++ % values.length] }

function dayWithQueuedCustomer() {
  const s = startDay(createNewGame())
  const bowl = { weighed: { noodle: 1 }, mode: 'maratang', beef: false, lamb: false, skewers: {}, cilantro: false }
  const customer = { id: 1, face: '🧑', mode: 'maratang', spice: 1, missing: [], bowl, patience: 40, maxPatience: 40 }
  return { ...s, queue: [customer], counter: { ...s.counter, customerId: 1 }, nextCustomerId: 2 }
}

test('generateWish picks distinct unlocked ingredients with valid quantities', () => {
  const unlocked = ['bokchoy', 'sprout', 'enoki', 'noodle']
  const wish = generateWish(unlocked, seq(0.99, 0.1, 0.5, 0.9, 0.3, 0.7, 0.2, 0.6, 0.4))
  const ids = Object.keys(wish)
  assert.ok(ids.length >= 3 && ids.length <= 4)
  assert.ok(ids.every((id) => unlocked.includes(id)))
  assert.ok(Object.values(wish).every((q) => q >= 1 && q <= 2))
})

test('hiddenItems lists nothing for a vegetable-only bowl', () => {
  assert.deepEqual(hiddenItems({ weighed: { noodle: 1 }, beef: false, lamb: false, skewers: {} }), [])
})

test('queued customers leave when patience runs out and the counter moves on', () => {
  const s = tick({ ...dayWithQueuedCustomer(), spawnTimer: 999 }, 41, () => 0.5)
  assert.equal(s.stats.left, 1)
  assert.equal(s.queue.length, 0)
  assert.equal(s.counter.customerId, null)
})

test('day ends only after closing time once everyone is gone', () => {
  const s = startDay(createNewGame())
  assert.equal(tick({ ...s, spawnTimer: 999 }, DAY_LENGTH_SEC - 1).phase, 'day')
  assert.equal(tick({ ...s, spawnTimer: 999 }, DAY_LENGTH_SEC + 1).phase, 'summary')
  const waiting = { ...dayWithQueuedCustomer(), dayTime: DAY_LENGTH_SEC }
  assert.equal(tick(waiting, 0.1, () => 0.5).phase, 'day')
})

test('shop actions spend money and respect limits', () => {
  const s = createNewGame()
  const bought = buyPack(s, 'noodle')
  assert.equal(bought.stock.noodle, START_WAREHOUSE_STOCK + PACK_SIZE)
  assert.ok(bought.money < s.money)
  const unlocked = unlockIngredient(s, 'bunmoja')
  assert.ok(unlocked.unlocked.includes('bunmoja'))
  assert.equal(unlocked.stock.bunmoja, PACK_SIZE)
  assert.equal(buyUpgrade(s, 'pots').upgrades.pots, 2)
  assert.equal(buyUpgrade({ ...s, money: 0 }, 'pots').upgrades.pots, 1)
  assert.equal(setPrice(s, 99999).pricePer100g, PRICE.max)
  assert.equal(setPrice(s, 2249).pricePer100g, 2200)
})

test('seat upgrades add tables on the next day', () => {
  const s = startDay(buyUpgrade(createNewGame(), 'seats'))
  assert.equal(s.tables.length, 3)
})
