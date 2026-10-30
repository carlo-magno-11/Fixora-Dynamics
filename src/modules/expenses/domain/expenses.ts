import Decimal from "decimal.js";

export type FixedExpense = {
  id: string;
  name: string;
  amount: number;
};

export type VariableExpense = {
  id: string;
  name: string;
  costPerUnit: number;
};

export type ExpenseSummaryInput = {
  fixedExpenses: FixedExpense[];
  variableExpenses: VariableExpense[];
  expectedUnits: number;
};

export type ExpenseSummary = {
  fixedCostsForPeriod: number;
  variableCostPerUnit: number;
  fixedCostAllocationPerUnit: number;
  fullyAllocatedCostPerUnit: number;
  expectedUnits: number;
};

function assertValidLine(name: string, amount: number) {
  if (!name.trim()) {
    throw new Error("Cada gasto debe tener un nombre.");
  }
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Los importes deben ser finitos y no negativos.");
  }
}

export function summarizeExpenses(input: ExpenseSummaryInput): ExpenseSummary {
  if (!Array.isArray(input.fixedExpenses) || !Array.isArray(input.variableExpenses)) {
    throw new Error("La lista de gastos no es válida.");
  }
  if (!Number.isFinite(input.expectedUnits) || input.expectedUnits <= 0) {
    throw new Error("Las unidades estimadas deben ser mayores que cero.");
  }

  for (const expense of input.fixedExpenses) {
    assertValidLine(expense.name, expense.amount);
  }
  for (const expense of input.variableExpenses) {
    assertValidLine(expense.name, expense.costPerUnit);
  }

  const fixedCosts = input.fixedExpenses.reduce(
    (total, expense) => total.plus(expense.amount),
    new Decimal(0),
  );
  const variableCost = input.variableExpenses.reduce(
    (total, expense) => total.plus(expense.costPerUnit),
    new Decimal(0),
  );
  const allocation = fixedCosts.div(input.expectedUnits);

  return {
    fixedCostsForPeriod: fixedCosts.toNumber(),
    variableCostPerUnit: variableCost.toNumber(),
    fixedCostAllocationPerUnit: allocation.toNumber(),
    fullyAllocatedCostPerUnit: allocation.plus(variableCost).toNumber(),
    expectedUnits: input.expectedUnits,
  };
}
