# Business Tycoon — Формулы игровых механик

> Этот документ описывает все формулы расчёта, используемые в игре. Каждая секция соответствует движку (engine) в коде.

---

## 1. Экономика (Economy Engine)

### 1.1 Доход (Revenue)

Доход рассчитывается через **Combination Engine** и зависит от множества факторов:

```
Revenue = Demand × Quality × MonetizationEff × TechSynergy × LifecycleMult × BASE_SCALE
```

| Переменная | Описание | Диапазон |
|-----------|----------|----------|
| `Demand` | Спрос = baseDemand × productFit × marketAccess | 0–1 |
| `Quality` | Качество = baseQuality + techBonuses + teamEff × 0.15 × avgLevelMult + techTreeQuality | 0–1 |
| `MonetizationEff` | Эффективность монетизации (из выбранной стратегии) | 0.35–0.85 |
| `TechSynergy` | 1.0 + (кол-во синергетических пар × 0.08) | 1.0+ |
| `LifecycleMult` | Множитель стадии продукта (0 в Prototype, 1.0 в Growth) | 0–1.0 |
| `BASE_SCALE` | Базовый масштаб дохода | $15,000 |

**Пример:** Demand=0.7, Quality=0.5, MonetEff=0.75, TechSynergy=1.08, Lifecycle=0.7 (Release)
```
Revenue = 0.7 × 0.5 × 0.75 × 1.08 × 0.7 × 15000 = $2,977/нед
```

### 1.2 Расходы (Costs)

```
Costs = TeamSalaries + Infrastructure + ISOMaintenance + TechComplexityCost
```

| Компонент | Формула | Пояснение |
|-----------|---------|-----------|
| `TeamSalaries` | `Σ member.salary` | Сумма зарплат всех сотрудников (зависит от уровня) |
| `Infrastructure` | `Σ tech.cost × 0.03` | 3% от стоимости каждой внедрённой технологии за неделю |
| `ISOMaintenance` | Сертифицирован: `maintenanceCost`, в процессе: `× 0.5` | $2,000/нед при сертификации, $1,000 в процессе |
| `TechComplexityCost` | `Σ tech.complexityAdd × 500` | Стоимость поддержки сложности технологий |

**Пример:** 2 сотрудника (dev $1,200 + QA $800), 1 технология ($5,000), без ISO
```
Costs = (1200 + 800) + (5000 × 0.03) + 0 + (0.1 × 500) = $2,200/нед
```

### 1.3 Прибыль (Profit)

```
Profit = Revenue − Costs
```

- Прибыль прибавляется к балансу игрока каждую неделю
- Может быть **отрицательной** — баланс уходит в минус
- При балансе ≤ −$50,000 → **банкротство**

### 1.4 Эффективность команды (Team Efficiency)

```
TeamEfficiency = (AvgExperience / 100) × ProcessQuality × ISOSupport × BurnoutFactor
```

| Переменная | Формула | Значение |
|-----------|---------|----------|
| `AvgExperience` | Среднее experience всех сотрудников | 0–100 |
| `ProcessQuality` | Есть менеджер? 1.15 : 0.9 | 0.9 или 1.15 |
| `ISOSupport` | ISO сертифицирован? 1.1 : 1.0 | 1.0 или 1.1 |
| `BurnoutFactor` | `1 − AvgBurnout / 150` | 0.33–1.0 |

Результат ограничен: `min(1, max(0.1, ...))`.

**Пример:** 3 сотрудника, avg exp=40, менеджер есть, ISO нет, avg burnout=20
```
TeamEfficiency = (40/100) × 1.15 × 1.0 × (1 − 20/150) = 0.4 × 1.15 × 0.867 = 0.399
```

---

## 2. Комбинация (Combination Engine)

### 2.1 Спрос (Demand)

```
Demand = min(1, baseDemand × productFit × marketAccess)
```

| Переменная | Источник | Пример |
|-----------|----------|--------|
| `baseDemand` | Из ниши (0.6–0.8) | FinTech = 0.7 |
| `productFit` | Из таблицы продукт×ниша (0.5–1.6) | SaaS+FinTech = 1.4 |
| `marketAccess` | `market.accessModifier × market.demandMultiplier` | Domestic = 1.0 |

