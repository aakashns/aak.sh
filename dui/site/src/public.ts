// The files the site serves as they are, embedded in the binary.
import appleTouchIcon from '../public/apple-touch-icon.png' with { type: 'file' }
import datastar from '../public/datastar.js' with { type: 'file' }
import favicon from '../public/favicon.ico' with { type: 'file' }
import icon from '../public/icon.svg' with { type: 'file' }
import robots from '../public/robots.txt' with { type: 'file' }
import social from '../public/social.png' with { type: 'file' }

export const PUBLIC_FILES: Record<string, string> = {
  '/apple-touch-icon.png': appleTouchIcon,
  '/datastar.js': datastar,
  '/favicon.ico': favicon,
  '/icon.svg': icon,
  '/robots.txt': robots,
  '/social.png': social,
}
