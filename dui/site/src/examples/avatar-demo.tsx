import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar.tsx'

export default () => (
  <>
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
    <Avatar>
      <AvatarImage src="/missing.png" alt="" />
      <AvatarFallback>ER</AvatarFallback>
    </Avatar>
  </>
)