### 2.2 Качество (Quality)

```
Quality = min(1, max(0, baseProductQuality + totalTechQualityBonus + teamEff × 0.15 × avgLevelMult + techTreeQuality))
```

| Компонент | Описание |
|-----------|----------|
| `baseProductQuality` | Из продукта (0.25–0.35) |
| `totalTechQualityBonus` | Сумма qualityBonus всех внедрённых технологий |
| `teamEff × 0.15 × avgLevelMult` | Вклад команды с учётом уровней |
| `techTreeQuality` | Сумма qualityMod всех завершённых исследований |

**avgLevelMult** — средний множитель уровней всех сотрудников:
```
avgLevelMult = Σ LEVEL_OUTPUT_MULT[member.level - 1] / teamSize
```

| Уровень | OUTPUT_MULT |
|---------|-------------|
| 1 | 1.0 |
| 2 | 1.25 |
| 3 | 1.55 |
| 4 | 1.9 |
| 5 | 2.5 |

### 2.3 Синергия технологий (Tech Synergy)

```
TechSynergy = 1.0 + synergyPairs × 0.08
```

Считаются пары: если технология A имеет `synergyWith: ['B']` и технология B внедрена → +1 пара. Каждая пара считается один раз (делим на 2, т.к. считается с обеих сторон).

### 2.4 Бонусы дерева исследований

Для каждого завершённого узла суммируются эффекты:
```
techTreeQuality = Σ node.effects.qualityMod    (для всех completed nodes)
techTreeGrowth  = Σ node.effects.growthMod
techTreeRisk    = Σ node.effects.riskMod
```

Эти значения добавляются к Quality, Growth и Risk соответственно.

### 2.5 Множитель жизненного цикла (Lifecycle Multiplier)

```
LifecycleMult = avg(LIFECYCLE_REVENUE_MULT[product.lifecycle]) по всем продуктам
```

| Стадия | Множитель |
|--------|-----------|
| Prototype | 0 |
| Beta | 0.15 |
| Release | 0.7 |
| Growth | 1.0 |
| Maturity | 0.85 |
| Decline | 0.5 |

**Ключевой момент:** в Prototype доход = 0. Первые 4 недели компания только тратит!

### 2.6 Риск (Risk)

```
Risk = clamp(0, 1,
    baseComplexity × 0.3
  + totalTechComplexity × 0.4
  + growthAggression
  + teamLoad × 0.3
  + monetizationRiskModifier
  − isoStabilization
  + techTreeRisk
)
```

| Компонент | Описание |
|-----------|----------|
| `baseComplexity` | Сложность ниши (0.35–0.7) |
| `totalTechComplexity` | Сумма complexityAdd всех технологий |
| `growthAggression` | `max(0, growth) × 1.5` — агрессивный рост повышает риск |
| `teamLoad` | `Σ burnout / (teamSize × 100)` — нагрузка от выгорания |
| `monetizationRiskModifier` | Из стратегии монетизации (−0.08 до +0.1) |
| `isoStabilization` | Сумма stabilizationBonus сертифицированных ISO |
| `techTreeRisk` | Сумма riskMod завершённых исследований (обычно отрицательная) |

### 2.7 Рост (Growth)

```
Growth = (demand × productFit × techSynergy − 0.5) × 0.08 + techTreeGrowth
```

---

## 3. Жизненный цикл продукта (Product Engine)

### 3.1 Рост качества (еженедельно)

```
qualityGain = devCount × 0.008 + qaCount × 0.005
product.quality = min(1, quality + qualityGain)
```

**Пример:** 2 dev + 1 QA → +0.021/нед. За 10 недель: +0.21 качества.

### 3.2 Рост аудитории (с Release и далее)

```
audienceGain = marketingCount × 0.01 + 0.005
product.audience = min(1, audience + audienceGain)
```

Аудитория растёт только начиная со стадии Release.

### 3.3 Переходы между стадиями

