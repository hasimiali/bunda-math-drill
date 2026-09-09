import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cn } from '@/lib/utils'

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) { return <SwitchPrimitive.Root data-slot="switch" className={cn('peer inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-input transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary', className)} {...props}><SwitchPrimitive.Thumb data-slot="switch-thumb" className="pointer-events-none block size-3.5 translate-x-0.75 rounded-full bg-background shadow-sm transition-transform data-[state=checked]:translate-x-[19px] data-[state=checked]:bg-lime" /></SwitchPrimitive.Root> }
export { Switch }
