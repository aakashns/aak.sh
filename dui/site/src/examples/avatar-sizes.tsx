import { Avatar, AvatarFallback } from '../ui/avatar.tsx'

export default () => (
  <>
    <Avatar style="width: 1.5rem; height: 1.5rem">
      <AvatarFallback style="font-size: 0.625rem">SM</AvatarFallback>
    </Avatar>
    <Avatar>
      <AvatarFallback>MD</AvatarFallback>
    </Avatar>
    <Avatar style="width: 3rem; height: 3rem">
      <AvatarFallback>LG</AvatarFallback>
    </Avatar>
  </>
)
