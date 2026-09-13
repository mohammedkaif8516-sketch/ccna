'use client'

import { useMemo, useState } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { topics, type NoteBlock, type Subtopic, type Topic } from '@/lib/topics'
import { Brackets, Cable, Check, ChevronRight, Layers3, Menu, Moon, Network, PanelLeft, Router, Search, Sun, ArrowLeft } from 'lucide-react'

const iconMap = { network: Network, layers: Layers3, cable: Cable, router: Router, brackets: Brackets }

function Sidebar({ selected, onSelect, mobile = false }: { selected?: string; onSelect: (topic: Topic, subtopic: Subtopic) => void; mobile?: boolean }) {
  return (
    <aside className={mobile ? 'flex h-full flex-col bg-background' : 'hidden w-72 shrink-0 border-r bg-sidebar/40 lg:flex'}>
      <div className="flex-1 overflow-y-auto px-3 py-5">
        <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Curriculum</p>
        <Accordion type="multiple" defaultValue={topics.map((topic) => topic.slug)} className="w-full">
          {topics.map((topic) => {
            const Icon = iconMap[topic.icon as keyof typeof iconMap] ?? Network
            return (
              <AccordionItem value={topic.slug} key={topic.slug} className="border-b-0">
                <AccordionTrigger className="rounded-md px-3 py-2.5 text-left text-xs font-medium hover:bg-accent hover:no-underline [&>svg]:size-3.5">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{topic.title}</span>
                  </span>
                </AccordionTrigger>
              <AccordionContent className="pb-1 pt-0">
                <div className="ml-5 border-l pl-3">
                  {topic.subtopics.map((subtopic, index) => (
                    <button
                      key={`${subtopic.slug}-${index}`}
                      onClick={() => onSelect(topic, subtopic)}
                      className={`flex w-full items-start gap-2 rounded-md px-3 py-2 text-left text-xs leading-4 transition-colors ${
                        selected === subtopic.slug
                          ? 'bg-primary/10 font-medium text-primary'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                    >
                      <ChevronRight className={`mt-0.5 size-3 shrink-0 ${selected === subtopic.slug ? 'text-primary' : 'opacity-50'}`} />
                      {subtopic.title}
                    </button>
                  ))}
                </div>
              </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </div>
    </aside>
  )
}

function DiagramSlot({ label }: { label: string }) {
  return (
    <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed bg-muted/30 px-4 text-center">
      <div>
        <div className="mx-auto mb-2 flex size-8 items-center justify-center rounded-lg border bg-background">
          <PanelLeft className="size-4 text-muted-foreground" />
        </div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-[11px] text-muted-foreground/70">Drawing canvas slot</p>
      </div>
    </div>
  )
}

function NoteBlockView({ block }: { block: NoteBlock }) {
  if (block.type === 'heading') return <h2 className="mt-8 text-lg font-semibold tracking-tight first:mt-0">{block.text}</h2>
  if (block.type === 'paragraph') return <p className="text-sm leading-7 text-muted-foreground">{block.text}</p>
  if (block.type === 'bullets')
    return (
      <ul className="flex flex-col gap-2 pl-5 text-sm leading-6 text-muted-foreground marker:text-primary">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    )
  if (block.type === 'code')
    return (
      <pre className="overflow-x-auto rounded-xl border bg-muted/50 p-4 font-mono text-xs leading-6 text-foreground">
        <code>{block.code}</code>
      </pre>
    )
  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            {block.headers.map((header) => (
              <TableHead key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
        {block.rows.map((row, rowIndex) => (
          <TableRow key={`${row[0]}-${rowIndex}`}>
            {row.map((cell, cellIndex) => (
              <TableCell key={cellIndex}>{cell}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
      </Table>
    </div>
  )
}

function QuickReference({ items }: { items: Subtopic['quickReference'] }) {
  return (
    <details className="group rounded-xl border bg-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        Quick Reference
        <ChevronRight className="size-4 text-muted-foreground transition-transform group-open:rotate-90" />
      </summary>
      <Separator />
      <div className="grid gap-3 p-4 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.label}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-xs leading-5 text-foreground">{item.value}</p>
          </div>
        ))}
      </div>
    </details>
  )
}

function SubnetCalculator() {
  const [ip, setIp] = useState('10.20.30.77')
  const [cidr, setCidr] = useState('26')
  const [error, setError] = useState('')
  const [result, setResult] = useState<null | Record<string, string>>(null)

  const calculate = (event: React.FormEvent) => {
    event.preventDefault()
    const octets = ip.trim().split('.').map(Number)
    const prefix = Number(cidr)
    if (
      octets.length !== 4 ||
      octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255) ||
      !/^\d{1,3}(\.\d{1,3}){3}$/.test(ip.trim())
    ) {
      setError('Enter a valid IPv4 address, such as 192.168.10.14.')
      setResult(null)
      return
    }
    if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
      setError('CIDR must be a whole number from 0 to 32.')
      setResult(null)
      return
    }
    const value = octets.reduce((acc, octet) => acc * 256 + octet, 0) >>> 0
    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
    const network = (value & mask) >>> 0
    const broadcast = (network | (~mask >>> 0)) >>> 0
    const format = (num: number) => [num >>> 24, (num >>> 16) & 255, (num >>> 8) & 255, num & 255].join('.')
    const total = 2 ** (32 - prefix)
    const usable = prefix >= 31 ? (prefix === 32 ? 1 : 2) : Math.max(0, total - 2)
    const first = prefix >= 31 ? network : network + 1
    const last = prefix >= 31 ? broadcast : broadcast - 1
    const dotted = format(mask)
    setError('')
    setResult({
      network: `${format(network)}/${prefix}`,
      broadcast: format(broadcast),
      first: format(first),
      last: format(last),
      hosts: usable.toLocaleString(),
      mask: dotted,
    })
  }

  return (
    <Card className="mt-8 border-primary/20 bg-primary/[0.02]">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Subnetting calculator</CardTitle>
            <CardDescription className="mt-1">Check your block boundaries as you study.</CardDescription>
          </div>
          <Badge variant="secondary">Interactive</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={calculate} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <label className="flex-1 text-xs font-medium">
            IP address
            <Input value={ip} onChange={(event) => setIp(event.target.value)} className="mt-2 bg-background" placeholder="192.168.10.14" />
          </label>
          <label className="w-full text-xs font-medium sm:w-32">
            CIDR prefix
            <div className="relative mt-2">
              <span className="pointer-events-none absolute left-3 top-2.5 text-sm text-muted-foreground">/</span>
              <Input value={cidr} onChange={(event) => setCidr(event.target.value)} className="bg-background pl-7" inputMode="numeric" />
            </div>
          </label>
          <Button type="submit" className="sm:w-auto">Calculate</Button>
        </form>
        {error && <p role="alert" className="mt-3 text-xs font-medium text-destructive">{error}</p>}
        {result && (
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              ['Network address', result.network],
              ['Broadcast address', result.broadcast],
              ['First usable host', result.first],
              ['Last usable host', result.last],
              ['Total usable hosts', result.hosts],
              ['Subnet mask', result.mask],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border bg-background p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="mt-1 break-all font-mono text-xs font-medium">{value}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Dashboard() {
  return (
    <div className="flex h-[calc(100vh-4rem)] w-full flex-col items-center justify-center bg-background px-6">
      <div className="flex flex-col items-center text-center max-w-md">
        {/* Big Left Arrow */}
        <div className="mb-8 text-primary animate-pulse">
          <ArrowLeft className="size-20" strokeWidth={1.5} />
        </div>
        
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Start from the sidebar
        </h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          Pick any topic on the left to open it here. Your study session will load in this space.
        </p>
      </div>
    </div>
  )
}

export default function CcnaStudyApp() {
  const [selected, setSelected] = useState<{ topic: Topic; subtopic: Subtopic } | null>(null)
  const [dark, setDark] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const select = (topic: Topic, subtopic: Subtopic) => {
    setSelected({ topic, subtopic })
    setMobileOpen(false)
  }
  const goHome = () => {
    setSelected(null)
    setMobileOpen(false)
  }

  const current = selected?.subtopic
  const currentIcon = selected ? iconMap[selected.topic.icon as keyof typeof iconMap] : null
  const allSubtopics = useMemo(() => topics.flatMap((topic) => topic.subtopics), [])

  return (
    <div className={dark ? 'dark min-h-screen bg-background text-foreground' : 'min-h-screen bg-background text-foreground'}>
      <div className="flex min-h-screen">
        <Sidebar selected={current?.slug} onSelect={select} />
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
                aria-label="Open curriculum"
              >
                <Menu />
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SheetTitle className="sr-only">CCNA curriculum</SheetTitle>
                <Sidebar selected={current?.slug} onSelect={select} mobile />
              </SheetContent>
            </Sheet>
            <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
              <button type="button" onClick={goHome} className="transition-colors hover:text-foreground">
                CCNA Notes
              </button>
              {selected && (
                <>
                  <ChevronRight className="size-3" />
                  <button type="button" onClick={goHome} className="transition-colors hover:text-foreground">
                    {selected.topic.title}
                  </button>
                  <ChevronRight className="size-3" />
                  <span className="text-foreground">{selected.subtopic.title}</span>
                </>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={() => setDark(!dark)}
            >
              {dark ? <Sun /> : <Moon />}
            </Button>
          </div>
          </header>
          <main>
            {current ? (
              <article className="mx-auto max-w-4xl px-6 py-10 lg:px-10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goHome}
                  className="mb-6 -ml-2 gap-1 text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight className="size-4 rotate-180" />
                  Back to Dashboard
                </Button>
                <div className="mb-8 flex items-start gap-4">
                  <div className="hidden size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:flex">
                    {currentIcon &&
                      (() => {
                        const Icon = currentIcon
                        return <Icon className="size-5" />
                      })()}
                  </div>
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <Badge variant="secondary">{selected.topic.title}</Badge>
                      <span className="text-xs text-muted-foreground">· Notes</span>
                    </div>
                    <h1 className="text-3xl font-semibold tracking-tight">{current.title}</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{current.description}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-5">
                  {current.blocks.map((block, index) => (
                    <NoteBlockView block={block} key={`${block.type}-${index}`} />
                  ))}
                </div>
                {current.diagrams && (
                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    {current.diagrams.map((diagram) => (
                      <DiagramSlot key={diagram} label={diagram} />
                    ))}
                  </div>
                )}
                {current.slug === 'subnetting-calculations' && <SubnetCalculator />}
                <div className="mt-10">
                  <QuickReference items={current.quickReference} />
                </div>
                <div className="mt-8 flex items-center gap-2 border-t pt-5 text-xs text-muted-foreground">
                  <Check className="size-4 text-primary" /> Keep going: revisit this page after a practice lab.
                </div>
              </article>
            ) : (
              <Dashboard onSelect={select} />
            )}
          </main>
        </div>
      </div>
    </div>
  )
}