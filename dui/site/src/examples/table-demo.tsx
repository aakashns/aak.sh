import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table.tsx'

const invoices = [
  { invoice: 'INV001', status: 'Paid', method: 'Credit card', amount: 250 },
  { invoice: 'INV002', status: 'Pending', method: 'PayPal', amount: 150 },
  { invoice: 'INV003', status: 'Unpaid', method: 'Bank transfer', amount: 350 },
  { invoice: 'INV004', status: 'Paid', method: 'Credit card', amount: 450 },
]

const usd = (n: number) => `$${n.toFixed(2)}`

export default () => (
  <Table>
    <TableCaption>A list of your recent invoices.</TableCaption>
    <TableHeader>
      <TableRow>
        <TableHead style="width: 6rem">Invoice</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Method</TableHead>
        <TableHead style="text-align: right">Amount</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {invoices.map((row) => (
        <TableRow>
          <TableCell style="font-weight: 500">{row.invoice}</TableCell>
          <TableCell>{row.status}</TableCell>
          <TableCell>{row.method}</TableCell>
          <TableCell style="text-align: right">{usd(row.amount)}</TableCell>
        </TableRow>
      ))}
    </TableBody>
    <TableFooter>
      <TableRow>
        <TableCell colspan="3">Total</TableCell>
        <TableCell style="text-align: right">
          {usd(invoices.reduce((sum, row) => sum + row.amount, 0))}
        </TableCell>
      </TableRow>
    </TableFooter>
  </Table>
)
