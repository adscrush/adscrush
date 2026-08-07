import { EditFunnelClient } from "./edit-funnel-client"
import { notFound } from "next/navigation"

interface Props {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: "Edit Funnel",
}

export default async function EditFunnelPage({ params }: Props) {
  const { id } = await params
  if (!id) notFound()

  return <EditFunnelClient id={id} />
}
