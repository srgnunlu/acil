'use client'

import { useState } from 'react'
import { Filter, X, Plus, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'between'
  | 'in'
  | 'is_empty'
  | 'is_not_empty'

export interface FilterField {
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'date' | 'boolean'
  operators?: FilterOperator[]
  options?: { value: string; label: string }[]
}

export interface FilterRule {
  id: string
  field: string
  operator: FilterOperator
  value: any
}

export interface FilterGroup {
  id: string
  combinator: 'and' | 'or'
  rules: FilterRule[]
}

interface AdvancedFiltersProps {
  fields: FilterField[]
  value: FilterGroup
  onChange: (group: FilterGroup) => void
  onApply?: () => void
  onClear?: () => void
}

const OPERATOR_LABELS: Record<FilterOperator, string> = {
  equals: 'Eşittir',
  not_equals: 'Eşit Değil',
  contains: 'İçerir',
  not_contains: 'İçermez',
  greater_than: 'Büyüktür',
  less_than: 'Küçüktür',
  between: 'Aralıkta',
  in: 'İçinde',
  is_empty: 'Boş',
  is_not_empty: 'Dolu',
}

export function AdvancedFilters({
  fields,
  value,
  onChange,
  onApply,
  onClear,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  const addRule = () => {
    const newRule: FilterRule = {
      id: crypto.randomUUID(),
      field: fields[0]?.key || '',
      operator: 'equals',
      value: '',
    }

    onChange({
      ...value,
      rules: [...value.rules, newRule],
    })
  }

  const updateRule = (ruleId: string, updates: Partial<FilterRule>) => {
    onChange({
      ...value,
      rules: value.rules.map((rule) => (rule.id === ruleId ? { ...rule, ...updates } : rule)),
    })
  }

  const removeRule = (ruleId: string) => {
    onChange({
      ...value,
      rules: value.rules.filter((rule) => rule.id !== ruleId),
    })
  }

  const toggleCombinator = () => {
    onChange({
      ...value,
      combinator: value.combinator === 'and' ? 'or' : 'and',
    })
  }

  const handleApply = () => {
    onApply?.()
    setIsOpen(false)
  }

  const handleClear = () => {
    onChange({
      ...value,
      rules: [],
    })
    onClear?.()
  }

  const activeFilterCount = value.rules.length

  return (
    <div className="relative">
      {/* Trigger Button */}
      <Button
        variant="outline"
        size="sm"
        leftIcon={<Filter className="w-4 h-4" />}
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        Gelişmiş Filtreler
        {activeFilterCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
      </Button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-[600px] bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Gelişmiş Filtreler</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Rules */}
              <div className="p-4 max-h-[400px] overflow-y-auto">
                {value.rules.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Filter className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm">Henüz filtre eklenmedi</p>
                    <p className="text-xs mt-1">Filtre eklemek için butona tıklayın</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {value.rules.map((rule, index) => {
                      const field = fields.find((f) => f.key === rule.field)
                      const operators = field?.operators || ['equals', 'not_equals']

                      return (
                        <div key={rule.id}>
                          {/* Combinator */}
                          {index > 0 && (
                            <div className="flex justify-center -my-1.5">
                              <button
                                onClick={toggleCombinator}
                                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-medium text-gray-700 transition-colors"
                              >
                                {value.combinator === 'and' ? 'VE' : 'VEYA'}
                                <ChevronDown className="w-3 h-3 inline ml-1" />
                              </button>
                            </div>
                          )}

                          {/* Rule */}
                          <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                            {/* Field */}
                            <select
                              value={rule.field}
                              onChange={(e) => updateRule(rule.id, { field: e.target.value })}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              {fields.map((field) => (
                                <option key={field.key} value={field.key}>
                                  {field.label}
                                </option>
                              ))}
                            </select>

                            {/* Operator */}
                            <select
                              value={rule.operator}
                              onChange={(e) =>
                                updateRule(rule.id, { operator: e.target.value as FilterOperator })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              {operators.map((op) => (
                                <option key={op} value={op}>
                                  {OPERATOR_LABELS[op]}
                                </option>
                              ))}
                            </select>

                            {/* Value */}
                            {rule.operator !== 'is_empty' && rule.operator !== 'is_not_empty' && (
                              <>
                                {field?.type === 'select' && field.options ? (
                                  <select
                                    value={rule.value}
                                    onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  >
                                    <option value="">Seçin...</option>
                                    {field.options.map((opt) => (
                                      <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type={field?.type === 'number' ? 'number' : 'text'}
                                    value={rule.value}
                                    onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                                    placeholder="Değer girin..."
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                )}
                              </>
                            )}

                            {/* Remove */}
                            <button
                              onClick={() => removeRule(rule.id)}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Add Rule */}
                <button
                  onClick={addRule}
                  className="w-full mt-3 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Filtre Ekle
                </button>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
                <Button variant="ghost" size="sm" onClick={handleClear}>
                  Temizle
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                    İptal
                  </Button>
                  <Button variant="default" size="sm" onClick={handleApply}>
                    Uygula ({activeFilterCount})
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
