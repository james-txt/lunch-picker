'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowUp, ArrowDown, Clock, MapPin, UtensilsCrossed, DollarSign, Hash } from 'lucide-react'
import Rating from '@/components/ui/rating'
import { supabase } from '@/utils/supabase'


interface Restaurant {
  id: string
  name: string | null
  reviews: string | null
  cost: string | null
  type: string | null
  address: string | null
  time: string | null
  times_picked: number
}

export default function Page() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [picked, setPicked] = useState<Restaurant | null>(null)
  const [sortConfig, setSortConfig] = useState<{ key: keyof Restaurant; direction: 'asc' | 'desc' } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true;
    
    async function fetchRestaurants(retryCount = 0) {
      try {
        const { data, error } = await supabase
          .from('restaurants')
          .select('*')
        
        if (error) throw error
        
        if (mounted && data) {
          setRestaurants(data)
          setError(null)
        }
      } catch (err: any) {
        console.error('Error fetching restaurants:', err)
        if (retryCount < 3 && mounted) {
          setTimeout(() => fetchRestaurants(retryCount + 1), 1000 * (retryCount + 1))
        } else if (mounted) {
          setError('Failed to load restaurants. Please refresh the page.')
        }
      }
    }

    fetchRestaurants()
    return () => { mounted = false }
  }, [])

  async function weightedPick() {
    const weights = restaurants.map(r => 1 / (r.times_picked + 1))
    const total = weights.reduce((a, b) => a + b, 0)
    const rand = Math.random() * total
    let acc = 0
    
    for (let i = 0; i < restaurants.length; i++) {
      acc += weights[i]
      if (rand < acc) {
        const restaurant = restaurants[i]
        const { error } = await supabase
          .from('restaurants')
          .update({ times_picked: restaurant.times_picked + 1 })
          .eq('id', restaurant.id)
        
        if (error) {
          setError('Failed to update pick count')
          return
        }

        const newRestaurants = [...restaurants]
        newRestaurants[i].times_picked++
        setRestaurants(newRestaurants)
        setPicked(newRestaurants[i])
        break
      }
    }
  }

  async function resetPicks() {
    const { error } = await supabase
      .from('restaurants')
      .update({ times_picked: 0 })
      .neq('id', '')  // Update all rows

    if (error) {
      setError('Failed to reset pick counts')
      return
    }

    setRestaurants(restaurants.map(r => ({ ...r, times_picked: 0 })))
    setPicked(null)
  }

  function sortTable(key: keyof Restaurant) {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    const sorted = [...restaurants].sort((a, b) => {
      if (a[key] === null) return 1
      if (b[key] === null) return -1
      if (a[key]! < b[key]!) return direction === 'asc' ? -1 : 1
      if (a[key]! > b[key]!) return direction === 'asc' ? 1 : -1
      return 0
    })
    setSortConfig({ key, direction })
    setRestaurants(sorted)
  }

  return (
    <main className="p-6 mt-16 bg-background min-h-screen flex flex-col">
      {error && <div className="max-w-2xl mx-auto mb-4 p-4 bg-red-100 text-red-700 rounded-xl">{error}</div>}
      <div className="max-w-2xl mx-auto mb-8">
        <h1 className="text-4xl font-bold text-center text-primary text-shadow-xs text-shadow-slate-300 tracking-tight">Lunch Picker</h1>
      </div>

      <Tabs defaultValue="picker" className="flex-grow">
        <div className="max-w-lg mx-auto">
          <TabsList className="grid w-full grid-cols-2 bg-card border border-primary/20 rounded-xl shadow shadow-slate-300">
            <TabsTrigger value="picker" className="mx-1 data-[state=inactive]:hover:bg-primary/30 data-[state=inactive]:cursor-pointer data-[state=active]:bg-primary data-[state=active]:text-white data-[state=inactive]:bg-rose-950/5 rounded-lg transition-all">Pick for Me</TabsTrigger>
            <TabsTrigger value="data" className="mx-1 data-[state=inactive]:hover:bg-primary/30 data-[state=inactive]:cursor-pointer data-[state=active]:bg-primary data-[state=active]:text-white data-[state=inactive]:bg-rose-950/5 rounded-lg transition-all">Data Table</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="picker">
          <div className="max-w-lg mx-auto">
            <Button onClick={weightedPick} className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-xl border border-primary/20 cursor-pointer shadow shadow-slate-300 transition-all mt-1 active:bg-rose-300">
              Pick for me
            </Button>
            {picked && (
              <Card className="mt-6 border border-primary/20 shadow">
                <CardContent className="space-y-3">
                  <h2 className="text-2xl font-semibold text-primary">{picked.name}</h2>
                  <div className="flex items-center gap-2">
                    {picked.reviews ? (
                      <>
                        <Rating rating={parseFloat(picked.reviews.split('(')[0])} showValue={true} size={20}/>
                        <span className="text-sm">({picked.reviews.split('(')[1].replace(')', '')} reviews)</span>
                      </>
                    ) : (
                      <span className="text-sm">No reviews available</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="h-4 w-4" />
                    <span>{picked.type}</span>
                  </div>
                  {picked.cost && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span>{picked.cost}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{picked.address}</span>
                  </div>
                  {picked.time && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{picked.time}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    <span>Picked: {picked.times_picked}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="data">
          <div className="container mt-6 mx-auto px-4 max-w-[1200px] pb-20">
            <div className="bg-card rounded-xl border border-primary/20 shadow shadow-slate-300 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-primary/10">
                    {Object.keys(restaurants[0] || {}).map(key => (
                      <TableHead key={key} onClick={() => sortTable(key as any)} className="cursor-pointer">
                        <div className="flex items-center gap-1">
                          {key === 'times_picked' ? (
                            <div className="flex items-center gap-1">
                              <Hash className="h-4 w-4" />
                              <span>Picked</span>
                            </div>
                          ) : key === 'type' ? (
                            <div className="flex items-center gap-1">
                              <UtensilsCrossed className="h-4 w-4" />
                              <span>{key}</span>
                            </div>
                          ) : key === 'address' ? (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{key}</span>
                            </div>
                          ) : key === 'time' ? (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{key}</span>
                            </div>
                          ) : key === 'cost' ? (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              <span>{key}</span>
                            </div>
                          ) : key}
                          {sortConfig?.key === key && (
                            sortConfig.direction === 'asc' ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )
                          )}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {restaurants.map((r, i) => (
                    <TableRow key={i} className="border-b border-primary/5 hover:bg-accent/5 transition-colors">
                      {Object.entries(r).map(([key, value], j) => (
                        <TableCell key={j}>
                          {key === 'reviews' ? (
                            <div className="flex items-center gap-2">
                              {typeof value === 'string' && value.includes('(') ? (
                                <>
                                  <Rating rating={parseFloat(value.split('(')[0])} size={20} className="rating" />
                                  <span className="text-sm">({value.split('(')[1].replace(')', '')})</span>
                                </>
                              ) : (
                                '-'
                              )}
                            </div>
                          ) : (
                            <span>{value ?? '-'}</span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-center mt-6">
              <Button 
                onClick={resetPicks} 
                variant="destructive" 
                className="px-6 py-2 rounded-xl shadow shadow-slate-300 transition-all cursor-pointer active:bg-red-500"
              >
                Reset All
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  )
}
