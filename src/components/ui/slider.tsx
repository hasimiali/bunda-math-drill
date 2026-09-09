import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '@/lib/utils'

function Slider({ className, ...props }: React.ComponentProps<typeof SliderPrimitive.Root>) { const values = React.useMemo(() => Array.isArray(props.value) ? props.value : Array.isArray(props.defaultValue) ? props.defaultValue : [props.min ?? 0], [props.value, props.defaultValue, props.min]); return <SliderPrimitive.Root data-slot="slider" className={cn('relative flex w-full touch-none select-none items-center data-[disabled]:opacity-50', className)} {...props}><SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/15"><SliderPrimitive.Range className="absolute h-full bg-primary" /></SliderPrimitive.Track>{values.map((_, index) => <SliderPrimitive.Thumb key={index} className="block size-4 rounded-full border-2 border-primary bg-background shadow-sm outline-none transition-shadow focus-visible:ring-[3px] focus-visible:ring-ring/40" />)}</SliderPrimitive.Root> }
export { Slider }
