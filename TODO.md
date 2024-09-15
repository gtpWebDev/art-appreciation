# TO-Do List

## Data structure

### Combine Purchase and Listing tables into Transaction table

Splitting transactions into the Purchase and Listing tables was originally done because
the data differs slightly - mainly that purchases have prices, and that for purchases
the buyer is the important account, whereas with listings, the seller is the important
account. However, I almost always need to consider Purchases with Listings, and this requires union queries. It would simplify many of the queries that depend on both purchases and listings, and would be much more performant. (Single Nft transaction query test reduced from 200ms to 100ms).

### Tidy up of ETL process

1. Check in-code documentation
2. Check error handling is appropriate for job scheduled process
3. Review all procedures to ensure good programming
4. Add testing as appropriate for full process.
