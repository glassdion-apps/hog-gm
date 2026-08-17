type HondaConfidenceInput = {
  hondaEdge: number
  rosterFit: number
  survivalChance: number
  managerSnipeRisk: string
  positionalScarcity: string
}

export function getHondaConfidence({
  hondaEdge,
  rosterFit,
  survivalChance,
  managerSnipeRisk,
  positionalScarcity,
}: HondaConfidenceInput) {
  let score = 50

  score += Math.max(0, hondaEdge) * 3

  score += rosterFit

  if (survivalChance <= 15) {
    score += 20
  } else if (survivalChance <= 30) {
    score += 15
  } else if (survivalChance <= 50) {
    score += 8
  }

  if (managerSnipeRisk === 'Very High') {
    score += 15
  } else if (managerSnipeRisk === 'High') {
    score += 10
  }

  if (positionalScarcity === 'Critical') {
    score += 10
  } else if (positionalScarcity === 'High') {
    score += 5
  }

  score = Math.min(100, Math.round(score))

  let label = 'Low'

  if (score >= 95) {
    label = 'Extremely High'
  } else if (score >= 85) {
    label = 'Very High'
  } else if (score >= 70) {
    label = 'High'
  } else if (score >= 55) {
    label = 'Moderate'
  }

  return {
    score,
    label,
  }
}