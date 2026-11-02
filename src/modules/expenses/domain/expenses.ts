import Decimal from "decimal.js";

export type ExpensePeriod = "week" | "month" | "quarter" | "year";

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
  period: ExpensePeriod;
};

export type ExpenseSummary = {
  fixedCostsForPeriod: number;
  variableCostPerUnit: number;
  fixedCostAllocationPerUnit: number;
  fullyAllocatedCostPerUnit: number;
  expectedUnits: number;
  period: ExpensePeriod;
};

function assertValidLine(name: string, amount: number) {
  if (typeof name !== "string" || !name.trim()) {
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
  if (!["week", "month", "quarter", "year"].includes(input.period)) {
    throw new Error("Selecciona un periodo válido.");
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
  const values = [fixedCosts, variableCost, allocation, allocation.plus(variableCost)];
  if (values.some((value) => !value.isFinite() || !Number.isFinite(value.toNumber()))) {
    throw new Error("El total de gastos excede el rango numérico permitido.");
  }

  return {
    fixedCostsForPeriod: fixedCosts.toNumber(),
    variableCostPerUnit: variableCost.toNumber(),
    fixedCostAllocationPerUnit: allocation.toNumber(),
    fullyAllocatedCostPerUnit: allocation.plus(variableCost).toNumber(),
    expectedUnits: input.expectedUnits,
    period: input.period,
  };
}
