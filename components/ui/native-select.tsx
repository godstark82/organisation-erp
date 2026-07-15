'use client'

import { ChevronUpDownIcon } from '@heroicons/react/20/solid'
import {
  Children,
  forwardRef,
  isValidElement,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react'
import { twMerge } from 'tailwind-merge'
import { fieldStyles } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'

export function NativeSelect({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="control"
      className={fieldStyles({
        className: twMerge('relative w-full', className),
      })}
      {...props}
    />
  )
}

type OptionData = {
  value: string
  label: string
  disabled?: boolean
}

const PLACEHOLDER_KEY = '__placeholder__'

function optionsFromChildren(children: ReactNode): OptionData[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ value?: string | number; disabled?: boolean; children?: ReactNode }>(child)) {
      return []
    }
    if (child.type !== 'option') return []

    const value = child.props.value == null ? '' : String(child.props.value)
    const label =
      typeof child.props.children === 'string' ||
      typeof child.props.children === 'number'
        ? String(child.props.children)
        : value || 'Select…'
    return [{ value, label, disabled: Boolean(child.props.disabled) }]
  })
}

function toKey(value: string) {
  return value === '' ? PLACEHOLDER_KEY : value
}

function fromKey(key: string) {
  return key === PLACEHOLDER_KEY ? '' : key
}

export interface NativeSelectContentProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'children'> {
  isInvalid?: boolean
  children?: ReactNode
}

/**
 * Theme-aware select for forms. Renders Intent Select (popover) for the UI
 * and keeps a hidden native <select> so FormData / react-hook-form work.
 */
export const NativeSelectContent = forwardRef<
  HTMLSelectElement,
  NativeSelectContentProps
>(function NativeSelectContent(
  {
    className,
    isInvalid,
    children,
    name,
    value,
    defaultValue,
    onChange,
    onBlur,
    disabled,
    required,
    id,
    ...props
  },
  ref
) {
  const options = useMemo(() => optionsFromChildren(children), [children])
  const isControlled = value !== undefined
  const [internal, setInternal] = useState(() =>
    String(defaultValue ?? options.find((o) => !o.disabled)?.value ?? '')
  )

  useEffect(() => {
    if (!isControlled && defaultValue !== undefined) {
      setInternal(String(defaultValue))
    }
  }, [defaultValue, isControlled])

  const selected = isControlled ? String(value ?? '') : internal

  const selectedLabel =
    options.find((o) => o.value === selected)?.label ?? 'Select…'

  const emitChange = (next: string) => {
    if (!isControlled) setInternal(next)
    if (onChange) {
      const event = {
        target: { name: name ?? '', value: next },
        currentTarget: { name: name ?? '', value: next },
      } as ChangeEvent<HTMLSelectElement>
      onChange(event)
    }
  }

  return (
    <div data-slot="control" className={twMerge('relative w-full', className)}>
      <select
        ref={ref}
        id={id}
        name={name}
        value={selected}
        required={required}
        disabled={disabled}
        aria-invalid={isInvalid ? 'true' : undefined}
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute h-px w-px opacity-0"
        onChange={(e) => emitChange(e.target.value)}
        onBlur={onBlur}
        {...props}
      >
        {options.map((option) => (
          <option
            key={`native-${toKey(option.value)}-${option.label}`}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>

      <Select
        isDisabled={disabled}
        isInvalid={isInvalid}
        selectedKey={toKey(selected)}
        onSelectionChange={(key) => {
          if (key == null) return
          emitChange(fromKey(String(key)))
        }}
        aria-label={props['aria-label'] ?? name ?? 'Select'}
      >
        <SelectTrigger className="w-full bg-bg text-fg">
          <span
            className={twMerge(
              'min-w-0 flex-1 truncate text-start',
              !selected && 'text-muted-fg'
            )}
          >
            {selectedLabel}
          </span>
          <ChevronUpDownIcon
            data-slot="chevron"
            className="ms-auto -me-1 size-5 shrink-0 text-muted-fg sm:size-4"
          />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={`${toKey(option.value)}-${option.label}`}
              id={toKey(option.value)}
              textValue={option.label}
              isDisabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
})
