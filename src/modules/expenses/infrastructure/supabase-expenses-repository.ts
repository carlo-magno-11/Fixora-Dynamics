import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExpensePeriod, FixedExpense, VariableExpense } from "../domain/expenses";
import type { Database, Json } from "../../../shared/infrastructure/supabase/database.types";

type ExpenseRow = Database["public"]["Tables"]["fixora_expenses"]["Row"];
type ExpenseSettings = Database["public"]["Tables"]["fixora_expense_settings"]["Row"];
type ExpenseRpcArgs = Database["public"]["Functions"]["fixora_save_expenses"]["Args"];

export type CloudExpenseState = {
  fixed: FixedExpense[];
  variable: VariableExpense[];
  expectedUnits: number;
  period: ExpensePeriod;
  version: number;
};

export type CloudExpenseDraft = Omit<CloudExpenseState, "version"> & {
  expectedVersion: number;
};

const validPeriods: ExpensePeriod[] = ["week", "month", "quarter", "year"];

export function mapExpenseRows(rows: readonly ExpenseRow[]): Pick<CloudExpenseState, "fixed" | "variable"> {
  return {
    fixed: rows.filter((row) => row.expense_type === "fixed").map((row) => ({
      id: row.id,
      name: row.name,
      amount: Number(row.amount),
    })),
    variable: rows.filter((row) => row.expense_type === "variable").map((row) => ({
      id: row.id,
      name: row.name,
      costPerUnit: Number(row.amount),
    })),
  };
}

export function mapExpenseSettings(settings: ExpenseSettings): Pick<CloudExpenseState, "expectedUnits" | "period" | "version"> {
  if (!validPeriods.includes(settings.period as ExpensePeriod)) {
    throw new Error("La configuración contiene un periodo de gastos no reconocido.");
  }
  const expectedUnits = Number(settings.expected_units);
  const version = Number(settings.version);
  if (!Number.isSafeInteger(expectedUnits) || expectedUnits < 1 ||
      !Number.isSafeInteger(version) || version < 1) {
    throw new Error("La configuración de gastos del negocio no es válida.");
  }
  return {
    expectedUnits,
    period: settings.period as ExpensePeriod,
    version,
  };
}

function toRpcPayload(lines: readonly { id: string; name: string; amount: number }[]): Json {
  return lines.map((line) => line.id.startsWith("new:")
    ? { name: line.name.trim(), amount: line.amount }
    : { id: line.id, name: line.name.trim(), amount: line.amount });
}

function throwExpenseError(error: { code?: string; message: string }): never {
  if (error.code === "40001") {
    throw new Error("Otro integrante actualizó estos gastos. Recarga la versión más reciente y revisa los datos antes de volver a guardar.");
  }
  if (error.code === "42501" || error.code === "PGRST301") {
    throw new Error("No tienes permiso para modificar los gastos de este negocio.");
  }
  throw new Error("No fue posible completar la operación de gastos. Comprueba tu conexión e inténtalo de nuevo.");
}

export type ExpensesRepository = {
  load(businessId: string): Promise<CloudExpenseState>;
  save(businessId: string, draft: CloudExpenseDraft): Promise<void>;
};

export function createSupabaseExpensesRepository(
  client: SupabaseClient<Database> | null,
): ExpensesRepository {
  if (!client) {
    const unavailable = async (): Promise<never> => {
      throw new Error("La conexión cloud no está disponible. Vuelve a iniciar sesión e inténtalo de nuevo.");
    };
    return { load: unavailable, save: unavailable };
  }

  return {
    async load(businessId) {
      const [expensesResult, settingsResult] = await Promise.all([
        client
          .from("fixora_expenses")
          .select("id, business_id, expense_type, name, amount, is_active, created_by, created_at, updated_at")
          .eq("business_id", businessId)
          .eq("is_active", true)
          .order("created_at", { ascending: true })
          .limit(200),
        client
          .from("fixora_expense_settings")
          .select("business_id, expected_units, period, version, updated_by, created_at, updated_at")
          .eq("business_id", businessId)
          .maybeSingle(),
      ]);
      if (expensesResult.error) throwExpenseError(expensesResult.error);
      if (settingsResult.error) throwExpenseError(settingsResult.error);
      if (!settingsResult.data) {
        throw new Error("El negocio no tiene configuración de gastos. Contacta a soporte para revisar su inicialización.");
      }
      return {
        ...mapExpenseRows((expensesResult.data ?? []) as ExpenseRow[]),
        ...mapExpenseSettings(settingsResult.data as ExpenseSettings),
      };
    },

    async save(businessId, draft) {
      const args: ExpenseRpcArgs = {
        p_business_id: businessId,
        p_expected_units: draft.expectedUnits,
        p_period: draft.period,
        p_expected_version: draft.expectedVersion,
        p_fixed: toRpcPayload(draft.fixed.map((item) => ({ id: item.id, name: item.name, amount: item.amount }))),
        p_variable: toRpcPayload(draft.variable.map((item) => ({ id: item.id, name: item.name, amount: item.costPerUnit }))),
      };
      const { error } = await client.rpc("fixora_save_expenses", args);
      if (error) throwExpenseError(error);
    },
  };
}
