'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowUp, ArrowDown, Clock, MapPin, UtensilsCrossed, DollarSign, Hash, ChevronLeft, ChevronRight, Map } from 'lucide-react'
import Rating from '@/components/ui/rating'
import { supabase } from '@/utils/supabase'
import { toast } from 'sonner'


interface Restaurant {
  id: string
  name: string
  reviews: string | null
  cost: string | null
  type: string
  address: string
  time: string | null
  times_picked: number
}

const isValidRestaurant = (data: any): data is Restaurant => {
  return typeof data.id === 'string' &&
    typeof data.name === 'string' &&
    typeof data.type === 'string' &&
    typeof data.address === 'string' &&
    (typeof data.times_picked === 'number' || typeof data.times_picked === 'string') &&
    (data.reviews === null || typeof data.reviews === 'string') &&
    (data.cost === null || typeof data.cost === 'string') &&
    (data.time === null || typeof data.time === 'string')
}

export default function Page() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [picked, setPicked] = useState<Restaurant | null>(null)
  const [sortConfig, setSortConfig] = useState<{ key: keyof Restaurant; direction: 'asc' | 'desc' } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasReset, setHasReset] = useState(false)
  const itemsPerPage = 10
  const totalPages = Math.ceil(restaurants.length / itemsPerPage)
  const currentItems = restaurants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const { data, error } = await supabase
          .from('restaurants')
          .select('*')
        
        if (error) throw error
        
        if (data) {
          const validatedData = data
            .filter(isValidRestaurant)
            .map(r => ({
              ...r,
              times_picked: Number(r.times_picked)
            }))
          setRestaurants(validatedData)
        }
      } catch (err: any) {
        setError('Failed to load restaurants')
        toast.error('Failed to load restaurants')
      } finally {
        setLoading(false)
      }
    }

    fetchRestaurants()
  }, [])

  const weightedPick = async () => {
    const weights = restaurants.map(r => 1 / (Number(r.times_picked) + 1))
    const total = weights.reduce((a, b) => a + b, 0)
    const rand = Math.random() * total
    let acc = 0
    
    for (let i = 0; i < restaurants.length; i++) {
      acc += weights[i]
      if (rand < acc) {
        const restaurant = restaurants[i]
        try {
          const { error } = await supabase
            .from('restaurants')
            .update({ times_picked: Number(restaurant.times_picked) + 1 })
            .eq('id', restaurant.id)
          
          if (error) throw error

          const newRestaurants = [...restaurants]
          newRestaurants[i] = {
            ...newRestaurants[i],
            times_picked: Number(newRestaurants[i].times_picked) + 1
          }
          setRestaurants(newRestaurants)
          setPicked(newRestaurants[i])
        } catch (err) {
          console.error('Error updating pick count:', err)
          toast.error('Failed to update restaurant')
        }
        break
      }
    }
  }

  const resetPicks = async () => {
    if (hasReset) {
      toast.error('Reset has already been used')
      return
    }

    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ times_picked: 0 })
        .gte('times_picked', 0)

      if (error) throw error

      setRestaurants(restaurants.map(r => ({ ...r, times_picked: 0 })))
      setPicked(null)
      setHasReset(true)
      toast.success('All pick counts have been reset')
    } catch (err) {
      console.error('Error resetting picks:', err)
      toast.error('Failed to reset restaurants')
    }
  }

  function sortTable(key: keyof Restaurant) {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    
    const sorted = [...restaurants].sort((a, b) => {
      let aValue = a[key]
      let bValue = b[key]
      
      if (aValue === null && bValue === null) return 0
      if (aValue === null) return 1
      if (bValue === null) return -1
      
      if (key === 'reviews') {
        const aRating = parseFloat(aValue.toString().split('(')[0])
        const bRating = parseFloat(bValue.toString().split('(')[0])
        return direction === 'asc' ? aRating - bRating : bRating - aRating
      }
      
      if (key === 'times_picked') {
        const aNum = parseInt(aValue.toString())
        const bNum = parseInt(bValue.toString())
        return direction === 'asc' ? aNum - bNum : bNum - aNum
      }
      
      return direction === 'asc' ?
        aValue.toString().localeCompare(bValue.toString()) :
        bValue.toString().localeCompare(aValue.toString())
    })
    
    setSortConfig({ key, direction })
    setRestaurants(sorted)
  }

  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-primary text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-6 mt-8 bg-background min-h-screen flex flex-col">
      <>
        <div className="max-w-2xl mx-auto my-8">
          <h1 className="text-4xl font-bold text-center text-primary text-shadow-xs text-shadow-slate-300 tracking-tight">
            Lunch Picker
          </h1>
        </div>

        <Tabs defaultValue="picker" className="flex-grow">
          <div className="max-w-lg mx-auto">
            <TabsList className="grid w-full h-11 grid-cols-2 bg-card rounded-lg shadow">
              <TabsTrigger value="picker" className="ml-1 data-[state=inactive]:hover:bg-primary/30 data-[state=inactive]:cursor-pointer data-[state=active]:bg-primary data-[state=active]:text-white data-[state=inactive]:bg-rose-950/5 rounded-l-md rounded-r-none transition-all">Pick for Me</TabsTrigger>
              <TabsTrigger value="data" className="mr-1 data-[state=inactive]:hover:bg-primary/30 data-[state=inactive]:cursor-pointer data-[state=active]:bg-primary data-[state=active]:text-white data-[state=inactive]:bg-rose-950/5 rounded-r-md rounded-l-none transition-all">Data Table</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="picker">
            <div className="max-w-lg mx-auto">
              <Button onClick={weightedPick} className="w-full mb-4 bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-lg border border-primary/20 cursor-pointer shadow shadow-slate-300 transition-all mt-1 active:bg-rose-300">
                Pick for Me
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
                        <span>{picked.cost.replace('$', '')}</span>
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
            <div className="container mt-6 mx-auto max-w-[1200px] pb-20">
              <div className="bg-card rounded-lg border border-primary/20 shadow shadow-slate-300 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-primary/10">
                      {!error && (
                        <TableHead>
                          <div className="flex items-center gap-1">
                            <Map className="h-4 w-4 " />
                            <span>Map</span>
                          </div>
                        </TableHead>
                      )}
                      {Object.keys(restaurants[0] || {})
                        .filter(key => key !== 'id')
                        .map(key => (
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
                                <span>{capitalizeFirst(key)}</span>
                              </div>
                            ) : key === 'address' ? (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                <span>{capitalizeFirst(key)}</span>
                              </div>
                            ) : key === 'time' ? (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{capitalizeFirst(key)}</span>
                              </div>
                            ) : key === 'cost' ? (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                <span>{capitalizeFirst(key)}</span>
                              </div>
                            ) : capitalizeFirst(key)}
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
                    {currentItems.map((r, i) => (
                      <TableRow key={r.id} className="border-b border-primary/5 hover:bg-accent/5 transition-colors">
                        {!error && (
                          <TableCell>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name + ' ' + r.address)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center w-8 h-8 text-primary hover:text-primary/80 transition-colors"
                            >
                              <Map className="h-5 w-5" />
                            </a>
                          </TableCell>
                        )}
                        {Object.entries(r)
                          .filter(([key]) => key !== 'id')
                          .map(([key, value], j) => (
                            <TableCell key={j} className={key === 'times_picked' ? 'text-right' : ''}>
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
                              ) : key === 'cost' ? (
                                <span>{value ? value.replace('$', '') : '-'}</span>
                              ) : key === 'times_picked' ? (
                                <span>{(value as number).toString()}</span>
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
              <div className="flex justify-center items-center gap-4 mt-4 mb-6">
                <Button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="icon"
                  className="cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-[100px] text-center">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="icon"
                  className="cursor-pointer"

                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex justify-center mt-6">
                <Button 
                  onClick={resetPicks} 
                  variant="destructive" 
                  disabled={hasReset}
                  className="px-6 py-2 rounded-xl shadow shadow-slate-300 transition-all cursor-pointer active:bg-red-500"
                >
                  {hasReset ? 'Reset Used' : 'Reset All'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </>
    </div>
  )
}
