import { Avatar, AvatarFallback } from '../ui/avatar.tsx'
import { Badge } from '../ui/badge.tsx'
import { Checkbox } from '../ui/checkbox.tsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table.tsx'

const people = [
  { name: 'Olivia Martin', email: 'olivia@example.com', role: 'Owner', active: true },
  { name: 'Jackson Lee', email: 'jackson@example.com', role: 'Member', active: true },
  { name: 'Isabella Nguyen', email: 'isabella@example.com', role: 'Member', active: false },
]

// Rows with checkboxes, avatars, and badges. A row's data-state="selected" highlights it.
export default () => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>
          <Checkbox aria-label="Select all" />
        </TableHead>
        <TableHead>Name</TableHead>
        <TableHead>Role</TableHead>
        <TableHead>Status</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {people.map((person, i) => (
        <TableRow data-state={i === 0 ? 'selected' : undefined}>
          <TableCell>
            <Checkbox aria-label={`Select ${person.name}`} checked={i === 0} />
          </TableCell>
          <TableCell>
            <div style="display: flex; align-items: center; gap: 0.75rem">
              <Avatar>
                <AvatarFallback>
                  {person.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <div style="font-weight: 500">{person.name}</div>
                <div style="color: var(--muted-foreground)">{person.email}</div>
              </div>
            </div>
          </TableCell>
          <TableCell>{person.role}</TableCell>
          <TableCell>
            <Badge variant={person.active ? 'secondary' : 'outline'}>
              {person.active ? 'Active' : 'Invited'}
            </Badge>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
)
