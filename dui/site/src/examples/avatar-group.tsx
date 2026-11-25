import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar.tsx'

export default () => (
  <div style="display: flex">
    {['shadcn', 'leerob', 'evilrabbit'].map((user, i) => (
      <Avatar style={`margin-left: ${i ? '-0.5rem' : '0'}; outline: 2px solid var(--background)`}>
        <AvatarImage src={`https://github.com/${user}.png`} alt={`@${user}`} />
        <AvatarFallback>{user.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
    ))}
  </div>
)