| Переход | Условие |
|---------|---------|
| Prototype → Beta | `lifecycleWeeks ≥ 4` |
| Beta → Release | `lifecycleWeeks ≥ 3` |
| Release → Growth | `lifecycleWeeks ≥ 8` И `quality ≥ 0.5` |
| Growth → Maturity | `lifecycleWeeks ≥ 16` |
| Maturity → Decline | `lifecycleWeeks ≥ 24` |

### 3.4 Деградация в Decline

```
quality  −= 0.005/нед  (мин. 0.1)
audience −= 0.008/нед  (мин. 0)
```

---

## 4. Команда (Team Engine)

### 4.1 Опыт (Experience)

```
expGain = (1 + talent × 2) × (1 − burnout / 200)
         + (role === 'developer' ? 1 : 0)
         + traitBonus
newExperience = min(100, experience + expGain)
```

| Фактор | Влияние |
|--------|---------|
| `talent` | 0–1, множитель роста опыта |
| `burnout` | Высокое выгорание замедляет рост |
| Developer | +1 доп. опыт за ход |
| Trait `workaholic` | +30% к росту опыта |

### 4.2 Уровни сотрудников

При каждом тике проверяется опыт и обновляется уровень:

```
for i = 4 downto 0:
  if experience >= THRESHOLDS[i]:
    level = i + 1
    break
```

| Уровень | Порог опыта | Множитель зарплаты | Множитель выхода |
|---------|-------------|-------------------|-----------------|
| 1 | 0 | ×1.0 | ×1.0 |
| 2 | 20 | ×1.15 | ×1.25 |
| 3 | 45 | ×1.35 | ×1.55 |
| 4 | 70 | ×1.6 | ×1.9 |
| 5 | 90 | ×2.0 | ×2.5 |

Зарплата пересчитывается автоматически:
```
salary = round(BASE_SALARY[role] × SALARY_MULT[level - 1])
```

### 4.3 Выгорание (Burnout)

```
workload = risk × 15
recovery = morale × 0.05 + isoReduction × 10
burnoutDelta = workload − recovery
newBurnout = clamp(0, 100, burnout + burnoutDelta)
```

- `isoReduction` = 0.1 если ISO сертифицирован, иначе 0
- При burnout ≥ 95 → сотрудник **автоматически увольняется**

### 4.4 Мораль (Morale)

```
profitEffect = profit > 0 ? +2 : −3
burnoutEffect = burnout > 60 ? −3 : burnout > 30 ? −1 : +1
newMorale = clamp(10, 100, morale + profitEffect + burnoutEffect)
```

### 4.5 Менеджер и ISO — переключение задачи

Когда ISO активен (стадия ≠ none и ≠ maintenance):

```
managersOnISO = isoStandards.some(iso => iso.currentStage !== 'none' && iso.currentStage !== 'maintenance')

// В tickEmployeePointGeneration:
if (member.role === 'manager' && managersOnISO) → SKIP
  // не генерирует зональные очки (quality, growth, risk)
  // не заполняет work progress bar
  // не получает money reward за work cycle

// В tickISO:
managerCount = team.filter(m => m.role === 'manager' && m.status === 'office').length
if managerCount === 0 → progress += 0  // ISO стоит
else → progress += 15 + (managerCount × 12) + (hasQA ? 8 : 0)
```

**Трейд-офф:** менеджер на ISO = потеря зональных очков и дохода от work cycle, но ISO прогрессирует. Больше менеджеров = быстрее ISO, но больше потерь в производительности.

### 4.6 Стоимость найма

Базовая стоимость зависит от роли:

| Роль | Базовая зарплата | Стоимость найма |
|------|-----------------|-----------------|
| Developer | $1,200/нед | $2,500 |
| Manager | $1,000/нед | $2,000 |
| QA | $800/нед | $1,500 |
| Security | $1,100/нед | $2,200 |
| Marketing | $900/нед | $1,800 |

Для кандидатов с рынка — множители по редкости:

| Редкость | Множитель зп | Множитель найма |
|----------|-------------|-----------------|
| Common | ×1.0 | ×1.0 |
| Uncommon | ×1.2 | ×1.3 |
| Rare | ×1.5 | ×1.8 |
| Legendary | ×2.0 | ×2.5 |

