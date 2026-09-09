import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex w-fit items-center border px-2 py-1 text-[9px] font-extrabold tracking-[.08em]', { variants: { variant: { default: 'border-transparent bg-primary text-primary-foreground', success: 'border-transparent bg-[#e1f2d2] text-[#236338]', destructive: 'border-transparent bg-[#ffe2dc] text-[#a83f2d]', outline: 'border-border text-foreground' } }, defaultVariants: { variant: 'default' } })
function Badge({ className, variant, ...props }: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) { return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} /> }
export { Badge, badgeVariants }
