-- The feed's pages read posts in this order, newest first, from a post's date and id.
create index posts_by_date on posts (date, id);