### 4.6 Рынок сотрудников (Employee Market)

Генерируется **5 кандидатов на каждую роль** (25 всего), обновляется каждые 4 недели.

```
// Доступность редкостей зависит от репутации
if reputation < 30:  available = [common, uncommon]
if reputation < 60:  available = [common, uncommon, rare]
if reputation >= 60: available = [common, uncommon, rare, legendary]

// Высокая репутация увеличивает вес rare/legendary
repBonus = max(0, reputation − 30) / 70    // 0..1
adjustedWeight = baseWeight × (1 + repBonus × 2)  // для rare/legendary
```

**Пример (reputation=80):**
```
repBonus = (80 − 30) / 70 = 0.714
Rare weight:      15 × (1 + 0.714 × 2) = 15 × 2.43 = 36.4
Legendary weight:  5 × (1 + 0.714 × 2) =  5 × 2.43 = 12.1
→ Шанс Legendary: 12.1 / (50 + 30 + 36.4 + 12.1) = ~9.4% (вместо базовых 5%)
```

**Пример (reputation=20):**
```
available = [common, uncommon]  // rare и legendary недоступны
→ Шанс Common: 50/80 = 62.5%, Uncommon: 30/80 = 37.5%
```

---

## 5. Генерация очков зон (Employee Point Generation)

Сотрудники за столами генерируют метрики **непрерывно** (каждый кадр):

```
levelMult = LEVEL_OUTPUT_MULT[member.level - 1]
efficiency = (experience / 100) × (1 − burnout / 200) × (morale / 100)
output = 0.02 × weekFraction × efficiency × (1 + talent) × levelMult
```

| Зона | Эффект |
|------|--------|
| Development | quality += output |
| Marketing | growthRate += output |
| Security | risk −= output × 0.5 |
| QA | quality += output × 0.7, risk −= output × 0.3 |
| Без зоны | quality += output × 0.3 |

**Пример:** Dev, level 3, exp=60, burnout=10, morale=80, talent=0.5
```
levelMult = 1.55
efficiency = 0.6 × 0.95 × 0.8 = 0.456
output = 0.02 × 1.0 × 0.456 × 1.5 × 1.55 = 0.0212 за неделю
```

---

## 6. ISO Engine

### 6.1 Требование менеджера

ISO **не может быть начат и не прогрессирует** без хотя бы 1 менеджера в офисе.

```
canStartISO = officeManagers.length >= 1 && money >= stageCost
canAdvanceISO = officeManagers.length >= 1 && stageProgress >= 100 && money >= nextStageCost
```

Менеджеры, занятые ISO (стадия != none && != maintenance), **не выполняют обычную работу** — не генерируют зональные очки и work progress.

### 6.2 Прогресс стадии

```
managerCount = team.filter(m => m.role === 'manager' && m.status === 'office').length
hasQA = team.some(m => m.role === 'qa' && m.status === 'office')

if managerCount === 0: progress += 0  // стоит!
else: progress += 15 + (managerCount × 12) + (hasQA ? 8 : 0)
```

При progress ≥ 100 → переход на следующую стадию.

**Примеры:**

| Менеджеров | QA | Прогресс/ход | Ходов до 100% |
|------------|-----|-------------|---------------|
| 0 | — | 0 | ∞ (стоит) |
| 1 | нет | 27 | 4 |
| 1 | да | 35 | 3 |
| 2 | да | 47 | ~2–3 |
| 3 | да | 59 | 2 |

### 6.2 Стадии и стоимость

| Стадия | Стоимость перехода | Эффект |
|--------|-------------------|--------|
| Audit | $3,000 | Начало процесса |
| Implementation | $8,000 | Внедрение системы |
| Internal Check | $4,000 | Внутренняя проверка |
| Certification | $6,000 | Получение сертификата |
| Maintenance | $2,000/нед | Поддержание сертификации |

### 6.3 Maintenance

- Стоимость: $2,000/нед
- Шанс проблемы: 5% каждый ход (failRisk)
- При проблеме: прогресс −20, возможна потеря сертификации

