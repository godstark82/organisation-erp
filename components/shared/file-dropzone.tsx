'use client'

import { ArrowUpTrayIcon, DocumentIcon } from '@heroicons/react/24/outline'
import { useMemo, useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { Button } from '@/components/ui/button'
import { DropZone } from '@/components/ui/drop-zone'
import { FileTrigger } from '@/components/ui/file-trigger'

export interface FileDropzoneProps extends React.HTMLAttributes<HTMLDivElement> {
  onFilesSelect?: (files: FileList) => void
  accept?: string
  allowsMultiple?: boolean
  maxFiles?: number
  description?: string
}

function toFileList(files: File[]): FileList {
  const dataTransfer = new DataTransfer()
  for (const file of files) {
    dataTransfer.items.add(file)
  }
  return dataTransfer.files
}

export function FileDropzone({
  onFilesSelect,
  accept,
  allowsMultiple = true,
  maxFiles,
  description = 'Drag and drop files here, or browse to upload',
  className,
  ...props
}: FileDropzoneProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const acceptedFileTypes = useMemo(() => {
    if (!accept) return undefined
    return accept.split(',').map((type) => type.trim()).filter(Boolean)
  }, [accept])

  const applyFiles = (files: File[]) => {
    const limited = maxFiles ? files.slice(0, maxFiles) : files
    setSelectedFiles(limited)
    if (limited.length > 0) {
      onFilesSelect?.(toFileList(limited))
    }
  }

  const handleFileList = (files: FileList | null) => {
    if (!files || files.length === 0) return
    applyFiles(Array.from(files))
  }

  const handleDrop = async (event: {
    items: { kind: string; type?: string; getFile?: () => Promise<File> }[]
  }) => {
    const fileItems = event.items.filter((item) => item.kind === 'file')
    const files = await Promise.all(
      fileItems.map(async (item) => {
        if (item.getFile) return item.getFile()
        return null
      })
    )
    applyFiles(files.filter((file): file is File => file !== null))
  }

  return (
    <div data-slot="file-dropzone" className={twMerge('space-y-3', className)} {...props}>
      <DropZone
        className="min-h-40 flex-col gap-3 bg-muted/20"
        getDropOperation={() => 'copy'}
        onDrop={(event) => void handleDrop(event)}
      >
        <div className="flex size-10 items-center justify-center rounded-full bg-secondary text-muted-fg">
          <ArrowUpTrayIcon className="size-5" />
        </div>
        <div className="space-y-1 text-center">
          <p className="font-medium text-fg text-sm/6">{description}</p>
          <p className="text-muted-fg text-xs/5">
            {allowsMultiple ? 'Multiple files supported' : 'Single file only'}
            {accept && ` · ${accept}`}
          </p>
        </div>
        <FileTrigger
          intent="outline"
          size="sm"
          acceptedFileTypes={acceptedFileTypes}
          allowsMultiple={allowsMultiple}
          onSelect={handleFileList}
        >
          Browse files
        </FileTrigger>
      </DropZone>

      {selectedFiles.length > 0 && (
        <ul className="space-y-2">
          {selectedFiles.map((file) => (
            <li
              key={`${file.name}-${file.size}`}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
            >
              <DocumentIcon className="size-4 shrink-0 text-muted-fg" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm/6">{file.name}</p>
                <p className="text-muted-fg text-xs/5 tabular-nums">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button
                intent="plain"
                size="xs"
                onPress={() =>
                  setSelectedFiles((prev) => prev.filter((item) => item.name !== file.name))
                }
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
