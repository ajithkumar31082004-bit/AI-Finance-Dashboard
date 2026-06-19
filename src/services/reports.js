import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'

// 1. GENERATE PDF REPORT
export const downloadPDFReport = (portfolio, stats, riskMetrics) => {
  const doc = new jsPDF()
  
  // Format currency helper
  const formatINR = (val) => `Rs. ${val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

  // Title & Header branding
  doc.setFillColor(11, 15, 25)
  doc.rect(0, 0, 210, 35, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(22)
  doc.text('APEX FINANCE', 14, 22)
  
  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(150, 150, 150)
  doc.text('AI-POWERED REAL-TIME PORTFOLIO REPORT', 14, 28)
  
  doc.setFontSize(8)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 150, 28)

  // Section 1: Executive Summary
  doc.setTextColor(11, 15, 25)
  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('Executive Portfolio Summary', 14, 48)

  const summaryRows = [
    ['Total Valuation', formatINR(stats.totalValue || 0)],
    ['Total Investment', formatINR(stats.totalInvestment || 0)],
    ['Net Profit / Loss', `${stats.totalPL >= 0 ? '+' : ''}${formatINR(stats.totalPL || 0)}`],
    ['Net Yield Percentage', `${(stats.totalPLPercent || 0).toFixed(2)}%`],
    ['AI Risk Profile Score', `${(stats.riskScore || 0).toFixed(1)} / 10 (${stats.riskScore > 7 ? 'High Concentration' : stats.riskScore > 4 ? 'Moderate' : 'Conservative'})`],
  ]

  doc.autoTable({
    startY: 52,
    head: [['Key Performance Metric', 'Value']],
    body: summaryRows,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    columnStyles: { 0: { fontStyle: 'bold' } },
  })

  // Section 2: Asset Allocation Details
  const startAssetY = doc.lastAutoTable.finalY + 12
  doc.setFontSize(14)
  doc.setFont('Helvetica', 'bold')
  doc.text('Current Asset Holdings', 14, startAssetY)

  const holdingsRows = portfolio.map((h) => {
    const val = h.quantity * h.current_price
    const pl = val - (h.quantity * h.buy_price)
    return [
      h.stock_symbol,
      h.quantity,
      formatINR(h.buy_price),
      formatINR(h.current_price),
      formatINR(val),
      `${pl >= 0 ? '+' : ''}${formatINR(pl)}`
    ]
  })

  doc.autoTable({
    startY: startAssetY + 4,
    head: [['Ticker', 'Qty', 'Avg Cost', 'Current Price', 'Market Value', 'Total Return']],
    body: holdingsRows.length > 0 ? holdingsRows : [['No held assets found.', '-', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: [16, 185, 129] },
  })

  // Section 3: Sector Risk Metrics
  const startRiskY = doc.lastAutoTable.finalY + 12
  doc.setFontSize(14)
  doc.setFont('Helvetica', 'bold')
  doc.text('Sector Concentration & Downside Risk', 14, startRiskY)

  const riskRows = Object.entries(riskMetrics.sectorWeights || {}).map(([sec, weight]) => [
    sec,
    `${weight}%`,
    riskMetrics.volatilityIndex,
    `${riskMetrics.drawdownPercent}%`
  ])

  doc.autoTable({
    startY: startRiskY + 4,
    head: [['Sector Ticker', 'Weight', 'Portfolio Volatility', 'Max Expected Drawdown']],
    body: riskRows.length > 0 ? riskRows : [['No assets.', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: [245, 158, 11] },
  })

  // Footer disclaimer
  const finalY = doc.lastAutoTable.finalY + 15
  doc.setFontSize(8)
  doc.setFont('Helvetica', 'italic')
  doc.setTextColor(120, 120, 120)
  doc.text('Disclaimer: This report is dynamically compiled from virtual simulation data and does not constitute financial advice.', 14, finalY)

  // Save PDF
  doc.save('apex_portfolio_report.pdf')
}

// 2. GENERATE EXCEL REPORT
export const downloadExcelReport = (portfolio, stats, riskMetrics) => {
  const wb = XLSX.utils.book_new()

  // Sheet 1: Executive Summary
  const summaryData = [
    { Metric: 'Total Valuation', Value: stats.totalValue },
    { Metric: 'Total Investment', Value: stats.totalInvestment },
    { Metric: 'Net Returns (INR)', Value: stats.totalPL },
    { Metric: 'Net Returns (%)', Value: stats.totalPLPercent },
    { Metric: 'AI Risk Rating', Value: stats.riskScore }
  ]
  const wsSummary = XLSX.utils.json_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  // Sheet 2: Holdings Ledger
  const holdingsData = portfolio.map((h) => ({
    Ticker: h.stock_symbol,
    Quantity: h.quantity,
    'Average Buy Price': h.buy_price,
    'Current Live Price': h.current_price,
    'Total Valuation': h.quantity * h.current_price,
    'Net Gains/Losses': (h.quantity * h.current_price) - (h.quantity * h.buy_price)
  }))
  const wsHoldings = XLSX.utils.json_to_sheet(holdingsData.length > 0 ? holdingsData : [{ Ticker: 'No active holdings.', Quantity: 0 }])
  XLSX.utils.book_append_sheet(wb, wsHoldings, 'Holdings')

  // Sheet 3: Sector Allocations
  const allocationData = Object.entries(riskMetrics.sectorWeights || {}).map(([sec, weight]) => ({
    Sector: sec,
    'Allocation Weight (%)': weight,
    'Portfolio Volatility': riskMetrics.volatilityIndex,
    'Drawdown Exposure (%)': riskMetrics.drawdownPercent
  }))
  const wsAlloc = XLSX.utils.json_to_sheet(allocationData.length > 0 ? allocationData : [{ Sector: 'No assets.', Weight: 0 }])
  XLSX.utils.book_append_sheet(wb, wsAlloc, 'Risk Allocations')

  // Write files
  XLSX.writeFile(wb, 'apex_portfolio_sheet.xlsx')
}