### 6.4 Бонусы сертификации

| Бонус | Значение |
|-------|----------|
| Стабилизация (−risk) | −0.15 |
| Репутация | +10 |
| Снижение выгорания | −10% |
| Блокировка кризисов | 50% |

---

## 7. События (Event Engine)

### 7.1 Масштабирование от прогресса (Event Scaling)

Частота и штрафы событий зависят от стадии продукта и количества технологий:

```
// Множитель стадии продукта
lifecycleScale = {
  prototype: 0.15,
  beta:      0.3,
  release:   0.6,
  growth:    0.85,
  maturity:  1.0,
  decline:   1.0,
}
stageMult = lifecycleScale[product.lifecycle]

// Множитель технологий (больше технологий = больше событий)
techMult = min(1, 0.4 + techCount × 0.15)

// Итоговый множитель частоты
frequencyMult = stageMult × techMult

// Множитель денежных штрафов (только для отрицательных moneyDelta)
penaltyMult = max(0.2, stageMult)
```

**Пример (Prototype, 0 технологий):**
```
stageMult = 0.15, techMult = 0.4
frequencyMult = 0.15 × 0.4 = 0.06
penaltyMult = max(0.2, 0.15) = 0.2
→ Data Breach: −$10,000 × 0.2 = −$2,000
```

**Пример (Growth, 3 технологии):**
```
stageMult = 0.85, techMult = min(1, 0.4 + 3 × 0.15) = 0.85
frequencyMult = 0.85 × 0.85 = 0.72
penaltyMult = 0.85
→ Data Breach: −$10,000 × 0.85 = −$8,500
```

### 7.2 Вероятность события

Базовая вероятность масштабируется через `frequencyMult`:

```
noEventChance   = 0.2 + (1 − frequencyMult) × 0.6
oneEventChance  = noEventChance + (1 − noEventChance) × 0.75

roll = random()
if roll < noEventChance:    0 событий
elif roll < oneEventChance: 1 событие
else:                       2 события
```

| Стадия | frequencyMult | noEventChance | Шанс 1 события | Шанс 2 событий |
|--------|---------------|---------------|-----------------|----------------|
| Prototype | ~0.06 | ~76% | ~18% | ~6% |
| Beta | ~0.12 | ~73% | ~20% | ~7% |
| Release | ~0.36 | ~59% | ~31% | ~10% |
| Growth | ~0.72 | ~37% | ~47% | ~16% |
| Maturity | ~1.0 | ~20% | ~60% | ~20% |

### 7.3 Выбор события

Взвешенный случайный выбор из пула (14 событий). Каждое событие имеет `weight` и опциональное `condition`.

```
eligibleEvents = events.filter(e => !e.condition || e.condition(state))
totalWeight = Σ eligible.weight
roll = random() × totalWeight
// выбираем событие по накопленному весу
```

ISO-сертификация блокирует 50% кризисных событий:
```
if (event.type === 'crisis' && isoCertified && random() < 0.5) → пропуск
```

### 7.4 Применение штрафов

```
scaledMoney = moneyDelta < 0
  ? round(moneyDelta × penaltyMult)   // штрафы масштабируются
  : moneyDelta                          // награды — полные
```

---

## 8. Прогрессия (Progression Engine)

### 8.1 Опыт игрока

```
expGain = 5 + floor(profit / 5000)
newExperience = experience + max(1, expGain)
```

### 8.2 Дрейф репутации

```
qualityEffect = (quality − 0.5) × 2     // −1 при quality=0, +1 при quality=1
profitEffect = profit > 0 ? +1 : −2
repDelta = qualityEffect + profitEffect
newReputation = clamp(0, 100, reputation + repDelta)
```

### 8.3 Условия победы/поражения

| Условие | Порог |
|---------|-------|
| **Банкротство** | money ≤ −$50,000 |
| **Потеря репутации** | reputation ≤ 0 |
| **IPO (победа)** | money ≥ $500,000 И reputation ≥ 80 |
| **Доминирование (победа)** | reputation ≥ 95 И quality ≥ 0.9 |

