'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowUp, ArrowDown, Clock, MapPin, UtensilsCrossed, DollarSign, Hash, ChevronLeft, ChevronRight, Map } from 'lucide-react'
import Rating from '@/components/ui/rating'
import { toast } from 'sonner'
import { useSupabase } from '@/hooks/useSupabase'
import { Input } from '@/components/ui/input'

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
  const supabase = useSupabase()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [picked, setPicked] = useState<Restaurant | null>(null)
  const [sortConfig, setSortConfig] = useState<{ key: keyof Restaurant; direction: 'asc' | 'desc' }>({
    key: 'times_picked',
    direction: 'desc'
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasReset, setHasReset] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const itemsPerPage = 10

  const filteredItems = restaurants.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.address.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const currentItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  useEffect(() => {
    if (!supabase) return

    const fetchRestaurants = async () => {
      try {
        const { data, error } = await supabase
          .from('restaurants')
          .select('*')
        
        if (error) {
          setError('Failed to load restaurants')
          toast.error('Failed to load restaurants')
          return
        }
        
        if (data) {
          const validatedData = data
            .filter(isValidRestaurant)
            .map((r: Restaurant) => ({
              ...r,
              times_picked: Number(r.times_picked)
            }))
          // Sort the data by times_picked in descending order by default
          const sortedData = [...validatedData].sort((a, b) => b.times_picked - a.times_picked)
          setRestaurants(sortedData)
        }
      } finally {
        setLoading(false)
      }
    }

    if (supabase) {
      fetchRestaurants()
    }
  }, [supabase])

  const weightedPick = async () => {
    if (!supabase) return

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
    if (!supabase) return
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
    setCurrentPage(1) // Reset pagination when sorting
  }

  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[45vh]">
        <div className="text-primary text-shadow-xs text-shadow-slate-300 text-4xl">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-[45vh]">
        <div className="text-red-500 text-xl">{error}</div>
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
          <p className="text-center font-medium text-muted-foreground mt-2">
            {restaurants.length} restaurants available
          </p>
        </div>

        <Tabs defaultValue="picker" className="flex-grow" onValueChange={(value) => {
          if (value === 'data') {
            const sorted = [...restaurants].sort((a, b) => b.times_picked - a.times_picked)
            setRestaurants(sorted)
            setSortConfig({ key: 'times_picked', direction: 'desc' })
            setCurrentPage(1) // Reset pagination when switching to data table
          }
        }}>
          <div className="max-w-lg mx-auto">
            <TabsList className="grid w-full h-11 mb-5 grid-cols-2 bg-card rounded-lg shadow">
              <TabsTrigger value="picker" className="ml-1 data-[state=inactive]:hover:bg-primary/30 data-[state=inactive]:cursor-pointer data-[state=active]:bg-primary data-[state=active]:text-white data-[state=inactive]:bg-rose-950/5 rounded-l-md rounded-r-none transition-all">Pick for Me</TabsTrigger>
              <TabsTrigger value="data" className="mr-1 data-[state=inactive]:hover:bg-primary/30 data-[state=inactive]:cursor-pointer data-[state=active]:bg-primary data-[state=active]:text-white data-[state=inactive]:bg-rose-950/5 rounded-r-md rounded-l-none transition-all">Data Table</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="picker">
            <div className="max-w-lg mx-auto">
              <Button onClick={weightedPick} className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-lg border border-primary/20 cursor-pointer shadow shadow-slate-300 transition-all mt-1 active:bg-rose-300">
                Pick for Me
              </Button>
              {picked && (
                <Card className="mt-6 border border-primary/20 shadow">
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-semibold text-primary">{picked.name}</h2>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(picked.name + ' ' + picked.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-8 h-8 text-primary hover:text-primary/80 transition-colors"
                      >
                        <Map className="h-6 w-6" />
                      </a>
                    </div>
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
              <div className="mb-6">
                <Input
                  placeholder="Search restaurants..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1) // Reset to first page on search
                  }}
                  className="max-w-sm bg-rose-950/5 mx-auto"
                />
              </div>
              <div className="bg-card rounded-lg border border-primary/20 shadow shadow-slate-300 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-primary/10">
                      {!error && (
                        <TableHead>
                          <div className="flex items-center gap-1">
                            <span>Maps</span>
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
                              <Map className="h-7 w-7" />
                            </a>
                          </TableCell>
                        )}
                        {Object.entries(r)
                          .filter(([key]) => key !== 'id')
                          .map(([key, value], j) => (
                            <TableCell key={j} className={key === 'times_picked' ? 'text-center' : ''}>
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
                  onClick={() => setCurrentPage(p => Math.max(1, p - 5))}
                  disabled={currentPage <= 5}
                  variant="outline"
                  size="icon"
                  className="cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <ChevronLeft className="h-4 w-4 -ml-2" />
                </Button>
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
                <Button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 5))}
                  disabled={currentPage > totalPages - 5}
                  variant="outline"
                  size="icon"
                  className="cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                  <ChevronRight className="h-4 w-4 -ml-2" />
                </Button>
              </div>
              <div className="flex justify-center mt-6">
                <Button 
                  onClick={resetPicks} 
     
                  disabled={hasReset}
                  className="px-6 py-2 mt-8 rounded-lg shadow-xs shadow-slate-300 transition-all cursor-pointer bg-rose-900/25 active:bg-rose-400"
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
