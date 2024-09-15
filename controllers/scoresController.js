// this query works for a single Nft to get the score (over all purchases)
const singleNftSQL = `
with purchase_totals as (
  select p.nft_id, sum(p.score) as p_total_score from "Purchase" p
  where p.nft_id = 'kHaCE_145971'
  group by p.nft_id
  ),
  listing_totals as (
  select l.nft_id, sum(l.score) as l_total_score from "Listing" l
  where l.nft_id = 'kHaCE_145971'
  group by l.nft_id
  )
  select
    n.id as nft_id,
    coalesce(purchase_totals.p_total_score,0) as total_purchase_scores,
    coalesce(listing_totals.l_total_score,0) as total_listing_scores,
    coalesce(purchase_totals.p_total_score,0) + coalesce(listing_totals.l_total_score,0) as total_nft_scores
    from "Nft" n
  left join purchase_totals on n.id = purchase_totals.nft_id
  left join listing_totals on n.id = listing_totals.nft_id
  where n.id = 'kHaCE_145971'
  order by total_nft_scores asc;
  `;

// this query works to get all nft scores

const SQL = `
explain analyze
with purchase_totals as (
select p.nft_id, sum(p.score) as p_total_score from "Purchase" p
group by p.nft_id
),
listing_totals as (
select l.nft_id, sum(l.score) as l_total_score from "Listing" l
group by l.nft_id
)
select
	n.id as nft_id,
	coalesce(purchase_totals.p_total_score,0) as total_purchase_scores,
	coalesce(listing_totals.l_total_score,0) as total_listing_scores,
	coalesce(purchase_totals.p_total_score,0) + coalesce(listing_totals.l_total_score,0) as total_nft_scores
	from "Nft" n
left join purchase_totals on n.id = purchase_totals.nft_id
left join listing_totals on n.id = listing_totals.nft_id
order by total_nft_scores asc;
`;

// This is the step by step approach to creating a materialized view
// to speed it up

const materialize_SQL = `
create materialized view purchase_totals_view as (
	select p.nft_id, sum(p.score) as p_total_score from "Purchase" p
	group by p.nft_id
);

create index idx_purchase_totals_nft_id on purchase_totals_view(nft_id);

create materialized view listing_totals_view as (
	select l.nft_id, sum(l.score) as l_total_score from "Listing" l
	group by l.nft_id
);

create index idx_purchase_totals_nft_id on listing_totals_view(nft_id);

select
	n.id as nft_id,
	coalesce(pv.p_total_score,0) as total_purchase_scores,
	coalesce(lv.l_total_score,0) as total_listing_scores,
	coalesce(pv.p_total_score,0) + coalesce(lv.l_total_score,0) as total_nft_scores
	from "Nft" n
left join purchase_totals_view pv on n.id = pv.nft_id
left join listing_totals_view lv on n.id = lv.nft_id
order by total_nft_scores asc;
`;
