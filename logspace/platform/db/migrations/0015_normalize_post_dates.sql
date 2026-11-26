-- Post dates that don't exist, like 2026-02-28T24:00:00Z or 2026-02-30T12:00:00Z, which posts
-- were once saved with, become the times they meant, as JavaScript reads them: 2026-03-01T00:00:00Z
-- and 2026-03-02T12:00:00Z. Through julianday, since strftime alone leaves 24:00 as it is.
update posts set date = strftime('%Y-%m-%dT%H:%M:%SZ', julianday(date))
where date != strftime('%Y-%m-%dT%H:%M:%SZ', julianday(date));
