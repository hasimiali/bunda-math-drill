import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap text-xs font-extrabold tracking-[.08em] transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4',
  { variants: {
    variant: {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      lime: 'bg-lime text-forest hover:-translate-y-0.5 hover:bg-[#d5ff79]',
      gold: 'bg-gold text-forest hover:bg-gold/85',
      outline: 'border border-forest bg-transparent text-forest hover:bg-forest/5',
      ghost: 'text-forest hover:bg-forest/5',
      play: 'border border-white/20 bg-transparent text-white hover:bg-white/10',
    },
    size: { default: 'h-10 px-4 py-2', sm: 'h-9 px-3', lg: 'h-12 px-5', icon: 'size-9 rounded-full' },
  }, defaultVariants: { variant: 'default', size: 'default' } },
)

function Button({ className, variant, size, asChild = false, ...props }: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'button'
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
