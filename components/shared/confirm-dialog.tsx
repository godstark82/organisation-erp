'use client'

import { Button } from '@/components/ui/button'
import {
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '@/components/ui/modal'

export interface ConfirmDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  isPending?: boolean
  intent?: 'danger' | 'primary'
}

export function ConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  isPending = false,
  intent = 'danger',
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm()
    onOpenChange(false)
  }

  return (
    <ModalContent
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      role="alertdialog"
      size="sm"
      closeButton={false}
    >
      <ModalHeader>
        <ModalTitle>{title}</ModalTitle>
        {description && <ModalDescription>{description}</ModalDescription>}
      </ModalHeader>
      <ModalBody />
      <ModalFooter>
        <Button intent="outline" size="sm" onPress={() => onOpenChange(false)} isDisabled={isPending}>
          {cancelLabel}
        </Button>
        <Button
          intent={intent}
          size="sm"
          isPending={isPending}
          onPress={() => void handleConfirm()}
        >
          {confirmLabel}
        </Button>
      </ModalFooter>
    </ModalContent>
  )
}
