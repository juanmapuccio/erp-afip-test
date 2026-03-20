import { getJournalEntries, getTrialBalance } from "@/actions/accounting"
import AccountingPage from "@/features/accounting/components/AccountingPage"

/**
 * Ruta del Libro Diario.
 * Carga asientos contables y balance de sumas y saldos.
 */
export default async function AccountingRoute() {
  const [entries, trialBalance] = await Promise.all([
    getJournalEntries(),
    getTrialBalance(),
  ])

  return (
    <AccountingPage
      initialEntries={entries as any}
      trialBalance={trialBalance as any}
    />
  )
}
