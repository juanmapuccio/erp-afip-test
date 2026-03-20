import { getTaxPayments } from "@/actions/tax-payments"
import TaxPaymentsPage from "@/features/taxes/components/TaxPaymentsPage"

export default async function TaxesRoute() {
  const payments = await getTaxPayments()
  return <TaxPaymentsPage initialPayments={payments as any} />
}
