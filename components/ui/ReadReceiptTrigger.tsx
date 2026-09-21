'use client'

import { useEffect } from 'react'
import { markAsRead } from '@/app/actions/communication'

export function ReadReceiptTrigger({ messageIds }: { messageIds: string[] }) {
  useEffect(() => {
    if (messageIds.length > 0) {
      markAsRead(messageIds)
    }
  }, [messageIds])

  return null
}
