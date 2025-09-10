/* global Blob, URL */
// Utility functions for data persistence
export const saveCalculation = (type, data) => {
  const calculations = getCalculations(type)
  calculations.push({
    ...data,
    id: Date.now(),
    date: new Date().toISOString(),
  })
  localStorage.setItem(`${type}Calculations`, JSON.stringify(calculations))
}

export const getCalculations = type => {
  const stored = localStorage.getItem(`${type}Calculations`)
  return stored ? JSON.parse(stored) : []
}

export const deleteCalculation = (type, id) => {
  const calculations = getCalculations(type)
  const filtered = calculations.filter(calc => calc.id !== id)
  localStorage.setItem(`${type}Calculations`, JSON.stringify(filtered))
}

export const exportToCSV = (data, filename) => {
  if (!data.length) return

  const headers = Object.keys(data[0]).filter(key => key !== 'id')
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => JSON.stringify(row[header])).join(','),
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.setAttribute('download', `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const exportToPDF = async (element, filename) => {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF()

  pdf.html(element, {
    callback: function (pdf) {
      pdf.save(`${filename}.pdf`)
    },
    x: 10,
    y: 10,
  })
}