---

## 9. Дерево исследований (Tech Tree)

### 9.1 Прогресс исследования

```
progressPerWeek = 100 / node.weeksToResearch
```

Одновременно исследуется только 1 узел. Прогресс автоматический каждую неделю.

### 9.2 Разблокировка узлов

```
node.unlocked = node.requires.every(reqId => getNode(reqId).completed)
              && (!node.requiredReputation || reputation >= node.requiredReputation)
```

### 9.3 Суммарные эффекты

Все `completed` узлы суммируют свои эффекты в формулы Combination Engine:
- `qualityMod` → добавляется к Quality
- `growthMod` → добавляется к Growth
- `riskMod` → добавляется к Risk (обычно отрицательный)
- `reputationMod`, `userGrowthMod`, `viralityMod`, `talentAccessMod` — для будущих механик

---

## 10. Баланс экономики — Пример игровой сессии

### Неделя 1 (старт, Bootstrapped, $20,000)
- Нанят 1 Developer ($1,200/нед, найм $2,500)
- Баланс: $20,000 − $2,500 = $17,500
- Продукт: Prototype (доход = $0)
- Расходы: $1,200/нед
- **Прибыль: −$1,200/нед**

### Неделя 4 (Prototype → Beta)
- Баланс: ~$17,500 − 4 × $1,200 = ~$12,700
- Продукт переходит в Beta (×0.15 дохода)
- Допустим Quality=0.35, Demand=0.7, MonetEff=0.75
- Revenue = 0.7 × 0.35 × 0.75 × 1.0 × 0.15 × 15000 = **$413/нед**
- Profit = $413 − $1,200 = **−$787/нед** (всё ещё в минусе, но меньше)

### Неделя 7 (Beta → Release)
- Баланс: ~$12,700 − 3 × $787 = ~$10,339
- Продукт в Release (×0.7), Quality подросло до ~0.42
- Revenue = 0.7 × 0.42 × 0.75 × 1.0 × 0.7 × 15000 = **$2,315/нед**
- Profit = $2,315 − $1,200 = **+$1,115/нед** ← выход в плюс!

### Неделя 15+ (Release → Growth)
- Quality ≥ 0.5, переход в Growth (×1.0)
- Revenue = 0.7 × 0.55 × 0.75 × 1.0 × 1.0 × 15000 = **$4,331/нед**
- С 2–3 сотрудниками расходы ~$3,000 → **Profit: +$1,331/нед**
- Компания стабильно растёт

### Путь к IPO (~неделя 100+)
- Нужно накопить $500,000 и reputation ≥ 80
- При стабильной прибыли $2,000–5,000/нед это достижимо за 100–250 недель
- Исследования, ISO, прокачка сотрудников ускоряют процесс

---

## Приложение: Таблица констант

| Константа | Значение | Файл |
|-----------|----------|------|
| `INITIAL_MONEY` | $25,000 | store.ts |
| `BASE_REVENUE_SCALE` | $15,000 | combination.ts |
| `SECONDS_PER_WEEK` | 10 сек (при 1x) | store.ts |
| `BANKRUPTCY_THRESHOLD` | −$50,000 | progression.ts |
| `IPO_THRESHOLD` | $500,000 | progression.ts |
| `MARKET_DOMINANCE_REP` | 95 | progression.ts |
| `MARKET_REFRESH_INTERVAL` | 4 недели | data-advanced.ts |
| `POINTS_PER_WEEK` | 0.02 | store.ts |
| `INFRA_COST_RATE` | 3% от стоимости технологии | economy.ts |
| `TECH_COMPLEXITY_MULT` | 500 | economy.ts |
| `BASE_CONTRACT_VALUE` | $4,000 | data.ts |
| `FREELANCE_BURNOUT_PER_WEEK` | 3–6 | data.ts |
| `FREELANCE_QUALITY_BOOST` | 0.006/нед | data.ts |

---

## 11. Фриланс (Freelance Engine)

### 11.1 Награда за аутсорсинг

```
rewardMoney = round(BASE_CONTRACT_VALUE × roleMult × levelMult × (1 + talent × 0.5))
```

