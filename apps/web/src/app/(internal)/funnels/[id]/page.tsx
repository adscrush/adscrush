import { ContentShell } from "@/components/common/content-shell"
import { FunnelDetailView } from "@/features/funnels/components/funnel-detail"
import { notFound } from "next/navigation"

interface Props {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: "Funnel Details",
}

export default async function FunnelDetailPage({ params }: Props) {
  const { id } = await params
  if (!id) notFound()

  return (
    <ContentShell>
      <FunnelDetailView id={id} />
    </ContentShell>
  )
}
