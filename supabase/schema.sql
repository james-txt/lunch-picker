create table if not exists restaurants (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  reviews text,
  cost text,
  type text not null,
  address text not null,
  time text,
  times_picked integer not null default 0 check (times_picked >= 0)
);