| Переменная | Описание |
|-----------|----------|
| `BASE_CONTRACT_VALUE` | $4,000 |
| `roleMult` | Множитель роли (dev=1.0, qa=0.85, marketing=1.1, security=0.9, manager=1.3) |
| `levelMult` | `EMPLOYEE_LEVEL_OUTPUT_MULT[level - 1]` (1.0–2.5) |
| `talent` | 0–1, бонус к награде |

**Пример:** Manager Lv3, talent=0.6
```
reward = round(4000 × 1.3 × 1.55 × (1 + 0.6 × 0.5))
       = round(4000 × 1.3 × 1.55 × 1.3)
       = round($10,478) = $10,478
```

### 11.2 Еженедельный прогресс

```
baseSpeed    = 1 / durationWeeks
roleSpeed    = FREELANCE_ROLE_SPEED[role][taskType]
levelMult    = EMPLOYEE_LEVEL_OUTPUT_MULT[level - 1]
moraleMult   = lerp(0.7, 1.15, morale / 100)
burnoutPen   = burnout < 50 ? 1.0 : burnout < 75 ? 0.85 : 0.65

weeklyProgress = baseSpeed × roleSpeed × levelMult × (1 + talent × 0.3) × moraleMult × burnoutPen
newProgress    = min(1, progress + weeklyProgress)
```

**Пример:** Developer Lv2, outsourcing 4 нед, talent=0.5, morale=80, burnout=20
```
baseSpeed  = 1/4 = 0.25
roleSpeed  = 1.0
levelMult  = 1.25
moraleMult = lerp(0.7, 1.15, 0.8) = 1.06
burnoutPen = 1.0

weeklyProgress = 0.25 × 1.0 × 1.25 × 1.15 × 1.06 × 1.0 = 0.381
→ Завершится за ~3 недели вместо 4 (ускорение от уровня и таланта)
```

### 11.3 Выгорание во время фриланса

```
burnoutGain = random(3, 6) × (1 − burnoutResistance)
newBurnout  = min(100, burnout + burnoutGain)
```

**Пример:** burnoutResistance=0.4
```
burnoutGain = 4.5 × (1 − 0.4) = 2.7/нед
```

### 11.4 Мораль во время фриланса

```
newMorale = max(10, morale − 1)    // −1/нед (медленное снижение)
```

### 11.5 Internal Help — буст качества продукта

Каждую неделю, пока сотрудник помогает продукту:

```
qualityBoost = FREELANCE_QUALITY_BOOST × roleSpeed × levelMult
product.quality += qualityBoost
```

| Константа | Значение |
|-----------|----------|
| `FREELANCE_QUALITY_BOOST` | 0.006 (0.6%/нед) |

**Пример:** QA Lv3, internal_help
```
qualityBoost = 0.006 × 1.1 × 1.55 = 0.01023/нед (+1% качества)
```

### 11.6 Эффекты при завершении (progress ≥ 1)

| Тип | Деньги | Опыт | Штраф морали |
|-----|--------|------|-------------|
| Outsourcing | +`rewardMoney` | +5 | −10 |
| Internal Help | — | +3 | −5 |

```
// Outsourcing
player.money += task.rewardMoney
member.experience = min(100, experience + 5)
member.morale = max(10, morale − 10)

// Internal Help
member.experience = min(100, experience + 3)
member.morale = max(10, morale − 5)

// Оба типа
member.status = 'office'
member.freelanceTask = null
```

### 11.7 Длительность задач

```
duration = random(min, max)
```

| Тип | Мин | Макс |
|-----|-----|------|
| Outsourcing | 3 | 6 |
| Internal Help | 2 | 5 |

### 11.8 Анти-эксплойт проверки

```
canSendToFreelance(state, memberId):
  if member.status === 'freelance'           → false (уже на фрилансе)
  if officeEmployeeCount <= 1                → false (последний сотрудник)
  if member.burnout >= 85                    → false (слишком высокое выгорание)
  if activeEvents.some(e => e.type='crisis') → false (кризис)
  else → true
```
