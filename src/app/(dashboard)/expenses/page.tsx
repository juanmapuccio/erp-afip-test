import { getExpenses } from "@/actions/expenses"
import ExpensesPage from "@/features/expenses/components/ExpensesPage"

export default async function ExpensesRoute() {
  const expenses = await getExpenses()
  return <ExpensesPage initialExpenses={expenses as any} />
}
