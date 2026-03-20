import { getClients } from "@/actions/clients"
import ClientsPage from "@/features/clients/components/ClientsPage"

/**
 * Página de clientes del dashboard.
 * Server Component que carga los datos y los pasa al componente client.
 */
export default async function ClientsRoute() {
  const clients = await getClients()
  return <ClientsPage initialClients={clients as any} />
}
